import { fetch_with_retry } from "./fetch_with_retry"

/**
 * Represents a Minecraft game version from the Modrinth API
 */
export interface GameVersion {
  version: string
  version_type: string
  date: string
  major: boolean
}

/**
 * Represents a parsed Minecraft version number
 */
export interface ParsedVersion {
  major: number
  minor: number
  patch: number
}

/**
 * Parses a Minecraft version string into its component parts.
 * Returns null if the version string is invalid.
 *
 * @param version - Version string like "1.14", "1.21.10", "2.0.0"
 * @returns Parsed version object or null if invalid
 *
 * @example
 * ```typescript
 * parse_version("1.21.10") // { major: 1, minor: 21, patch: 10 }
 * parse_version("1.14") // { major: 1, minor: 14, patch: 0 }
 * parse_version("b1.16.6") // null (invalid beta version)
 * ```
 */
export function parse_version(version: string): ParsedVersion | null {
  // Match version pattern: major.minor or major.minor.patch
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/)
  if (!match) {
    return null
  }

  return {
    major: Number.parseInt(match[1] ?? "0", 10),
    minor: Number.parseInt(match[2] ?? "0", 10),
    patch: Number.parseInt(match[3] ?? "0", 10)
  }
}

/**
 * Checks if a Minecraft version is valid for this modpack.
 * Valid versions are release versions >= 1.14.
 *
 * @param version - Version string to validate
 * @returns True if version is valid, false otherwise
 *
 * @example
 * ```typescript
 * is_valid_version("1.14") // true
 * is_valid_version("1.13.3") // false (too old)
 * is_valid_version("2.0.0") // true (future version)
 * is_valid_version("b1.16.6") // false (invalid format)
 * ```
 */
export function is_valid_version(version: string): boolean {
  const parsed = parse_version(version)
  if (!parsed) {
    return false
  }

  // If major version >= 2, always valid
  if (parsed.major >= 2) {
    return true
  }

  // If major === 1, minor must be >= 14
  if (parsed.major === 1 && parsed.minor >= 14) {
    return true
  }

  return false
}

/**
 * Fetches all Minecraft versions from the Modrinth API.
 *
 * @returns Promise resolving to array of GameVersion objects
 * @throws Error if API request fails
 */
async function fetch_minecraft_versions(): Promise<GameVersion[]> {
  const response = await fetch_with_retry("https://api.modrinth.com/v2/tag/game_version")
  if (!response.ok) {
    throw new Error(`Failed to fetch Minecraft versions: ${response.statusText}`)
  }
  return (await response.json()) as GameVersion[]
}

/**
 * Filters game versions to only include valid release versions.
 *
 * @param versions - Array of GameVersion objects from API
 * @returns Filtered array of valid release versions
 */
function filter_valid_versions(versions: GameVersion[]): GameVersion[] {
  return versions.filter((v) => v.version_type === "release" && is_valid_version(v.version))
}

/**
 * Compares two version strings semantically (not lexicographically).
 * Returns negative if a < b, positive if a > b, zero if equal.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Comparison result for Array.sort()
 */
export function compare_versions(a: string, b: string): number {
  const parsed_a = parse_version(a)
  const parsed_b = parse_version(b)

  // If either version is invalid, fall back to lexicographic comparison
  if (!parsed_a || !parsed_b) {
    return a.localeCompare(b)
  }

  // Compare major version
  if (parsed_a.major !== parsed_b.major) {
    return parsed_a.major - parsed_b.major
  }

  // Compare minor version
  if (parsed_a.minor !== parsed_b.minor) {
    return parsed_a.minor - parsed_b.minor
  }

  // Compare patch version
  return parsed_a.patch - parsed_b.patch
}

/**
 * Fetches and filters current Minecraft versions suitable for this modpack.
 * Returns only release versions >= 1.14, sorted by version string.
 *
 * @returns Promise resolving to array of valid version strings
 * @throws Error if API request fails
 *
 * @example
 * ```typescript
 * const versions = await get_current_minecraft_versions()
 * // ["1.14", "1.14.1", "1.14.2", ..., "1.21.9", "1.21.10"]
 * ```
 */
export async function get_current_minecraft_versions(): Promise<string[]> {
  const all_versions = await fetch_minecraft_versions()
  const valid_versions = filter_valid_versions(all_versions)
  return valid_versions.map((v) => v.version).sort(compare_versions)
}
