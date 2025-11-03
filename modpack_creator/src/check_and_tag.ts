import { $ } from "bun"
import { config } from "./config"
import { export_modpack } from "./export_modpack"
import { fetch_with_retry } from "./fetch_with_retry"
import { create_tag_at_commit, find_highest_global_version, find_latest_tag, get_tag_commit_hash, increment_version, parse_tag } from "./git_tag_manager"
import { install_packwiz_content } from "./install_mods"
import { get_safe_mod_list, mod_list } from "./mod_list"
import { resource_pack_list } from "./resource_pack_list"
import { needs_update } from "./update_detector"
import { update_readme } from "./update_readme"
import { compare_versions, get_current_minecraft_versions } from "./version_discovery"
import { save_installation_state } from "./write_mod_list"

interface VersionCheckResult {
  mc_version: string
  status: "changed" | "unchanged" | "new" | "error"
  old_tag?: string
  new_tag?: string
  commit_hash?: string // commit hash where changes were made (or old commit for unchanged)
  error?: string
}

/**
 * Check if Mojang services are reachable before proceeding with updates.
 *
 * @throws Error if Mojang services are not reachable
 */
async function check_mojang_service_availability(): Promise<void> {
  const MOJANG_VERSION_MANIFEST_URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json"

  try {
    console.log("Checking Mojang service availability...")
    const response = await fetch_with_retry(MOJANG_VERSION_MANIFEST_URL, 1)

    if (!response.ok) {
      throw new Error(`Mojang services returned status ${response.status}`)
    }

    console.log("✓ Mojang services are reachable\n")
  } catch (error) {
    console.error("❌ Failed to reach Mojang services")
    console.error("This might indicate a service outage. Please try again later.")
    throw new Error(`Mojang service check failed: ${error}`)
  }
}

/**
 * Checks a single Minecraft version: builds modpack, checks for changes, creates commits and tags.
 *
 * @param mc_version - The Minecraft version to check
 * @param index - The index of this version in the list (for progress display)
 * @param total - Total number of versions being checked
 * @param global_modpack_version - The modpack version to use for new versions without existing tags
 */
