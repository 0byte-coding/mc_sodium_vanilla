import { $ } from "bun"
import { config } from "./config"
import { export_modpack } from "./export_modpack"
import { checkout_branch, checkout_tag, find_latest_tag, parse_tag } from "./git_tag_manager"
import { install_packwiz_content } from "./install_mods"
import { get_safe_mod_list, mod_list } from "./mod_list"
import { resource_pack_list } from "./resource_pack_list"
import { upload_to_modrinth } from "./upload_to_modrinth"
import { get_current_minecraft_versions } from "./version_discovery"

/**
 * Cleans the working directory by resetting git-tracked changes.
 * This is necessary before checking out tags to avoid conflicts.
 */
async function cleanup_working_directory(): Promise<void> {
  try {
    // Reset all tracked files to HEAD
    await $`git reset --hard HEAD`.quiet()
    // Clean untracked files and directories (including generated .mrpack files)
    await $`git clean -fd`.quiet()
  } catch (error) {
    console.error("Warning: Failed to clean working directory:", error)
  }
}

interface PublishResult {
  mc_version: string
  status: "published" | "skipped" | "error"
  reason?: string
  error?: string
}

/**
 * Publishes a single Minecraft version to Modrinth.
 * Only publishes if the latest tag differs from the previous tag (has changes).
 */
async function publish_version(mc_version: string, index: number, total: number): Promise<PublishResult> {
  console.log(`\n${"=".repeat(80)}`)
  console.log(`[${index}/${total}] Publishing Minecraft ${mc_version}`)
  console.log("=".repeat(80))

  try {
    // Find latest tag
    const latest_tag = await find_latest_tag(mc_version)

    if (!latest_tag) {
      console.log("  ⏭  No tag found - skipping")
      return {
        mc_version,
        status: "skipped",
        reason: "No tag found"
      }
    }

    console.log(`  ✓ Found latest tag: ${latest_tag}`)

    // Parse to get the modpack version
    const parsed = parse_tag(latest_tag)
    if (!parsed) {
      console.log("  ⏭  Could not parse tag - skipping")
      return {
        mc_version,
        status: "skipped",
        reason: "Could not parse tag"
      }
    }

    const modpack_version = parsed.modpack_version

    // Clean working directory before checkout
    console.log("\n  Cleaning working directory...")
    await cleanup_working_directory()

    // Checkout the tag
    console.log(`  Checking out tag ${latest_tag}...`)
    await checkout_tag(latest_tag)

    // Set MC_VERSION environment variable for config
    process.env.MC_VERSION = mc_version
    config.app.mc_version = mc_version

    // Build and upload safe version
    console.log("\n  Building SAFE version...")
    const safe_mod_list = get_safe_mod_list()
    const installation_result_safe = await install_packwiz_content(safe_mod_list, resource_pack_list)

    if (installation_result_safe.failed.length > 0) {
      console.log(`  ⚠  ${installation_result_safe.failed.length} mod(s) failed in safe version`)
    } else {
      console.log("  ✓ All mods installed successfully for safe version")
    }

    const safe_export = await export_modpack("safe")
    if (!safe_export) {
      throw new Error("Failed to export safe version")
    }
    console.log(`  ✓ Exported safe version: ${safe_export}`)

    console.log("  Uploading SAFE version to Modrinth...")
    const safe_upload_success = await upload_to_modrinth({
      file_path: safe_export,
      version_title: `Sodium Vanilla ${mc_version} (Safe) - v${modpack_version}`,
      version_number: `${mc_version}_${modpack_version}_safe`,
      changelog: `Safe to use version for servers for Minecraft ${mc_version}`,
      project_id: config.app.modrinth_project_id,
      game_versions: [mc_version],
      loaders: ["fabric"]
    })

    if (!safe_upload_success) {
      throw new Error("Failed to upload safe version to Modrinth")
    }
    console.log("  ✓ Uploaded safe version")

    // Build and upload full version
    console.log("\n  Building FULL version...")
    const installation_result_full = await install_packwiz_content(mod_list, resource_pack_list)

    if (installation_result_full.failed.length > 0) {
      console.log(`  ⚠  ${installation_result_full.failed.length} mod(s) failed in full version`)
    } else {
      console.log("  ✓ All mods installed successfully for full version")
    }

    const full_export = await export_modpack("full")
    if (!full_export) {
      throw new Error("Failed to export full version")
    }
    console.log(`  ✓ Exported full version: ${full_export}`)

    console.log("  Uploading FULL version to Modrinth...")
    const full_upload_success = await upload_to_modrinth({
      file_path: full_export,
      version_title: `Sodium Vanilla ${mc_version} (Full) - v${modpack_version}`,
      version_number: `${mc_version}_${modpack_version}_full`,
      changelog: `Full version with all mods including possibly unsafe mods to use on servers for Minecraft ${mc_version}`,
      project_id: config.app.modrinth_project_id,
      game_versions: [mc_version],
      loaders: ["fabric"]
    })

    if (!full_upload_success) {
      throw new Error("Failed to upload full version to Modrinth")
    }
    console.log("  ✓ Uploaded full version")

    // Clean up and return to main branch
    console.log("\n  Cleaning up and returning to main branch...")
    await cleanup_working_directory()
    await checkout_branch("main")

    return {
      mc_version,
      status: "published"
    }
  } catch (error) {
    console.error(`  ❌ Error publishing ${mc_version}:`, error)

    // Try to clean up and return to main branch
    try {
      console.log("  Cleaning up and returning to main branch...")
      await cleanup_working_directory()
      await checkout_branch("main")
    } catch (cleanup_error) {
      console.error("  ⚠  Failed to return to main branch:", cleanup_error)
    }

    return {
      mc_version,
      status: "error",
      error: String(error)
    }
  }
}

