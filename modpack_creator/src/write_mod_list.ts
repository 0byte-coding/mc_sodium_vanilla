import { resolve } from "node:path"
import { fetch_with_retry } from "./fetch_with_retry"
import type { ModCategory, ModDefinitionWithAlternatives, ModInstallationState } from "./types"

interface ModrinthProject {
  title: string
  project_type: string
}

interface ModInfo {
  title: string
  project_type: string
  identifier: string
  category: ModCategory
}

export async function get_mod_list_markdown(mod_list: ModDefinitionWithAlternatives[], installation_state?: ModInstallationState): Promise<string> {
  const failed_set = new Set(installation_state?.failed.map((m) => m.identifier) || [])
  const alternative_installed_set = new Set(installation_state?.alternative_installed.map((m) => m.identifier) || [])

  // Create a map of main mod identifier -> successfully installed alternative identifier
  const installed_alternative_map = new Map<string, string>()
  for (const alt_mod of installation_state?.alternative_installed || []) {
    if (alt_mod.alternatives.length > 0) {
      installed_alternative_map.set(alt_mod.identifier, alt_mod.alternatives[0].identifier)
    }
  }

  // Create a map of main mod identifier -> set of failed/skipped alternative identifiers
  const failed_alternatives_map = new Map<string, Set<string>>()
  for (const failed_mod of installation_state?.failed || []) {
    const failed_alt_identifiers = new Set(failed_mod.alternatives.map((a) => a.identifier))
    failed_alternatives_map.set(failed_mod.identifier, failed_alt_identifiers)
  }

  const mod_info_promises = mod_list.map(async (mod) => {
    try {
      const response = await fetch_with_retry(`https://api.modrinth.com/v2/project/${mod.identifier}`, 20, 5000)
      if (!response.ok) {
        console.error(`Failed to fetch mod ${mod.identifier}: ${response.statusText}`)
        return null
      }
      const data = (await response.json()) as ModrinthProject
      return {
        title: data.title,
        project_type: data.project_type,
        identifier: mod.identifier,
        category: mod.category
      }
    } catch (error) {
      console.error(`Error fetching mod ${mod.identifier}:`, error)
      return null
    }
  })

  const mod_infos = await Promise.all(mod_info_promises)
  const valid_mod_infos: ModInfo[] = mod_infos.filter((info): info is ModInfo => info !== null)

  // Group mods by category
  const mods_by_category: Record<string, ModInfo[]> = {}
  for (const mod_info of valid_mod_infos) {
    if (!mods_by_category[mod_info.category]) {
      mods_by_category[mod_info.category] = []
    }
    mods_by_category[mod_info.category]?.push(mod_info)
  }

  // markdown list
  let markdown = ""

  for (const [category, mods] of Object.entries(mods_by_category)) {
    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
    for (const mod of mods) {
      const url = `https://modrinth.com/${mod.project_type}/${mod.identifier}`

      // Check if an alternative was installed instead
      const alternative_installed = alternative_installed_set.has(mod.identifier)

      // Determine the marker for the main mod
      let marker: string
      if (alternative_installed) {
        marker = "[ ]" // nothing for main package if alternative was installed
      } else if (failed_set.has(mod.identifier)) {
        marker = "[ ]" // failed and no alternatives
      } else {
        marker = "[x]" // checkbox if main package was successfully installed
      }

      markdown += `- ${marker} [${mod.title}](${url})\n`

      // Find the original mod definition to get alternatives
      const original_mod = mod_list.find((m) => m.identifier === mod.identifier)

      // Show alternatives if the main mod failed or if an alternative was installed
      if (installation_state && (failed_set.has(mod.identifier) || alternative_installed)) {
        if (original_mod?.alternatives && original_mod.alternatives.length > 0) {
          markdown += "  - **Alternatives:**\n"

          const installed_alt_id = installed_alternative_map.get(mod.identifier)
          const failed_alt_ids = failed_alternatives_map.get(mod.identifier)

          for (const alt of original_mod.alternatives) {
            // Fetch alternative mod info
            try {
              const alt_response = await fetch_with_retry(`https://api.modrinth.com/v2/project/${alt.identifier}`, 20, 5000)
              if (alt_response.ok) {
                const alt_data = (await alt_response.json()) as ModrinthProject
                const alt_url = `https://modrinth.com/${alt_data.project_type}/${alt.identifier}`

                // Check if this specific alternative was successfully installed
                const is_installed = installed_alt_id === alt.identifier
                // Check if this alternative failed or was skipped
                const is_failed = failed_alt_ids?.has(alt.identifier)

                // Determine marker: [x] if installed, [ ] if failed/skipped
                const alt_marker = is_installed ? "[x]" : is_failed ? "[ ]" : "[ ]"

                markdown += `    - ${alt_marker} [${alt_data.title}](${alt_url})\n`
              }
            } catch (error) {
              console.error(`Error fetching alternative mod ${alt.identifier}:`, error)
            }
          }
        }
      }
    }
    markdown += "\n"
  }

  return markdown
}

export async function save_installation_state(installation_state: ModInstallationState): Promise<void> {
  const state = installation_state

  const root_dir = resolve(__dirname, "../..")
  const output_path = resolve(root_dir, "mod_installation_state.json")

  try {
    await Bun.write(output_path, JSON.stringify(state, null, 2))
    console.log(`✅ Saved mod installation state to ${output_path}`)
  } catch (error) {
    console.error(`❌ Failed to write mod installation state: ${error}`)
    // Don't crash the build process if we can't write the file
  }
}
