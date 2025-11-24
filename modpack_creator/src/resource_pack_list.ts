import type { ResourcePackDefinitionWithAlternatives } from "./types"

const resource_pack_list_raw: ResourcePackDefinitionWithAlternatives[] = [
  {
    identifier: "fancy-crops",
    method: "modrinth"
  },
  {
    identifier: "default-dark-mode",
    method: "modrinth"
  },
  {
    identifier: "unique-dark",
    method: "modrinth"
  },
  {
    identifier: "clean-connected-glass",
    method: "modrinth"
  },
  {
    identifier: "visual-armor-trims",
    method: "modrinth"
  },
  {
    identifier: "low-on-fire",
    method: "modrinth"
  },
  {
    identifier: "small-shield-totem",
    method: "modrinth"
  },
  {
    identifier: "even-better-enchants",
    method: "modrinth"
  },
  {
    identifier: "new-glowing-ores",
    method: "modrinth"
  },
  {
    identifier: "redstone-tweaks",
    method: "modrinth"
  },
  {
    identifier: "cozy-beds",
    method: "modrinth"
  },
  {
    identifier: "os-colorful-grasses",
    method: "modrinth"
  },
  {
    identifier: "fancy-beds",
    method: "modrinth"
  },
  {
    identifier: "fresh-flower-pots",
    method: "modrinth"
  },
  {
    identifier: "better-lanterns",
    method: "modrinth"
  }
]

export function get_resource_pack_list(): ResourcePackDefinitionWithAlternatives[] {
  const identifiers = new Set<string>()
  const duplicates: string[] = []

  for (const pack of resource_pack_list_raw) {
    if (identifiers.has(pack.identifier)) {
      duplicates.push(pack.identifier)
    }
    identifiers.add(pack.identifier)
  }

  if (duplicates.length > 0) {
    console.error(`Duplicate identifiers found in resource_pack_list: ${duplicates.join(", ")}`)
    process.exit(1)
  }

  return resource_pack_list_raw
}

export const resource_pack_list = get_resource_pack_list()