async function check_version(mc_version: string, index: number, total: number, global_modpack_version: string): Promise<VersionCheckResult> {
  console.log(`\n${"=".repeat(80)}`)
  console.log(`[${index}/${total}] Checking Minecraft ${mc_version}`)
  console.log("=".repeat(80))

  try {
    // Set MC_VERSION environment variable for config
    process.env.MC_VERSION = mc_version
    config.app.mc_version = mc_version

    // Find latest tag or determine if this is the first build
    const latest_tag = await find_latest_tag(mc_version)
    const first_time = !latest_tag

    // Determine version to use:
    // - For new MC versions (no tag): use global_modpack_version
    // - For existing versions with changes: increment from their latest tag
    let version_to_use: string
    if (first_time) {
      version_to_use = global_modpack_version
      console.log(`  ! No tag found for this MC version - will use version ${version_to_use}`)
    } else {
      const parsed_latest = parse_tag(latest_tag)
      if (!parsed_latest) {
        throw new Error(`Failed to parse latest tag: ${latest_tag}`)
      }
      // We'll increment later if changes are detected
      version_to_use = parsed_latest.modpack_version
      console.log(`  ✓ Found latest tag: ${latest_tag}`)
    }

    // Build safe version
    console.log("\n  Building SAFE version...")
    const safe_mod_list = get_safe_mod_list()
    const installation_result_safe = await install_packwiz_content(safe_mod_list, resource_pack_list)

    if (installation_result_safe.failed.length > 0) {
      console.log(`  ⚠  ${installation_result_safe.failed.length} mod(s) failed in safe version`)
    } else {
      console.log("  ✓ All mods installed successfully for safe version")
    }

    const safe_export = await export_modpack("safe", version_to_use)
    if (!safe_export) {
      throw new Error("Failed to export safe version")
    }
    console.log(`  ✓ Exported safe version: ${safe_export}`)

    // Build full version
    console.log("\n  Building FULL version...")
    const installation_result_full = await install_packwiz_content(mod_list, resource_pack_list)

    if (installation_result_full.failed.length > 0) {
      console.log(`  ⚠  ${installation_result_full.failed.length} mod(s) failed in full version`)
    } else {
      console.log("  ✓ All mods installed successfully for full version")
    }

    const full_export = await export_modpack("full", version_to_use)
    if (!full_export) {
      throw new Error("Failed to export full version")
    }
    console.log(`  ✓ Exported full version: ${full_export}`)

    // Save installation state
    await save_installation_state(installation_result_full)

    // Update README
    await update_readme(installation_result_full)

    // Check if update is needed
    console.log("\n  Checking for changes...")
    const update_needed = await needs_update(mc_version, installation_result_full)

    if (!update_needed) {
      console.log("  ✓ No changes detected")

      // Get old commit hash to reuse
      let old_commit_hash: string | undefined
      if (latest_tag) {
        old_commit_hash = await get_tag_commit_hash(latest_tag)
      }

      return {
        mc_version,
        status: "unchanged",
        old_tag: latest_tag ?? undefined,
        new_tag: `${mc_version}_${version_to_use}`,
        commit_hash: old_commit_hash
      }
    }

    // Changes detected! Increment version from this version's latest tag
    const new_modpack_version = increment_version(version_to_use)
    console.log(`  ✓ Changes detected - incrementing version from ${version_to_use} to ${new_modpack_version}`)

    // Check if there are actually uncommitted changes
    const status_output = await $`git status --porcelain`.text()
    const has_uncommitted_changes = status_output.trim().length > 0

    let commit_hash: string

    if (has_uncommitted_changes) {
      // Stage and commit changes
      await $`git add -A`.quiet()
      const commit_message = `Update modpack for Minecraft ${mc_version}`
      await $`git commit -m ${commit_message}`.quiet()
      console.log("  ✓ Committed changes")

      // Get the commit hash we just created
      const new_commit_hash = await $`git rev-parse HEAD`.text()
      commit_hash = new_commit_hash.trim()

      // Push the commit to the remote branch BEFORE creating tag
      await $`git push`
      console.log("  ✓ Pushed commit to remote")
    } else {
      // No uncommitted changes - check if current HEAD is pushed
      console.log("  ℹ  No uncommitted changes detected")

      // Check if HEAD is already on remote
      const local_head = (await $`git rev-parse HEAD`.text()).trim()
      const remote_head = (await $`git rev-parse origin/main`.text()).trim()

      if (local_head !== remote_head) {
        console.log("  ⚠  Current HEAD not on remote, pushing...")
        await $`git push`
        console.log("  ✓ Pushed HEAD to remote")
      }

      commit_hash = local_head
    }

    // Create the tag pointing to the now-pushed commit
    const new_tag = `${mc_version}_${new_modpack_version}`
    await create_tag_at_commit(new_tag, `Release modpack v${new_modpack_version} for Minecraft ${mc_version}`, commit_hash)
    console.log(`  ✓ Created tag ${new_tag}`)

    // Push the tag
    await $`git push origin ${new_tag}`.quiet()
    console.log(`  ✓ Pushed tag ${new_tag}`)

    return {
      mc_version,
      status: first_time ? "new" : "changed",
      old_tag: latest_tag ?? undefined,
      new_tag,
      commit_hash
    }
  } catch (error) {
    console.error(`  ❌ Error checking ${mc_version}:`, error)
    return {
      mc_version,
      status: "error",
      error: String(error)
    }
  }
}

/**
 * Phase 1: Check all Minecraft versions for changes and create git tags.
 *
 * For versions with changes:
 * - Commits the changes to git
 * - Creates a new tag pointing to the new commit
 *
 * For versions without changes:
 * - Creates a new tag pointing to the same commit as the old tag
 *
 * This allows all versions to stay in sync with incremented version numbers
 * even if only some versions have actual changes.
 *
 * @returns true if changes were detected and tags were created, false otherwise
 */
