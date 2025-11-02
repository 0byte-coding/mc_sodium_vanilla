# Workflow: Adapt Generic Rule to Project

This workflow guides you through creating a project-specific rule file from a generic rule template.

## Goal

Take a generic rule file and create an adapted version in `.ai/project/rules/` that matches this specific project's setup.

## Steps

### 1. Read the Generic Rule

The user will provide a generic rule file path (e.g., `.ai/generic/rules/monorepo_commands.md`).

Read and understand the content of this generic rule file.

### 2. Gather Project Context

Investigate the project to understand what needs to be adapted based on the generic rule's content.

**Important:** Only gather information that is relevant to the specific rule you're adapting.

Examples of what to investigate (depending on the rule type):
- For **command/script rules**: Check package.json for available scripts, package manager type, monorepo setup
- For **tooling rules**: Look for configuration files (e.g., biome.json, eslint.config.js, tsconfig.json)
- For **structure rules**: Review actual directory layout and file organization
- For **convention rules**: Check existing files for patterns already in use

Read the generic rule carefully and identify what project-specific information would make it accurate for THIS project

### 3. Create Project-Specific Rule

Create a new file in `.ai/project/rules/` with the same filename as the generic rule.

Adapt the content to match the project's actual setup:

- Replace generic placeholders with project-specific values
- Update commands, paths, names, or patterns to match what actually exists in the project
- Adjust descriptions to reflect the project's actual implementation
- Preserve the structure and organization of the generic rule
- Keep the same sections and formatting style

### 4. Maintain Consistency

Ensure the adapted rule:

- Uses the same markdown structure as the generic template
- Keeps similar section headings
- Maintains the same level of detail
- Follows the project's documentation style (check other files in `.ai/project/rules/` for consistency)

### 5. Verify Accuracy

Double-check that all information in the adapted rule is accurate for this project:

- Commands, scripts, or tools referenced actually exist
- Paths and file names are correct
- Conventions match what's actually used in the codebase
- Examples reflect real usage patterns from the project

## Important Notes

- **Do NOT** change the fundamental structure or organization of the generic rule
- **DO** adapt specific details to match this project's reality
- The goal is to make the rule accurate and actionable for THIS project while maintaining the template's clarity and organization
