import type { SpawnSyncReturns } from "node:child_process"
import { spawnSync } from "node:child_process"

/**
 * Result of a packwiz command execution.
 */
export interface PackwizResult {
  /**
   * Exit status code. 0 indicates success, non-zero indicates failure.
   */
  status: number | null
  /**
   * Combined stdout and stderr output from the command.
   * Since packwiz outputs errors to stdout, we combine both streams.
   */
  output: string
  /**
   * Whether the command succeeded (status === 0)
   */
  success: boolean
  /**
   * The error object if spawn itself failed (command not found, etc.)
   */
  error?: Error
}

/**
 * Executes a packwiz command with retry logic for rate limiting.
 *
 * Packwiz outputs all messages (including errors) to stdout rather than stderr,
 * so this function combines both streams into a single output string.
 *
 * When rate limiting is detected in the output, automatically retries with
 * exponential backoff (12 retries, starting with 1000ms delay).
 *
 * @param args - The packwiz command arguments (e.g., ["modrinth", "add", "sodium", "-y"])
 * @param cwd - The working directory to execute the command in
 * @param max_retries - Maximum number of retry attempts for rate limiting (default: 12)
 * @param initial_delay_ms - Initial delay in milliseconds before first retry (default: 1000)
 * @returns Promise resolving to PackwizResult with status, output, and success flag
 *
 * @example
 * ```typescript
 * const result = await execute_packwiz(["modrinth", "add", "sodium", "-y"], "/path/to/project")
 * if (result.success) {
 *   console.log("Success:", result.output)
 * } else {
 *   console.error("Failed:", result.output)
 * }
 * ```
 */
export async function execute_packwiz(args: string[], cwd: string, max_retries = 12, initial_delay_ms = 1000): Promise<PackwizResult> {
  let last_result: SpawnSyncReturns<string> | null = null

  for (let attempt = 0; attempt <= max_retries; attempt++) {
    const result = spawnSync("packwiz", args, {
      encoding: "utf-8",
      stdio: "pipe",
      cwd
    })

    last_result = result

    // Combine stdout and stderr since packwiz outputs errors to stdout
    const combined_output = [result.stdout || "", result.stderr || ""].filter((s) => s.trim()).join("\n")

    // Check for spawn errors (command not found, etc.)
    if (result.error) {
      return {
        status: null,
        output: combined_output || result.error.message,
        success: false,
        error: result.error
      }
    }

    // If command succeeded, return immediately
    if (result.status === 0) {
      return {
        status: 0,
        output: combined_output,
        success: true
      }
    }

    // Check if the error is related to rate limiting
    const is_rate_limited = combined_output.toLowerCase().includes("rate limit") || combined_output.toLowerCase().includes("ratelimit") || combined_output.toLowerCase().includes("too many requests") || combined_output.includes("429")

    // If not rate limited, return the failure immediately
    if (!is_rate_limited) {
      return {
        status: result.status,
        output: combined_output,
        success: false
      }
    }

    // If rate limited and we have retries left, wait and try again
    if (attempt < max_retries) {
      const delay = initial_delay_ms * 2 ** attempt
      console.log(`⚠️  Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${max_retries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries exhausted - return the last result
  const final_output = [last_result?.stdout || "", last_result?.stderr || ""].filter((s) => s.trim()).join("\n")

  return {
    status: last_result?.status ?? null,
    output: final_output,
    success: false,
    error: last_result?.error
  }
}
