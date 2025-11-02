import { readdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"
import { config } from "./config"
import { execute_packwiz } from "./packwiz_executor"
import type { ModDefinition, ModDefinitionSimple, ModDefinitionWithAlternatives, ModInstallationState, ModWithFailedAlternatives, ModWithInstalledAlternative, ResourcePackDefinitionWithAlternatives } from "./types"

export async function install_packwiz_content(mod_list: ModDefinitionWithAlternatives[], resource_pack_list: ResourcePackDefinitionWithAlternatives[]): Promise<ModInstallationState> {
  const successful: ModDefinition[] = []
  const failed: ModWithFailedAlternatives[] = []
  const alternativeInstalled: ModWithInstalledAlternative[] = []
  const root_dir = resolve(__dirname, "../..")

  // Clean up old files
  console.log("Cleaning up old files...")

  // Remove mods directory
  try {
    rmSync(resolve(root_dir, "mods"), { recursive: true, force: true })
    console.log("✅ Cleared mods/ directory")
  } catch (_error) {
    console.log("⚠️  mods/ directory does not exist or could not be deleted")
  }

  // Remove resourcepacks directory
  try {
    rmSync(resolve(root_dir, "resourcepacks"), { recursive: true, force: true })
    console.log("✅ Cleared resourcepacks/ directory")
  } catch (_error) {
    console.log("⚠️  resourcepacks/ directory does not exist or could not be deleted")
  }

  // Remove all .mrpack files
  try {
    const files = readdirSync(root_dir)
    const mrpack_files = files.filter((file) => file.endsWith(".mrpack"))
    for (const file of mrpack_files) {
      rmSync(resolve(root_dir, file), { force: true })
      console.log(`✅ Deleted ${file}`)
    }
  } catch (_error) {
    console.log("⚠️  Could not delete .mrpack files")
  }

  // refresh packwiz index file:
  const refresh_result = await execute_packwiz(["refresh"], root_dir)

  if (!refresh_result.success) {
    console.error("❌ Failed to packwiz refresh")
    console.error(refresh_result.output)
    process.exit(1)
  }

  // First migrate to the correct Minecraft version
  console.log(`Migrating to Minecraft version ${config.app.mc_version}...`)
  const migrate_result = await execute_packwiz(["migrate", "minecraft", config.app.mc_version, "-y"], root_dir)

  if (!migrate_result.success) {
    console.error(`❌ Failed to migrate to Minecraft ${config.app.mc_version}`)
    console.error(migrate_result.output)
    process.exit(1)
  }

  console.log(`✅ Successfully migrated to Minecraft ${config.app.mc_version}\n`)

  for (const mod of mod_list) {
    console.log(`Installing ${mod.identifier}...`)

    const result = await execute_packwiz(["modrinth", "add", mod.identifier, "-y"], root_dir)

    if (!result.success) {
      console.error(`❌ Failed to install ${mod.identifier}`)
      console.error(result.output)

      // Try alternatives if they exist
      let installed_alternative: ModDefinitionSimple | null = null
      const failed_alternatives: ModDefinitionSimple[] = []

      if (mod.alternatives) {
        for (const alt of mod.alternatives) {
          console.log(`Trying alternative ${alt.identifier}...`)

          const alt_result = await execute_packwiz(["modrinth", "add", alt.identifier, "-y"], root_dir)

          if (!alt_result.success) {
            console.error(`❌ Alternative ${alt.identifier} also failed`)
            console.error(alt_result.output)
            failed_alternatives.push(alt)
          } else {
            console.log(`✅ Successfully installed alternative ${alt.identifier}`)
            installed_alternative = alt
            // Mark remaining alternatives as skipped (they go into failed_alternatives)
            const remaining_alternatives = mod.alternatives.slice(mod.alternatives.indexOf(alt) + 1)
            failed_alternatives.push(...remaining_alternatives)
            break
          }
        }
      }

      // If an alternative was installed successfully
      if (installed_alternative) {
        alternativeInstalled.push({
          identifier: mod.identifier,
          category: mod.category,
          method: mod.method,
          alternatives: [installed_alternative]
        })

        // Also add to failed list with all the alternatives that failed/were skipped
        failed.push({
          identifier: mod.identifier,
          category: mod.category,
          method: mod.method,
          alternatives: failed_alternatives
        })
      } else {
        // No alternative succeeded - add to failed with all failed alternatives
        failed.push({
          identifier: mod.identifier,
          category: mod.category,
          method: mod.method,
          alternatives: failed_alternatives
        })
      }
    } else {
      console.log(`✅ Successfully installed ${mod.identifier}`)
      successful.push(mod)
    }
  }

  // Install resource packs
  console.log(`\n${"=".repeat(60)}`)
  console.log("Installing resource packs...")
  console.log(`${"=".repeat(60)}\n`)

  for (const pack of resource_pack_list) {
    console.log(`Installing resource pack ${pack.identifier}...`)

    const result = await execute_packwiz(["modrinth", "add", pack.identifier, "-y"], root_dir)

    if (!result.success) {
      console.error(`❌ Failed to install resource pack ${pack.identifier}`)
      console.error(result.output)
    } else {
      console.log(`✅ Successfully installed resource pack ${pack.identifier}`)
    }
  }

  return {
    successful,
    failed,
    alternative_installed: alternativeInstalled
  }
}
