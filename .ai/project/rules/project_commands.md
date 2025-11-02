# Project Commands

This project uses Bun for the TypeScript tooling in the `modpack_creator/` directory.

## Common Scripts

The following `bun run` scripts are available in `modpack_creator/package.json`:

### Development
- `bun run dev`: Runs the modpack creator tool (processes and installs mods)
- `bun run dev_full`: Runs the tool with `--full` flag (creates full modpack) and `--no-upload`
- `bun run dev_safe`: Runs the tool with `--safe` flag (creates safe modpack) and `--no-upload`
- `bun run auto_update`: Runs the auto_update script to check for mod updates

### Building
- `bun run build`: Builds the project for production with Bun bundler
- `bun run clean`: Deletes `node_modules` and `dist` folders

### Testing
- `bun run test`: Runs all tests using Bun's test runner
- `bun run test_coverage`: Runs tests with coverage reporting

### Code Quality
- `bun run check_all`: Runs type checking and fixes all linting/formatting issues (runs `check_fix` and `typecheck`)
- `bun run check_and_test`: Does all checks and runs tests with coverage. **You should mostly use this script.**
- `bun run typecheck`: Runs TypeScript type checking without emitting files
- `bun run check`: Checks code with Biome (linting and formatting)
- `bun run check_fix`: Fixes linting and formatting issues automatically
- `bun run format`: Formats code with Biome
- `bun run lint`: Lints code with Biome

### Versioning
- `bun run changeset`: Creates a new changeset for version management
- `bun run changeset_version`: Applies changesets and updates versions

## Running Commands

All commands should be run from the `modpack_creator/` directory:

```bash
cd modpack_creator
bun run check_and_test
```

Or from the project root:

```bash
cd modpack_creator && bun run check_and_test
```
