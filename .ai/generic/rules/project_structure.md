# Project Structure

This document describes the typical structure of a monorepo project.

## Root Directory Structure

```
.ai/                  # AI assistant configuration and rules
.changeset/           # Changeset configuration for version management
.husky/               # Git hooks configuration
.vscode/              # VSCode workspace settings
apps/                 # Application packages (runnable, don't export)
tools/                # Utility tools and scripts
packages/             # Library packages (exportable, reusable)
.gitignore            # Git ignore rules
biome.json            # Biome configuration for linting and formatting
bun.lock              # Lock file for dependencies
package.json          # Root package.json with workspace configuration
README.md             # Project documentation
tsconfig.json         # Root TypeScript configuration
turbo.json            # Turborepo configuration for task orchestration
```

## Package Types

### packages/

Contains **library packages** that export functionality for use in other projects or workspaces.

- **Purpose**: Reusable code, shared utilities, API clients, UI components
- **Exports**: Modules, functions, components, types
- **Usage**: Imported by apps or other packages

### apps/

Contains **application packages** that are runnable but don't export anything.

- **Purpose**: End-user applications, CLIs, web servers
- **Exports**: None (entry points only)
- **Usage**: Run directly via scripts

### tools/

Contains **utility tools and scripts** for development or project maintenance.

- **Purpose**: Build scripts, code generators, migration tools, deployment utilities
- **May or may not export**: Depends on the tool's purpose

## Typical Package/App Structure

Most packages and apps follow this common internal structure:

```
package_name/
├── src/              # Source code
├── test/             # Test files (ending with `test.ts`)
├── .env              # Environment variables (gitignored)
├── .env.example      # Example environment variables (committed)
├── package.json      # Package configuration and dependencies
├── biome.json        # Package-specific linting/formatting overrides
├── README.md         # Package documentation
└── tsconfig.json     # TypeScript configuration
```

## Workspace Dependencies

Packages reference each other using the workspace protocol:

```json
{
  "dependencies": {
    "@repo/shared_package": "workspace:*"
  }
}
```

This ensures packages always use the local workspace version during development.
