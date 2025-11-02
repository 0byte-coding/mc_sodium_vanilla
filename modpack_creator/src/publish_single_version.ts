import { $ } from "bun"
import { config } from "./config"
import { export_modpack } from "./export_modpack"
import { checkout_branch, checkout_tag, find_latest_tag, parse_tag } from "./git_tag_manager"
import { install_packwiz_content } from "./install_mods"
import { get_safe_mod_list, mod_list } from "./mod_list"
import { resource_pack_list } from "./resource_pack_list"
import { upload_to_modrinth } from "./upload_to_modrinth"

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

/**
 * Publishes a single Minecraft version to Modrinth.
 * Finds the latest tag for the specified version and publishes both safe and full variants.
 */
async function publish_single_version(mc_version: string): Promise<void> {
  console.log("=".repeat(80))
  console.log(`Publishing Minecraft ${mc_version}`)
  console.log("=".repeat(80))

  try {
    // Find latest tag
    const latest_tag = await find_latest_tag(mc_version)

    if (!latest_tag) {
      console.log("❌ No tag found for this Minecraft version")
      process.exit(1)
    }

    console.log(`✓ Found latest tag: ${latest_tag}`)

    // Parse to get the modpack version
    const parsed = parse_tag(latest_tag)
    if (!parsed) {
      console.log("❌ Could not parse tag")
      process.exit(1)
    }

    const modpack_version = parsed.modpack_version

    // Clean working directory before checkout
    console.log("\nCleaning working directory...")
    await cleanup_working_directory()

    // Checkout the tag
    console.log(`Checking out tag ${latest_tag}...`)
    await checkout_tag(latest_tag)

    // Set MC_VERSION environment variable for config
    process.env.MC_VERSION = mc_version
    config.app.mc_version = mc_version

    // Build and upload safe version
    console.log(`\n${"=".repeat(80)}`)
    console.log("Building SAFE version...")
    console.log("=".repeat(80))
    const safe_mod_list = get_safe_mod_list()
    const installation_result_safe = await install_packwiz_content(safe_mod_list, resource_pack_list)

    if (installation_result_safe.failed.length > 0) {
      console.log(`⚠  ${installation_result_safe.failed.length} mod(s) failed in safe version`)
    } else {
      console.log("✓ All mods installed successfully for safe version")
    }

    const safe_export = await export_modpack("safe")
    if (!safe_export) {
      throw new Error("Failed to export safe version")
    }
    console.log(`✓ Exported safe version: ${safe_export}`)

    console.log("\nUploading SAFE version to Modrinth...")
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
    console.log("✓ Uploaded safe version")

    // Build and upload full version
    console.log(`\n${"=".repeat(80)}`)
    console.log("Building FULL version...")
    console.log("=".repeat(80))
    const installation_result_full = await install_packwiz_content(mod_list, resource_pack_list)

    if (installation_result_full.failed.length > 0) {
      console.log(`⚠  ${installation_result_full.failed.length} mod(s) failed in full version`)
    } else {
      console.log("✓ All mods installed successfully for full version")
    }

    const full_export = await export_modpack("full")
    if (!full_export) {
      throw new Error("Failed to export full version")
    }
    console.log(`✓ Exported full version: ${full_export}`)

    console.log("\nUploading FULL version to Modrinth...")
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
    console.log("✓ Uploaded full version")

    // Clean up and return to main branch
    console.log("\nCleaning up and returning to main branch...")
    await cleanup_working_directory()
    await checkout_branch("main")

    console.log(`\n${"=".repeat(80)}`)
    console.log("✅ Successfully published both safe and full versions to Modrinth!")
    console.log("=".repeat(80))
    process.exit(0)
  } catch (error) {
    console.error(`\n❌ Error publishing ${mc_version}:`, error)

    // Try to clean up and return to main branch
    try {
      console.log("Cleaning up and returning to main branch...")
      await cleanup_working_directory()
      await checkout_branch("main")
    } catch (cleanup_error) {
      console.error("⚠  Failed to return to main branch:", cleanup_error)
    }

    process.exit(1)
  }
}

/**
 * Main entry point: Publishes a single specified Minecraft version.
 * The MC version must be provided via the MC_VERSION environment variable.
 */
async function main() {
  const mc_version = process.env.MC_VERSION

  if (!mc_version) {
    console.error("❌ Error: MC_VERSION environment variable is required")
    console.error("Example: MC_VERSION=1.21.10 bun src/publish_single_version.ts")
    process.exit(1)
  }

  console.log("=".repeat(80))
  console.log("PUBLISH SINGLE MINECRAFT VERSION TO MODRINTH")
  console.log("=".repeat(80))
  console.log(`Target Minecraft version: ${mc_version}`)
  console.log()

  await publish_single_version(mc_version)
}

main()
