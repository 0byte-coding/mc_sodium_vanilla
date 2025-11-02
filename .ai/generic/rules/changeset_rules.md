# Changeset Creation Guide

When making changes to packages or apps in this monorepo, you must create a changeset file to document the changes. Changesets are used to manage versioning and generate changelogs.

## Creating a Changeset

Changeset files are created in the `.changeset/` directory as markdown files. The filename should be descriptive of the change and must be unique (not already exist).

### Filename Convention

Use snake_case and make it descriptive:
- `fix_workout_stats_calculation.md`
- `add_user_preferences_api.md`
- `refactor_exercise_components.md`
- `breaking_workout_logging_changes.md`

## Changeset Structure

```markdown
---
"@repo/package_name": patch
"@repo/another_package": minor
"@repo/other_name": patch
---

## Summary

A clear and concise description of what changed and why.

## Breaking Changes

(Optional) Only include this section if there are breaking changes (major version bumps).
List any breaking changes that require users to update their code.
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
- New optional parameters
- Deprecations (marking for future removal)
- Logic changes that add capabilities
- New exports from a package

### `major` (X.0.0)
Use for:
- Breaking changes that affect existing code
- Function signature changes (required parameters changed)
- Function or export deletions
- Renamed functions or exports
- Changed return types
- Changes to data structures that break compatibility

### Examples

#### Multiple Packages Minor
```markdown
---
"@repo/api": minor
"@repo/util_helper": patch
---

## Summary

Added new `get_User_preference()` function to the API package and added a `get_current_time()` function to the util helper package
```

## When to Create a Changeset

Create a changeset when you:
- Add, modify, or remove functionality in `packages/*`
- Add, modify, or remove functionality in `apps/*`
- Add, modify, or remove functionality in `tools/*`
- Fix bugs that affect users
- Make changes that should appear in the changelog
