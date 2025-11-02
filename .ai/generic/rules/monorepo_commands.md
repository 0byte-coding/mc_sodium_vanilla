# Monorepo Commands

This is a Bun monorepo project.

## Common Scripts

The following `bun run` scripts are available for common development tasks:

- `bun run clean`: Deletes `node_modules` and `dist` folders.
- `bun run dev`: Starts the application in development mode.
- `bun run build`: Builds the package for production.
- `bun run check_all`: Checks TypeScript type errors, linting and formatting.
- `bun run check_and_test`: Does all the checks and runs tests with coverage. You should mostly just use this script.

## Running Scripts for Specific Packages

You can run a script for a specific package using the `--filter=<packagename>` flag:

```bash
bun run dev --filter=@repo/example
```
