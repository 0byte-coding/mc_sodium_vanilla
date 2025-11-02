import type { ModInstallationState } from "./types"

/**
 * Loads the mod installation state from the JSON file.
 *
 * @param filePath - Path to the mod_installation_state.json file (defaults to "./mod_installation_state.json")
 * @returns The parsed ModInstallationState object
 * @throws Error if the file is malformed or missing required fields
 */
export async function load_installation_state(filePath = "./mod_installation_state.json"): Promise<ModInstallationState> {
  const file = Bun.file(filePath)

  // Check if file exists
  const exists = await file.exists()
  if (!exists) {
    // Return empty state if file doesn't exist
    return {
      successful: [],
      failed: [],
      alternative_installed: []
    }
  }

  // Read and parse the JSON file
  try {
    const data = await file.json()

    // Validate that required fields exist
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON: expected an object")
    }

    if (!Array.isArray(data.successful)) {
      throw new Error("Invalid JSON: 'successful' field must be an array")
    }

    if (!Array.isArray(data.failed)) {
      throw new Error("Invalid JSON: 'failed' field must be an array")
    }

    if (!Array.isArray(data.alternativeInstalled)) {
      throw new Error("Invalid JSON: 'alternativeInstalled' field must be an array")
    }

    return data as ModInstallationState
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON file at ${filePath}: ${error.message}`)
    }
    throw error
  }
}
