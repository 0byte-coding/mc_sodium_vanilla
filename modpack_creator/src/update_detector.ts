import { find_latest_tag, read_file_from_tag } from "./git_tag_manager"
import { get_pack_hash } from "./pack_toml"
import type { ModInstallationState } from "./types"

/**
 * Loads the mod installation state from a specific git tag.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @returns Promise resolving to ModInstallationState or null if not found/parseable
 *
 * @example
 * ```typescript
 * const old_state = await load_state_from_tag("1.21.10_0.1.0")
 * ```
 */
export async function load_state_from_tag(tag_name: string): Promise<ModInstallationState | null> {
  try {
    // File is in project root, not in modpack_creator/
    const state_file_path = "mod_installation_state.json"
    const contents = await read_file_from_tag(tag_name, state_file_path)
    const state = JSON.parse(contents) as ModInstallationState
    return state
  } catch (error) {
    console.warn(`Could not load state from tag ${tag_name}:`, error)
    return null
  }
}

/**
 * Normalizes an array of mods for order-independent comparison.
 * Sorts by identifier to ensure consistent ordering.
 *
 * @param mods - Array of mods with identifier property
 * @returns Sorted array of mods
 */
function normalize_mod_array<T extends { identifier: string }>(mods: T[]): T[] {
  return [...mods].sort((a, b) => a.identifier.localeCompare(b.identifier))
}

/**
 * Deep compares two mod installation states to detect differences.
 *
 * @param old_state - Previous installation state
 * @param new_state - New installation state
 * @returns True if states differ, false if identical
 *
 * @example
 * ```typescript
 * const changed = compare_states(old_state, new_state)
 * if (changed) {
 *   console.log("Modpack has changed, need to upload")
 * }
 * ```
 */
export function compare_states(old_state: ModInstallationState, new_state: ModInstallationState): boolean {
  // Normalize arrays for order-independent comparison
  const old_successful = normalize_mod_array(old_state.successful)
  const new_successful = normalize_mod_array(new_state.successful)

  const old_failed = normalize_mod_array(old_state.failed)
  const new_failed = normalize_mod_array(new_state.failed)

  const old_alternative = normalize_mod_array(old_state.alternative_installed)
  const new_alternative = normalize_mod_array(new_state.alternative_installed)

  // Compare lengths first for quick rejection
  if (old_successful.length !== new_successful.length) {
    return true
  }
  if (old_failed.length !== new_failed.length) {
    return true
  }
  if (old_alternative.length !== new_alternative.length) {
    return true
  }

  // Deep compare successful mods
  for (let i = 0; i < old_successful.length; i++) {
    const old_mod = old_successful[i]
    const new_mod = new_successful[i]
    if (old_mod?.identifier !== new_mod?.identifier || old_mod?.category !== new_mod?.category) {
      return true
    }
  }

  // Deep compare failed mods
  for (let i = 0; i < old_failed.length; i++) {
    const old_mod = old_failed[i]
    const new_mod = new_failed[i]
    if (old_mod?.identifier !== new_mod?.identifier || old_mod?.category !== new_mod?.category) {
      return true
    }
  }

  // Deep compare alternative_installed mods
  for (let i = 0; i < old_alternative.length; i++) {
    const old_mod = old_alternative[i]
    const new_mod = new_alternative[i]
    if (old_mod?.identifier !== new_mod?.identifier || old_mod?.category !== new_mod?.category) {
      return true
    }
  }

  // No differences found
  return false
}

/**
 * Determines if a modpack needs to be updated for a specific Minecraft version.
 * Returns true if:
 * - No tag exists for this version (new version)
 * - pack.toml file cannot be loaded from tag
 * - pack.toml hash has changed compared to the tagged version
 *
 * @param mc_version - Minecraft version like "1.21.10"
 * @param new_state - New installation state after building (unused, kept for compatibility)
 * @returns Promise resolving to true if update is needed, false otherwise
 *
 * @example
 * ```typescript
 * const update_needed = await needs_update("1.21.10", new_installation_state)
 * if (update_needed) {
 *   await upload_to_modrinth(...)
 * }
 * ```
 */
export async function needs_update(mc_version: string, _new_state: ModInstallationState): Promise<boolean> {
  // Find the latest tag for this MC version
  const latest_tag = await find_latest_tag(mc_version)

  // If no tag exists, this is a new version - need to upload
  if (!latest_tag) {
    return true
  }

  try {
    // Read pack.toml from the tagged version
    const old_pack_toml_content = await read_file_from_tag(latest_tag, "pack.toml")

    // Parse the TOML to extract the hash
    const old_pack_toml = Bun.TOML.parse(old_pack_toml_content) as { index: { hash: string } }
    const old_hash = old_pack_toml.index.hash

    // Get current hash from pack.toml
    const current_hash = get_pack_hash()

    // Compare hashes - if they differ, the modpack has changed
    return old_hash !== current_hash
  } catch (error) {
    console.warn(`Could not load pack.toml from tag ${latest_tag}:`, error)
    // If we can't load the old pack.toml, assume changed (safe default)
    return true
  }
}
