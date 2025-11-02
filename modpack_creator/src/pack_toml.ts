import { readFileSync } from "node:fs"
import { resolve } from "node:path"

interface PackToml {
  name: string
  author: string
  version: string
  "pack-format": string
  index: {
    file: string
    "hash-format": string
    hash: string
  }
  versions: {
    fabric: string
    minecraft: string
  }
}

/**
 * Read and parse the pack.toml file from the project root
 */
export function read_pack_toml(): PackToml {
  const root_dir = resolve(__dirname, "../..")
  const pack_toml_path = resolve(root_dir, "pack.toml")

  try {
    const toml_content = readFileSync(pack_toml_path, "utf-8")
    // Bun natively supports TOML parsing via Bun.TOML
    const parsed = Bun.TOML.parse(toml_content) as PackToml
    return parsed
  } catch (error) {
    throw new Error(`Failed to read or parse pack.toml: ${error}`)
  }
}

/**
 * Get the Minecraft version from pack.toml
 */
export function get_minecraft_version(): string {
  const pack_data = read_pack_toml()
  return pack_data.versions.minecraft
}

/**
 * Get the Fabric loader version from pack.toml
 */
export function get_fabric_version(): string {
  const pack_data = read_pack_toml()
  return pack_data.versions.fabric
}

/**
 * Get the index hash from pack.toml
 */
export function get_pack_hash(): string {
  const pack_data = read_pack_toml()
  return pack_data.index.hash
}
