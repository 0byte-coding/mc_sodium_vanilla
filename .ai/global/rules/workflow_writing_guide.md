# Workflow Writing Guide

This document explains how to write effective workflow files for the `.ai/` directory.

## File Naming

Workflow files MUST follow snake_case naming with the `.md` extension:

- **Use snake_case**: `update_dependencies_workflow.md`, `setup_new_package_workflow.md`
- **Include descriptive suffixes**: Prefer `*_workflow.md` to clearly identify files as workflows
- **Keep names action-oriented**: Use verbs that describe what the workflow accomplishes

## File Structure

```markdown
# [Clear Action-Oriented Title]

[Brief description of what this workflow accomplishes]

## Goal/Objective

[Single paragraph describing the end result]

## Instructions/Steps

[Step-by-step instructions for completing the workflow]
```

**Required:**
- Title (H1) using `#` - should be action-oriented
- Brief introduction or objective section
- Clear instructions organized as numbered steps or sections

**Optional:**
- "Expected Outcome" or "Verification" sections
- Code examples showing exact commands
- Important notes or warnings

## Writing Style

Workflows are **imperative instructions** for AI agents. Write clear, direct commands:

- **Use imperative verbs**: "Read", "Create", "Execute", "Generate", "Verify"
- **Be explicit about tool usage**: "Use the following compound bash command"
- **Specify exact order**: "Follow these instructions precisely", "in this exact order"
- **Include verification steps**: "Double-check that...", "Verify that..."

Use emphasis:
- **Bold** for important notes: `**Important:**`, `**Critical requirements:**`
- `Inline code` for file paths, commands, and technical terms

## Step Organization

**Numbered steps** for complex multi-stage workflows:

```markdown
## Steps

### 1. [Step Name]

[Instructions for this step]

### 2. [Next Step Name]

[Instructions for next step]
```

**Section-based** for workflows with distinct phases:

```markdown
## Instructions

### Generate Output

[Instructions]

### Verify Results

[Verification steps]
```

## Code Examples

Always include **exact commands**:

````markdown
```bash
bash .ai/global/scripts/copy_workflows_to_claude_commands.sh
```
````

Commands must be copy-paste ready and executable.

## Common Patterns

**Investigation:**
```markdown
### Gather Project Context

Investigate the project to understand what needs to be adapted.

Examples:
- For **command rules**: Check package.json
- For **tooling rules**: Look for config files
```

**Execution:**
```markdown
### Generate Output

Use the following command:
[exact command here]
```

**Verification:**
```markdown
### Verify Accuracy

Verify that:
- Commands exist
- Paths are correct
- Examples match actual usage
```

## Best Practices

- **Be specific**: ✅ "Run `bun run build`" ❌ "Build the project"
- **One workflow per file**: Each file should accomplish a single cohesive task
- **Make it autonomous**: AI agents should execute without human intervention
- **Include context**: Explain WHY steps are needed, not just WHAT to do
- **Keep it concise**: Aim for ~100 lines or less. Workflows should be focused and actionable.
- **Write generically**: Avoid project-specific paths in global workflows
- **Test executability**: Ensure commands can be run exactly as written

## Workflow Types

**Action workflows**: Execute specific tasks (generating files, running scripts)
- **Example:** `claude_md_update_workflow.md`

**Process workflows**: Multi-step processes requiring investigation
- **Example:** `adapt_generic_rule.md`

**Script wrappers**: Simple workflows executing a single script
- **Example:** `copy_workflows_to_claude_commands.md`

## Location Guidelines

- **Global workflows** (`.ai/global/workflows/`): Generic, reusable across projects
- **Project workflows** (`.ai/project/workflows/`): Project-specific customizations
