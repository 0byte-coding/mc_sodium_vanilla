import { check_and_tag } from "./check_and_tag"
import { publish_to_modrinth } from "./publish_to_modrinth"

/**
 * Automated update workflow that checks for mod updates and publishes to Modrinth.
 *
 * This script orchestrates the two-phase update process:
 * 1. Phase 1: Check for changes and create git tags (check_and_tag)
 * 2. Phase 2: Publish changed versions to Modrinth (publish_to_modrinth)
 *
 * If no changes are detected in Phase 1, Phase 2 is skipped.
 */
async function main() {
  console.log("=".repeat(80))
  console.log("AUTOMATED UPDATE WORKFLOW")
  console.log("=".repeat(80))
  console.log()

  try {
    // Phase 1: Check for changes and create tags
    console.log("Starting Phase 1: Check and Tag\n")
    const has_changes = await check_and_tag()

    if (!has_changes) {
      console.log(`\n${"=".repeat(80)}`)
      console.log("WORKFLOW COMPLETE: NO CHANGES DETECTED")
      console.log("=".repeat(80))
      console.log("\nSkipping Phase 2 (Modrinth publishing) since no changes were found.")
      process.exit(0)
    }

    // Phase 2: Publish to Modrinth
    console.log(`\n${"=".repeat(80)}`)
    console.log("Starting Phase 2: Publish to Modrinth")
    console.log("=".repeat(80))
    console.log()
    await publish_to_modrinth()

    console.log(`\n${"=".repeat(80)}`)
    console.log("WORKFLOW COMPLETE: SUCCESS")
    console.log("=".repeat(80))
    console.log("\nAll phases completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error(`\n${"=".repeat(80)}`)
    console.error("WORKFLOW FAILED")
    console.error("=".repeat(80))
    console.error("\nError:", error)
    process.exit(1)
  }
}

main()
