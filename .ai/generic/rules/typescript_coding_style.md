# TypeScript Coding Style

## Code Structure

- **Code Organization**: Prefer separating code into multiple functions and files to improve readability. Function and filenames should be descriptive so their purpose is clear.
- **File Granularity**: Each file should ideally focus on a single responsibility or a cohesive set of related functionalities. Avoid creating overly large or monolithic files.
- **Semicolons**: Do not use semicolons.
- **Type Safety**: Never use `as any`. All code must remain fully type-safe. Use `unknown` with type guards when needed.

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

export async function fetch_data(id: string): Promise<Result<Data, Error>> {
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
 * Initializes the application by connecting to the database and setting up routes.
 * Must be called before handling any requests.
 */
async function initialize_app(): Promise<Result<void, Error>> {
  // ...
}

/**
 * Creates a new user in the system after validating their input.
 * Sends a welcome email upon successful creation.
 *
 * @param user_data The data for the new user, including name and email
 */
function create_user(user_data: UserCreationData): Result<User, Error> {
  // ...
}
```

**When to use:**
- Always: Public functions, classes, complex algorithms
- Optional: Simple utility functions with self-explanatory names

## Error Handling

Use the `neverthrow` library to make functions return errors instead of throwing them. Never use try/catch blocks.

- **Expected result type**: `type Result<T, E> = Ok<T, E> | Err<T, E>`
- **Check for errors**: Use `res.isErr()` or `res.isOk()`
- **Access value**: Use `res.value`
- **Return success**: `return ok(value)`
- **Return error**: `return err(error)` or `return err(new Error(msg))`

```typescript
import { Result, ok, err } from "neverthrow"

function get_user_by_id(user_id: string): Result<User, Error> {
  const user = database.find(user_id)

  if (!user) {
    return err(new Error(`User with ID ${user_id} not found`))
  }

  return ok(user)
}

// Using the result
const result = get_user_by_id("123")

if (result.isErr()) {
  console.error("Failed:", result.error)
  return
}

const user = result.value
```
