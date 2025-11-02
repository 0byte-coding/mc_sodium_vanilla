# TypeScript Testing Style

Use Bun's built-in test runner with one `describe` block per test file. Test files use `snake_case` and end with `.test.ts`.

```typescript
import { describe, it, expect, spyOn, afterEach } from "bun:test"
```

## File Structure

Each test file **MUST** have exactly one `describe` block.

```typescript
// ✅ CORRECT
describe("user_service", () => {
  it("should create a new user with valid data", () => {})
  it("should return error when email is invalid", () => {})
})

// ❌ INCORRECT: Multiple describe blocks
describe("create_user", () => {})
describe("delete_user", () => {})
```

## Naming

- **describe block**: Name of the module/function being tested
- **it statements**: Clear sentences starting with "should"

```typescript
describe("calculate_workout_stats", () => {
  it("should return zero for empty workout", () => {})
  it("should sum up total volume correctly", () => {})
})
```

## Mocking

**NEVER** use `mock()`. Always use `spyOn()` and clean up properly.

```typescript
// ✅ CORRECT
let spy_fetch = spyOn(api_module, "fetch_data")

// ❌ INCORRECT
const mock_fetch = mock(() => Promise.resolve(data))
```

## Spy Lifecycle Pattern

Follow this pattern to avoid test pollution:

```typescript
describe("user_service", () => {
  // 1. Initialize spy
  let spy_fetch_user = spyOn(user_service, "fetch_user")

  // 2. Clean up after each test
  afterEach(() => {
    spy_fetch_user.mockClear()
    spy_fetch_user.mockRestore()
    spy_fetch_user = spyOn(user_service, "fetch_user")
  })

  // 3. Set mock behavior inside each test
  it("should handle successful fetch", async () => {
    spy_fetch_user.mockResolvedValue(ok(user_data))

    const result = await get_user("123")
    expect(result.isOk()).toBe(true)
  })
})
```

**Why?**
- `mockClear()`: Clears call history
- `mockRestore()`: Restores original implementation
- Re-spying: Fresh state for each test

**IMPORTANT**: Always set mock behavior inside `it()` blocks, never at initialization.

## Mock Methods

- `mockResolvedValue(value)`: For async functions that succeed
- `mockRejectedValue(error)`: For async functions that fail
- `mockImplementation(fn)`: For custom logic

```typescript
// Success case
it("should return user data", async () => {
  spy_fetch.mockResolvedValue(ok(user_data))
  const result = await get_user("123")
  expect(result.isOk()).toBe(true)
})

// Error case
it("should handle errors", async () => {
  spy_fetch.mockRejectedValue(new Error("Network error"))
  const result = await get_user("123")
  expect(result.isErr()).toBe(true)
})

// Custom implementation
it("should validate input", () => {
  spy_validate.mockImplementation((email: string) => email.includes("@"))
  expect(validate_user_input({ email: "invalid" })).toBe(false)
})
```

## Complete Example

```typescript
import { describe, it, expect, spyOn, afterEach } from "bun:test"
import { ok } from "neverthrow"
import * as database from "./database"
import { create_user, delete_user } from "./user_service"

describe("user_service", () => {
  let spy_db_insert = spyOn(database, "insert")
  let spy_db_delete = spyOn(database, "delete")

  afterEach(() => {
    spy_db_insert.mockClear()
    spy_db_insert.mockRestore()
    spy_db_insert = spyOn(database, "insert")

    spy_db_delete.mockClear()
    spy_db_delete.mockRestore()
    spy_db_delete = spyOn(database, "delete")
  })

  it("should create user successfully", async () => {
    spy_db_insert.mockResolvedValue(ok({ id: "123", name: "Alice" }))

    const result = await create_user({ name: "Alice", email: "alice@example.com" })

    expect(result.isOk()).toBe(true)
    expect(spy_db_insert).toHaveBeenCalledTimes(1)
  })

  it("should delete user by id", async () => {
    spy_db_delete.mockResolvedValue(ok(undefined))

    const result = await delete_user("123")

    expect(result.isOk()).toBe(true)
    expect(spy_db_delete).toHaveBeenCalledWith("123")
  })
})
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected)
expect(object).toEqual(expected_object)

// neverthrow results
expect(result.isOk()).toBe(true)
expect(result.isErr()).toBe(true)

// Spy assertions
expect(spy_function).toHaveBeenCalled()
expect(spy_function).toHaveBeenCalledTimes(2)
expect(spy_function).toHaveBeenCalledWith("arg1", "arg2")
```

## Best Practices

- One assertion concept per test
- Descriptive test names using "should"
- Set mock behavior inside each test
- Always clean up spies with `afterEach`
- Prefer real implementations over mocks when possible
