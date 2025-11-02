/**
 * Performs an HTTP fetch with exponential backoff retry logic and timeout protection.
 *
 * Automatically retries on network errors, HTTP 429 (rate limit) responses, and timeouts.
 * Uses exponential backoff to increase delay between retries.
 * Each fetch attempt has a timeout to prevent indefinite hanging.
 *
 * @param url - The URL to fetch
 * @param max_retries - Maximum number of retry attempts (default: 5)
 * @param initial_delay_ms - Initial delay in milliseconds before first retry (default: 1000)
 * @param timeout_ms - Request timeout in milliseconds (default: 10000 = 10 seconds)
 * @returns Promise resolving to the fetch Response
 * @throws Error if all retries are exhausted or timeout is reached
 *
 * @example
 * ```typescript
 * const response = await fetch_with_retry('https://api.example.com/data', 3, 500, 10000)
 * const data = await response.json()
 * ```
 */
export async function fetch_with_retry(url: string, max_retries = 5, initial_delay_ms = 1000, timeout_ms = 10000): Promise<Response> {
  let last_error: Error | null = null

  for (let attempt = 0; attempt <= max_retries; attempt++) {
    const abort_controller = new AbortController()
    const timeout_id = setTimeout(() => abort_controller.abort(), timeout_ms)

    try {
      const response = await fetch(url, { signal: abort_controller.signal })
      clearTimeout(timeout_id)

      // If we get a 429 (Too Many Requests), retry with exponential backoff
      if (response.status === 429) {
        if (attempt < max_retries) {
          const delay = initial_delay_ms * 2 ** attempt
          console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${max_retries})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (error) {
      clearTimeout(timeout_id)
      last_error = error as Error

      // Check if the error was due to abort (timeout)
      const is_timeout = error instanceof Error && error.name === "AbortError"
      const error_message = is_timeout ? "Request timeout" : "Fetch error"

      if (attempt < max_retries) {
        const delay = initial_delay_ms * 2 ** attempt
        console.log(`${error_message}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${max_retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw last_error || new Error("Max retries exceeded")
}
