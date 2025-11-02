# Changeset Creation Guide

This project has changeset tooling available in [modpack_creator/package.json](modpack_creator/package.json) but does not currently use it actively (no `.changeset/` directory exists yet).

If changesets are enabled in the future, follow these guidelines:

## Creating a Changeset

Changeset files would be created in the `.changeset/` directory as markdown files. The filename should be descriptive of the change and must be unique (not already exist).

### Filename Convention

Use snake_case and make it descriptive:
- `fix_mod_update_detection.md`
- `add_git_tag_automation.md`
- `refactor_version_discovery.md`
- `breaking_mod_list_format_changes.md`

## Changeset Structure

```markdown
---
"modpack_creator": patch
---

## Summary

A clear and concise description of what changed and why.

## Breaking Changes

(Optional) Only include this section if there are breaking changes (major version bumps).
List any breaking changes that require users to update their workflow.
```

## Version Bump Guidelines

### `patch` (0.0.X)
Use for:
- Bug fixes
- Refactoring (no behavior change)
- Documentation updates
- Performance improvements
- Internal code changes
- Dependency updates

**Most changes should be patch bumps.**

### `minor` (0.X.0)
Use for:
- New functions or features added
- New optional parameters or flags
- Deprecations (marking for future removal)
- Logic changes that add capabilities
- New exports from modules

### `major` (X.0.0)
Use for:
- Breaking changes that affect existing workflows
- Function signature changes (required parameters changed)
- Function or export deletions
- Renamed functions or exports
- Changed return types
- Changes to data structures that break compatibility

## Available Commands

```bash
# Create a new changeset
bun run changeset

# Apply changesets and update versions
bun run changeset_version
```

## When to Create a Changeset

Create a changeset when you:
- Add, modify, or remove functionality in the modpack creator tool
- Fix bugs that affect users
- Make changes that should appear in the changelog
- Change the CLI interface or flags
- Modify the output format or behavior