export async function check_and_tag(): Promise<boolean> {
  console.log("=".repeat(80))
  console.log("PHASE 1: CHECK AND TAG")
  console.log("=".repeat(80))
  console.log()

  // Check if Mojang services are reachable
  await check_mojang_service_availability()

  // Fetch current Minecraft versions
  console.log("Fetching Minecraft versions from Modrinth API...")
  const versions = await get_current_minecraft_versions()
  console.log(`✓ Found ${versions.length} valid Minecraft versions (>= 1.14)`)

  // Check which versions are new (don't have existing tags)
  console.log("\nChecking for new Minecraft versions...")
  const new_versions: string[] = []
  for (const version of versions) {
    if (!version) continue
    const latest_tag = await find_latest_tag(version)
    if (!latest_tag) {
      new_versions.push(version)
    }
  }

  // Determine the global modpack version
  const highest_global = await find_highest_global_version()
  let global_modpack_version: string

  if (highest_global === "0.0.0") {
    // Very first run - start with 0.1.0
    global_modpack_version = "0.1.0"
    console.log(`No existing tags - starting with version ${global_modpack_version}`)
  } else if (new_versions.length > 0) {
    // New Minecraft versions detected - increment version
    global_modpack_version = increment_version(highest_global)
    console.log(`✓ Found ${new_versions.length} new Minecraft version(s): ${new_versions.join(", ")}`)
    console.log(`Incrementing modpack version from ${highest_global} to ${global_modpack_version}`)
  } else {
    // No new versions - keep same version
    global_modpack_version = highest_global
    console.log(`No new Minecraft versions - keeping version ${global_modpack_version}`)
  }

  // Check each version
  console.log(`\nProcessing all ${versions.length} Minecraft versions with modpack version ${global_modpack_version}...`)
  const results: VersionCheckResult[] = []
  for (let i = 0; i < versions.length; i++) {
    const version = versions[i]
    if (!version) continue
    const result = await check_version(version, i + 1, versions.length, global_modpack_version)
    results.push(result)
  }

  // Check if we have any changes at all
  const has_changes = results.some((r) => r.status === "changed" || r.status === "new")

  if (!has_changes) {
    console.log(`\n${"=".repeat(80)}`)
    console.log("SUMMARY: NO CHANGES DETECTED")
    console.log("=".repeat(80))
    console.log("\nNo modpack changes found across any version.")
    console.log("No git tags will be created.")
    return false
  }

  // Determine the actual new global version by finding the highest version among changed versions
  const changed_results = results.filter((r) => r.status === "changed" || r.status === "new")
  let actual_new_version = global_modpack_version
  for (const result of changed_results) {
    if (result.new_tag) {
      const parsed = parse_tag(result.new_tag)
      if (parsed && compare_versions(parsed.modpack_version, actual_new_version) > 0) {
        actual_new_version = parsed.modpack_version
      }
    }
  }

  // Changed versions already have their tags created and pushed
  // Now create tags for unchanged versions (pointing to old commits with new version number)
  const unchanged_results = results.filter((r) => r.status === "unchanged")

  if (unchanged_results.length > 0) {
    console.log(`\n${"=".repeat(80)}`)
    console.log("CREATING TAGS FOR UNCHANGED VERSIONS")
    console.log("=".repeat(80))
    console.log(`\nCreating tags for unchanged versions using version ${actual_new_version}...`)

    for (const result of unchanged_results) {
      if (result.status === "error") {
        continue
      }

      // Create tag with the actual new version number, pointing to old commit
      const new_tag_name = `${result.mc_version}_${actual_new_version}`
      if (result.commit_hash) {
        await create_tag_at_commit(new_tag_name, `Release modpack v${actual_new_version} for Minecraft ${result.mc_version} (no changes from previous version)`, result.commit_hash)
        console.log(`  ✓ Created tag ${new_tag_name} (pointing to same commit as ${result.old_tag})`)
      } else {
        console.log(`  ⚠  Cannot create tag for ${result.mc_version} - no commit hash available`)
      }
    }

    // Push all unchanged tags at once
    console.log("\nPushing unchanged tags to remote...")
    await $`git push --tags`.quiet()
    console.log("✓ Pushed all unchanged tags")
  }

  // Summary report
  console.log(`\n${"=".repeat(80)}`)
  console.log("SUMMARY")
  console.log("=".repeat(80))

  const changed = results.filter((r) => r.status === "changed" || r.status === "new")
  const unchanged = results.filter((r) => r.status === "unchanged")
  const errors = results.filter((r) => r.status === "error")

  console.log(`Total versions processed: ${results.length}`)
  console.log(`✓ Changed: ${changed.length}`)
  console.log(`⏭  Unchanged: ${unchanged.length}`)
  console.log(`❌ Errors: ${errors.length}`)

  if (changed.length > 0) {
    console.log("\nVersions with changes (will need Modrinth upload):")
    for (const result of changed) {
      console.log(`  - ${result.mc_version} → ${result.new_tag}`)
    }
  }

  if (unchanged.length > 0) {
    console.log("\nVersions without changes (tags created but no Modrinth upload needed):")
    for (const result of unchanged) {
      console.log(`  - ${result.mc_version} → ${result.new_tag}`)
    }
  }

  if (errors.length > 0) {
    console.log("\nERRORS:")
    for (const error of errors) {
      console.log(`  ${error.mc_version}: ${error.error}`)
    }
    throw new Error(`Phase 1 completed with ${errors.length} error(s)`)
  }

  console.log("\n✅ Phase 1 complete! Run publish_to_modrinth to upload changed versions.")
  return true
}

async function main() {
  try {
    const has_changes = await check_and_tag()
    process.exit(has_changes ? 0 : 0)
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.main) {
  main()
}
