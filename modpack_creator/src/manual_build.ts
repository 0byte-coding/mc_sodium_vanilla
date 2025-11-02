import { config } from "./config"
import { export_modpack } from "./export_modpack"
import { install_packwiz_content } from "./install_mods"
import { get_safe_mod_list, mod_list } from "./mod_list"
import { resource_pack_list } from "./resource_pack_list"

/**
 * Manually build and export a packwiz file for a single Minecraft version.
 * Uses the MC_VERSION from config.app to determine which version to build.
 *
 * This script is intended for manual testing of modpack builds.
 * It will:
 * 1. Install all mods for the specified Minecraft version
 * 2. Export the modpack as a .mrpack file
 *
 * The variant (safe or full) can be specified via command-line flag:
 * - --safe: Creates safe variant (excludes cheating category mods)
 * - --full: Creates full variant (includes all mods)
 *
 * Example usage:
 * MC_VERSION=1.21.10 bun src/manual_build.ts --full
 * MC_VERSION=1.21.10 bun src/manual_build.ts --safe
 */
async function manual_build(): Promise<void> {
  const mc_version = config.app.mc_version

  console.log("=".repeat(80))
  console.log("MANUAL MODPACK BUILD")
  console.log("=".repeat(80))
  console.log(`Target Minecraft version: ${mc_version}`)
  console.log()

  // Parse command-line arguments
  const args = process.argv.slice(2)
  let variant: "safe" | "full" = "full" // Default to full

  if (args.includes("--safe")) {
    variant = "safe"
  } else if (args.includes("--full")) {
    variant = "full"
  }

  console.log(`Building ${variant.toUpperCase()} variant...`)
  console.log()

  try {
    // Select appropriate mod list based on variant
    const selected_mod_list = variant === "safe" ? get_safe_mod_list() : mod_list

    // Install mods
    console.log(`${"=".repeat(80)}`)
    console.log(`Installing mods for ${variant} version...`)
    console.log("=".repeat(80))

    const installation_result = await install_packwiz_content(selected_mod_list, resource_pack_list)

    // Report installation results
    console.log()
    console.log("=".repeat(80))
    console.log("INSTALLATION SUMMARY")
    console.log("=".repeat(80))
    console.log(`✅ Successfully installed: ${installation_result.successful.length} mods`)

    if (installation_result.alternative_installed.length > 0) {
      console.log(`⚠️  Installed alternatives: ${installation_result.alternative_installed.length} mods`)
      for (const mod of installation_result.alternative_installed) {
        console.log(`   - ${mod.identifier} → ${mod.alternatives[0].identifier}`)
      }
    }

    if (installation_result.failed.length > 0) {
      console.log(`❌ Failed to install: ${installation_result.failed.length} mods`)
      for (const mod of installation_result.failed) {
        console.log(`   - ${mod.identifier}`)
      }
    }

    console.log()

    // Export modpack
    console.log("=".repeat(80))
    console.log("EXPORTING MODPACK")
    console.log("=".repeat(80))

    const exported_file = await export_modpack(variant)

    if (!exported_file) {
      console.error("❌ Failed to export modpack")
      process.exit(1)
    }

    console.log()
    console.log("=".repeat(80))
    console.log("✅ BUILD COMPLETE")
    console.log("=".repeat(80))
    console.log(`Exported file: ${exported_file}`)
    console.log()
    console.log("You can now manually test this .mrpack file with your Minecraft launcher.")

    process.exit(0)
  } catch (error) {
    console.error()
    console.error("=".repeat(80))
    console.error("❌ BUILD FAILED")
    console.error("=".repeat(80))
    console.error(error)
    process.exit(1)
  }
}

manual_build()
