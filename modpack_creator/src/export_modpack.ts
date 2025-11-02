import { existsSync, renameSync } from "node:fs"
import { resolve } from "node:path"
import { find_latest_tag, parse_tag } from "./git_tag_manager"
import { get_minecraft_version } from "./pack_toml"
import { execute_packwiz } from "./packwiz_executor"

/**
 * Export the modpack using packwiz and rename it with the appropriate variant suffix.
 *
 * The exported file will be named: "Sodium Vanilla-{mc_version}_{modpack_version}_{variant}.mrpack"
 * Example: "Sodium Vanilla-1.21.10_0.1.5_full.mrpack"
 *
 * @param variant - The modpack variant: "full" or "safe"
 * @param modpack_version - The modpack version to use in the filename (e.g., "0.1.0"). If not provided, will look up from latest git tag.
 * @returns The path to the exported .mrpack file, or null if export failed
 */
export async function export_modpack(variant: "full" | "safe", modpack_version?: string): Promise<string | null> {
  const root_dir = resolve(__dirname, "../..")

  console.log(`Exporting modpack with packwiz (${variant} variant)...`)

  const result = await execute_packwiz(["modrinth", "export"], root_dir)

  if (!result.success) {
    console.error("❌ Failed to export modpack")
    console.error(result.output)
    return null
  }

  console.log(result.output)

  // Extract the filename from "Modpack exported to <filename>"
  const match = result.output.match(/to\s+(.+\.mrpack)/i)

  if (!match?.[1]) {
    console.error("❌ Could not determine exported filename")
    return null
  }

  const original_filename = match[1].trim()
  const original_path = resolve(root_dir, original_filename)

  // Check if the file exists
  if (!existsSync(original_path)) {
    console.error(`❌ Exported file not found: ${original_path}`)
    return null
  }

  // Get Minecraft version from pack.toml
  const mc_version = get_minecraft_version()

  // Get modpack version: use provided version, or look up from latest git tag
  let version_to_use = modpack_version
  if (!version_to_use) {
    const latest_tag = await find_latest_tag(mc_version)
    if (!latest_tag) {
      console.error(`❌ No git tag found for Minecraft version ${mc_version}`)
      return null
    }

    const parsed = parse_tag(latest_tag)
    if (!parsed) {
      console.error(`❌ Could not parse tag: ${latest_tag}`)
      return null
    }

    version_to_use = parsed.modpack_version
  }

  // Create the new filename with format: "Sodium Vanilla-{mc_version}_{modpack_version}_{variant}.mrpack"
  const new_filename = `Sodium Vanilla-${mc_version}_${version_to_use}_${variant}.mrpack`
  const new_path = resolve(root_dir, new_filename)

  // Rename the file
  try {
    renameSync(original_path, new_path)
    console.log(`✅ Successfully exported and renamed: ${new_filename}`)
    return new_filename
  } catch (error) {
    console.error(`❌ Failed to rename file: ${error}`)
    return null
  }
}
