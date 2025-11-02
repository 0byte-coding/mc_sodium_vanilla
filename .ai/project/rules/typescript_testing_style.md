# TypeScript Testing Style

Use Bun's built-in test runner. Test files use `snake_case` and end with `.test.ts`.

```typescript
import { describe, it, expect } from "bun:test"
```

## File Structure

Group related tests using `describe` blocks. Each `describe` block should test a specific function or feature.

```typescript
// ✅ CORRECT - Multiple describe blocks grouping related tests
describe("parse_tag", () => {
  it("should parse valid tag with major.minor MC version", () => {})
  it("should return null for invalid tag formats", () => {})
})

describe("increment_version", () => {
  it("should increment patch version", () => {})
  it("should handle double-digit patch versions", () => {})
})
```

## Naming

- **describe block**: Name of the module/function being tested
- **it statements**: Clear sentences starting with "should"

```typescript
describe("compare_states", () => {
  it("should return false for identical states", () => {})
  it("should return true when successful mods differ", () => {})
})
```

## Test Approach

This project uses **unit tests without mocking**. Tests focus on pure functions with predictable inputs and outputs.

```typescript
import { describe, expect, it } from "bun:test"
import { increment_version, parse_tag } from "../src/git_tag_manager"

describe("parse_tag", () => {
  it("should parse valid tag with major.minor MC version", () => {
    expect(parse_tag("1.14_0.1.0")).toEqual({
      mc_version: "1.14",
      modpack_version: "0.1.0"
    })
  })

  it("should return null for invalid tag formats", () => {
    expect(parse_tag("invalid")).toBeNull()
    expect(parse_tag("1.14")).toBeNull()
  })
})

describe("increment_version", () => {
  it("should increment patch version", () => {
    expect(increment_version("0.1.0")).toBe("0.1.1")
    expect(increment_version("0.1.5")).toBe("0.1.6")
  })
})
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected)
expect(object).toEqual(expected_object)

// Null checks
expect(value).toBeNull()
expect(value).not.toBeNull()

// Boolean checks
expect(result).toBe(true)
expect(result).toBe(false)

// Type checks
expect(value).toBeInstanceOf(Array)
```

## Complete Example

```typescript
import { describe, expect, it } from "bun:test"
import type { ModInstallationState } from "../src/types"
import { compare_states } from "../src/update_detector"

describe("compare_states", () => {
  it("should return false for identical states", () => {
    const state: ModInstallationState = {
      successful: [
        { method: "modrinth", identifier: "sodium", category: "optimization" },
        { method: "modrinth", identifier: "lithium", category: "optimization" }
      ],
      failed: [],
      alternative_installed: []
    }

    expect(compare_states(state, state)).toBe(false)
  })

  it("should return true when successful mods differ", () => {
    const old_state: ModInstallationState = {
      successful: [{ method: "modrinth", identifier: "sodium", category: "optimization" }],
      failed: [],
      alternative_installed: []
    }

    const new_state: ModInstallationState = {
      successful: [
        { method: "modrinth", identifier: "sodium", category: "optimization" },
        { method: "modrinth", identifier: "lithium", category: "optimization" }
      ],
      failed: [],
      alternative_installed: []
    }

    expect(compare_states(old_state, new_state)).toBe(true)
  })
})
```

## Best Practices

- One assertion concept per test
- Descriptive test names using "should"
- Test pure functions with clear inputs and outputs
- Avoid testing implementation details
- Group related tests in describe blocks
