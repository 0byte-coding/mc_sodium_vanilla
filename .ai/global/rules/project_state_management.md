# Project State Management

This rule defines how AI agents should maintain and update project-specific information in the `.ai/project/` directory.

## Core Principle

When an AI agent makes changes to the project that affect documentation, configuration, or established patterns, it MUST update the corresponding files in `.ai/project/` to keep information current and accurate.

## When to Update Project Files

Update `.ai/project/` files when you:

- **Modify project structure**: Add/remove packages, apps, or tools
- **Change conventions**: Update naming patterns, coding styles, or practices
- **Add new scripts**: Introduce new commands in package.json
- **Update tooling**: Modify configuration files (biome.json, tsconfig.json, etc.)
- **Establish new patterns**: Create reusable patterns that should be documented
- **Change dependencies**: Add major libraries that affect coding practices

## What to Update

### `.ai/project/rules/`

Update rule files when project practices change:

- **project_structure.md**: When adding/removing packages, apps, or changing directory layout
- **monorepo_commands.md**: When adding new scripts or changing build commands
- **typescript_coding_style.md**: When adopting new coding patterns specific to this project
- **naming_conventions_rules.md**: When project-specific naming patterns are established

### `.ai/project/workflows/`

Create or update workflow files when:

- New multi-step processes become standardized
- Project-specific automation is added
- Deployment or build processes change

## How to Update

**After making changes:**

1. Identify which project files are affected by your changes
2. Update the relevant files in `.ai/project/` to reflect the new state
3. Ensure changes are specific and accurate
4. Verify consistency across related files
5. If rule files in `.ai/project/rules/` were updated, run the `claude_md_update_workflow.md` workflow to regenerate `CLAUDE.md`

**Example:**

```markdown
If you add a new script "bun run deploy" to package.json:
→ Update .ai/project/rules/monorepo_commands.md to document the new command
→ Run claude_md_update_workflow.md to update CLAUDE.md
```

## Do NOT Update

**Never modify:**
- Auto-generated files (CHANGELOG.md)
- Files in `.ai/global/` (those are generic templates)
- Files unless changes are confirmed and committed

## Verification

Before completing a task, verify:

- All affected `.ai/project/` files have been updated
- Documentation accurately reflects the current state
- No contradictions exist between code and documentation
- Changes are committed along with code changes