/**
 * Phase 2: Publish changed versions to Modrinth.
 *
 * Compares the latest tag with the previous tag for each Minecraft version.
 * Only publishes versions where the tags point to different commits (have changes).
 */
export async function publish_to_modrinth(): Promise<void> {
  console.log("=".repeat(80))
  console.log("PHASE 2: PUBLISH TO MODRINTH")
  console.log("=".repeat(80))
  console.log()

  // Fetch current Minecraft versions
  console.log("Fetching Minecraft versions from Modrinth API...")
  const versions = await get_current_minecraft_versions()
  console.log(`✓ Found ${versions.length} valid Minecraft versions (>= 1.14)`)

  // Publish each version
  const results: PublishResult[] = []
  for (let i = 0; i < versions.length; i++) {
    const version = versions[i]
    if (!version) continue
    const result = await publish_version(version, i + 1, versions.length)
    results.push(result)
  }

  // Summary report
  console.log(`\n${"=".repeat(80)}`)
  console.log("SUMMARY")
  console.log("=".repeat(80))

  const published = results.filter((r) => r.status === "published")
  const skipped = results.filter((r) => r.status === "skipped")
  const errors = results.filter((r) => r.status === "error")

  console.log(`Total: ${results.length} | Published: ${published.length} | Skipped: ${skipped.length} | Errors: ${errors.length}`)

  if (published.length > 0) {
    console.log(`\n✓ Published: ${published.map((r) => r.mc_version).join(", ")}`)
  }

  if (skipped.length > 0) {
    console.log("\n⏭  Skipped:")
    for (const result of skipped) {
      console.log(`  - ${result.mc_version}: ${result.reason}`)
    }
  }

  if (errors.length > 0) {
    console.log("\n❌ ERRORS:")
    for (const error of errors) {
      console.log(`  - ${error.mc_version}: ${error.error}`)
    }
    throw new Error(`Phase 2 completed with ${errors.length} error(s)`)
  }

  console.log("\n✅ Phase 2 complete! All versions with latest tags published to Modrinth.")
}

async function main() {
  try {
    await publish_to_modrinth()
    process.exit(0)
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.main) {
  main()
}
