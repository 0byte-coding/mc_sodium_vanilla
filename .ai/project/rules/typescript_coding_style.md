# TypeScript Coding Style

## Code Structure

- **Code Organization**: Prefer separating code into multiple functions and files to improve readability. Function and filenames should be descriptive so their purpose is clear.
- **File Granularity**: Each file should ideally focus on a single responsibility or a cohesive set of related functionalities. Avoid creating overly large or monolithic files.
- **Semicolons**: Do not use semicolons (configured in biome.json as "asNeeded").
- **Type Safety**: Avoid using `as any`. All code should remain type-safe. Use `unknown` with type guards when needed.

## Naming Conventions

- **Filenames, function names, variable names, object properties**: Use `snake_case`
- **Class names, interfaces, type aliases**: Use `PascalCase`
- **Enum values**: Use lowercase `snake_case`
- **Private class members**: Prefix with underscore `_my_private_property`

## Function Definitions

Use `function name()` instead of `const name = () =>`:

```typescript
// ✅ CORRECT
function my_function(param: string): number {
  return param.length
}

export async function fetch_data(id: string): Promise<Data> {
  // ...
}

// ❌ INCORRECT
const my_function = (param: string): number => {
  return param.length
}
```

### Function Parameters

- **Type Annotations**: All parameters must have explicit type annotations
- **Named Parameters**: Use named parameters when a function has more than 3 parameters
- **Parameter Types**: Never inline complex object types; always define an interface or type alias

```typescript
// ✅ CORRECT: Many parameters using interface
interface CreateUserParams {
  name: string
  email: string
  age: number
  address: string
}

function create_user(params: CreateUserParams): User {
  // ...
}

// ❌ INCORRECT: Inlined object type
function create_user(params: { name: string; email: string }): User {
  // ...
}
```

## Docstrings

Use JSDoc comments for public functions and classes. Focus on *why* a function/class exists and its purpose, rather than *what* it does (which should be clear from its name).

```typescript
/**
 * Performs an HTTP fetch with exponential backoff retry logic.
 *
 * Automatically retries on network errors and HTTP 429 (rate limit) responses.
 * Uses exponential backoff to increase delay between retries.
 */
async function fetch_with_retry(url: string, max_retries = 5): Promise<Response> {
  // ...
}

/**
 * Detects if any mods have available updates by comparing installed versions
 * with the latest versions from Modrinth API.
 *
 * @param installed_mods - Array of currently installed mod information
 */
function detect_updates(installed_mods: InstalledMod[]): Promise<UpdateInfo[]> {
  // ...
}
```

**When to use:**
- Always: Public functions, classes, complex algorithms
- Optional: Simple utility functions with self-explanatory names

## Error Handling

This project uses standard try/catch error handling with thrown exceptions.

```typescript
async function fetch_data(url: string): Promise<Data> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}
```

For retry logic and network operations, see [fetch_with_retry.ts](modpack_creator/src/fetch_with_retry.ts) which implements exponential backoff.
