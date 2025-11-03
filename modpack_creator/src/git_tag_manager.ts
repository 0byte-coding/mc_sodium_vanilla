import { $ } from "bun"
import { compare_versions } from "./version_discovery"

/**
 * Represents a parsed git tag
 */
export interface ParsedTag {
  mc_version: string
  modpack_version: string
}

/**
 * Parses a git tag in the format {MC_VERSION}_{MODPACK_VERSION}.
 *
 * @param tag - Tag string like "1.21.10_0.1.0"
 * @returns Parsed tag object or null if format is invalid
 *
 * @example
 * ```typescript
 * parse_tag("1.21.10_0.1.0") // { mc_version: "1.21.10", modpack_version: "0.1.0" }
 * parse_tag("1.14_0.1.0") // { mc_version: "1.14", modpack_version: "0.1.0" }
 * parse_tag("invalid") // null
 * ```
 */
export function parse_tag(tag: string): ParsedTag | null {
  // Match pattern: {MC_VERSION}_{MODPACK_VERSION}
  // MC_VERSION: digits.digits or digits.digits.digits
  // MODPACK_VERSION: digits.digits.digits (semantic version)
  const match = tag.match(/^(\d+\.\d+(?:\.\d+)?)_(\d+\.\d+\.\d+)$/)
  if (!match) {
    return null
  }

  return {
    mc_version: match[1] ?? "",
    modpack_version: match[2] ?? ""
  }
}

/**
 * Lists all git tags for a specific Minecraft version.
 *
 * @param mc_version - Minecraft version like "1.21.10"
 * @returns Promise resolving to array of tag names
 *
 * @example
 * ```typescript
 * const tags = await list_tags_for_version("1.21.10")
 * // ["1.21.10_0.1.0", "1.21.10_0.1.1"]
 * ```
 */
export async function list_tags_for_version(mc_version: string): Promise<string[]> {
  try {
    // Quote the pattern to prevent shell glob expansion by Bun
    const pattern = `${mc_version}_*`
    const output = await $`git tag -l ${pattern}`.text()
    if (!output.trim()) {
      return []
    }
    return output.trim().split("\n")
  } catch (error) {
    console.error(`Error listing tags for ${mc_version}:`, error)
    return []
  }
}

/**
 * Finds the highest global modpack version across all git tags.
 * This is used to ensure version continuity when a new Minecraft version is added.
 *
 * @returns Promise resolving to the highest modpack version string (e.g., "0.1.5")
 *
 * @example
 * ```typescript
 * const highest = await find_highest_global_version()
 * // "0.1.5" if tags like 1.21.10_0.1.5, 1.21.11_0.1.5 exist
 * ```
 */
export async function find_highest_global_version(): Promise<string> {
  try {
    // Get all tags
    const output = await $`git tag -l`.text()
    if (!output.trim()) {
      return "0.0.0" // No tags exist, start from 0.0.0 so increment gives 0.1.0
    }

    const all_tags = output.trim().split("\n")
    let highest_version = "0.0.0"

    for (const tag of all_tags) {
      const parsed = parse_tag(tag)
      if (parsed) {
        if (compare_versions(parsed.modpack_version, highest_version) > 0) {
          highest_version = parsed.modpack_version
        }
      }
    }

    return highest_version
  } catch (error) {
    console.error("Error finding highest global version:", error)
    return "0.0.0"
  }
}

/**
 * Finds the latest tag for a specific Minecraft version.
 * Compares semantic versions to determine the latest.
 *
 * @param mc_version - Minecraft version like "1.21.10"
 * @returns Promise resolving to latest tag name or null if no tags exist
 *
 * @example
 * ```typescript
 * const latest = await find_latest_tag("1.21.10")
 * // "1.21.10_0.1.1" (if this is the highest version)
 * ```
 */
export async function find_latest_tag(mc_version: string): Promise<string | null> {
  const tags = await list_tags_for_version(mc_version)
  if (tags.length === 0) {
    return null
  }

  // Parse all tags and sort by modpack version
  const parsed_tags = tags
    .map((tag) => ({ tag, parsed: parse_tag(tag) }))
    .filter((t) => t.parsed !== null)
    .sort((a, b) => {
      // Compare semantic versions
      const version_a = a.parsed?.modpack_version.split(".").map(Number) ?? [0, 0, 0]
      const version_b = b.parsed?.modpack_version.split(".").map(Number) ?? [0, 0, 0]

      for (let i = 0; i < 3; i++) {
        const diff = (version_b[i] ?? 0) - (version_a[i] ?? 0)
        if (diff !== 0) {
          return diff
        }
      }
      return 0
    })

  return parsed_tags[0]?.tag ?? null
}

/**
 * Increments a semantic version's patch number.
 *
 * @param version - Semantic version string like "0.1.0"
 * @returns Incremented version string
 *
 * @example
 * ```typescript
 * increment_version("0.1.0") // "0.1.1"
 * increment_version("0.1.9") // "0.1.10"
 * ```
 */
export function increment_version(version: string): string {
  const parts = version.split(".").map(Number)
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0

  return `${major}.${minor}.${patch + 1}`
}

