export type ModCategory = "optimization" | "cheating" | "useful" | "visual"

export interface ModDefinitionSimple {
  method: "modrinth"
  identifier: string
}

export interface ModDefinition {
  method: "modrinth"
  identifier: string
  category: ModCategory
}

export interface ModDefinitionWithAlternatives extends ModDefinition {
  alternatives?: ModDefinitionSimple[]
}

// uses same structure as normal mod definitions
export type ResourceDefinition = ModDefinitionSimple
export interface ResourcePackDefinitionWithAlternatives extends ResourceDefinition {
  alternatives?: ResourceDefinition[]
}

export interface ModWithInstalledAlternative {
  identifier: string
  category: ModCategory
  method: "modrinth"
  alternatives: [ModDefinitionSimple] // Only contains the ONE alternative that was successfully installed
}

export interface ModWithFailedAlternatives {
  identifier: string
  category: ModCategory
  method: "modrinth"
  alternatives: ModDefinitionSimple[] // Contains all failed alternatives (including skipped ones)
}

export interface ModInstallationState {
  successful: Array<ModDefinition> // successfully installed main mods, alternatives are excluded from this one
  failed: Array<ModWithFailedAlternatives> // the main mod and all alternatives that failed to install (or were skipped)
  alternative_installed: Array<ModWithInstalledAlternative> // the main mod with the ONE alternative that was successfully installed
}