/**
 * Creates an annotated git tag.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @param message - Tag message
 * @throws Error if tag creation fails
 *
 * @example
 * ```typescript
 * await create_tag("1.21.10_0.1.0", "Release modpack for Minecraft 1.21.10")
 * ```
 */
export async function create_tag(tag_name: string, message: string): Promise<void> {
  try {
    await $`git tag -a ${tag_name} -m ${message}`.quiet()
  } catch (error: unknown) {
    const error_details = error instanceof Error ? error.message : String(error)
    // Check if tag already exists
    const existing_tags = await $`git tag -l ${tag_name}`.text()
    if (existing_tags.trim() === tag_name) {
      throw new Error(`Failed to create tag ${tag_name}: Tag already exists. Use a different version number or delete the existing tag first.`)
    }
    throw new Error(`Failed to create git tag ${tag_name}: ${error_details}`)
  }
}

/**
 * Pushes a git tag to the remote repository.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @throws Error if push fails
 *
 * @example
 * ```typescript
 * await push_tag("1.21.10_0.1.0")
 * ```
 */
export async function push_tag(tag_name: string): Promise<void> {
  try {
    await $`git push origin ${tag_name}`.quiet()
  } catch (error: unknown) {
    const error_details = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to push tag ${tag_name} to remote: ${error_details}. Check network connection and remote permissions.`)
  }
}

/**
 * Checks out a specific git tag.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @throws Error if checkout fails
 *
 * @example
 * ```typescript
 * await checkout_tag("1.21.10_0.1.0")
 * ```
 */
export async function checkout_tag(tag_name: string): Promise<void> {
  try {
    // Use -f to force checkout, discarding any local changes
    await $`git checkout -f ${tag_name}`.quiet()
  } catch (error) {
    throw new Error(`Failed to checkout tag ${tag_name}: ${error}`)
  }
}

/**
 * Checks out a specific git branch.
 *
 * @param branch - Branch name like "main"
 * @throws Error if checkout fails
 *
 * @example
 * ```typescript
 * await checkout_branch("main")
 * ```
 */
export async function checkout_branch(branch: string): Promise<void> {
  try {
    // Use -f to force checkout, discarding any local changes
    await $`git checkout -f ${branch}`.quiet()
  } catch (error) {
    throw new Error(`Failed to checkout branch ${branch}: ${error}`)
  }
}

/**
 * Gets the commit hash that a git tag points to.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @returns Promise resolving to the commit hash (full SHA)
 * @throws Error if tag doesn't exist or cannot be resolved
 *
 * @example
 * ```typescript
 * const commit_hash = await get_tag_commit_hash("1.21.10_0.1.0")
 * // "abc123def456..."
 * ```
 */
export async function get_tag_commit_hash(tag_name: string): Promise<string> {
  try {
    const output = await $`git rev-list -n 1 ${tag_name}`.text()
    return output.trim()
  } catch (error) {
    throw new Error(`Failed to get commit hash for tag ${tag_name}: ${error}`)
  }
}

/**
 * Creates an annotated git tag pointing to a specific commit.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @param message - Tag message
 * @param commit_hash - Optional commit hash to tag (defaults to HEAD)
 * @throws Error if tag creation fails
 *
 * @example
 * ```typescript
 * await create_tag_at_commit("1.21.10_0.1.1", "Release modpack", "abc123def456")
 * ```
 */
export async function create_tag_at_commit(tag_name: string, message: string, commit_hash?: string): Promise<void> {
  try {
    if (commit_hash) {
      await $`git tag -a ${tag_name} ${commit_hash} -m ${message}`.quiet()
    } else {
      await $`git tag -a ${tag_name} -m ${message}`.quiet()
    }
  } catch (error: unknown) {
    const error_details = error instanceof Error ? error.message : String(error)
    // Check if tag already exists
    const existing_tags = await $`git tag -l ${tag_name}`.text()
    if (existing_tags.trim() === tag_name) {
      const commit_info = commit_hash ? ` at commit ${commit_hash.substring(0, 7)}` : " at HEAD"
      throw new Error(`Failed to create tag ${tag_name}${commit_info}: Tag already exists. Use a different version number or delete the existing tag first.`)
    }
    const commit_info = commit_hash ? ` at commit ${commit_hash.substring(0, 7)}` : " at HEAD"
    throw new Error(`Failed to create git tag ${tag_name}${commit_info}: ${error_details}`)
  }
}

/**
 * Reads a file from a specific git tag using git show.
 * Does not require checking out the tag, so works even with uncommitted changes.
 *
 * @param tag_name - Tag name like "1.21.10_0.1.0"
 * @param file_path - Relative path to file from repository root
 * @returns Promise resolving to file contents as string
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * const state = await read_file_from_tag("1.21.10_0.1.0", "mod_installation_state.json")
 * ```
 */
export async function read_file_from_tag(tag_name: string, file_path: string): Promise<string> {
  try {
    // Use git show to read file from tag without checking it out
    const contents = await $`git show ${tag_name}:${file_path}`.text()
    return contents
  } catch (error) {
    throw new Error(`File ${file_path} does not exist in tag ${tag_name}: ${error}`)
  }
}
