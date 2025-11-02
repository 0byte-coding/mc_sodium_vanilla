# Rule Writing Guide

This document explains how to write effective rule files for the `.ai/` directory.

## File Naming

Rule files MUST follow snake_case naming with the `.md` extension:

- **Use snake_case**: `naming_conventions_rules.md`, `typescript_coding_style.md`
- **Include descriptive suffixes**: Prefer `*_rules.md`, `*_guide.md`, or `*_style.md`

## File Structure

```markdown
# [Clear Title]

[Brief introduction]

## [Section Name]

[Guidelines and examples]

### [Subsection] (optional)
```

**Required:**
- Title (H1) using `#`
- Brief introduction paragraph
- Sections (H2) using `##`
- Code examples showing correct/incorrect usage

**Optional:**
- Subsections (H3) for deeper organization
- Tables for comparisons
- Lists for clarity

## Writing Style

Use clear, directive language:

- **MUST**: Required, no exceptions
- **SHOULD**: Strong recommendation
- **MAY**: Optional
- **NEVER**: Explicitly forbidden

Use emphasis:
- **Bold** for key terms: `**MUST**`, `**Required**`
- `Inline code` for technical terms: `` `snake_case` ``

Always show correct and incorrect patterns:

```markdown
### Correct
- `user_profile.ts`

### Incorrect
- ~~`user-profile.ts`~~ (uses hyphens)
```

Or in code blocks:

```typescript
// ✅ CORRECT
function my_function(param: string): number {
  return param.length
}

// ❌ INCORRECT
const my_function = (param: string): number => {
  return param.length
}
```

## Code Examples

Always specify language in fenced code blocks:

````markdown
```typescript
function my_function(): void {
  console.log("Hello")
}
```
````

Provide meaningful context and use real codebase examples when possible.

## Common Patterns

**Lists for alternatives:**

```markdown
- `snake_case` for file names. Don't use `kebab-case`.
- `function` declarations. Don't use arrow functions.
```

**Decision lists:**

```markdown
Create a changeset when you:
- Add functionality → `minor`
- Fix a bug → `patch`
- Break compatibility → `major`
```

## Best Practices

- **Be specific**: ✅ "Use snake_case for all file names" ❌ "Use good names"
- **Explain terms**: ✅ "Row Level Security (RLS)" ❌ "RLS"
- **Be clear**: ✅ "NEVER use `as any`" ❌ "Try to use type-safe code"
- **Stay current**: Update rules when practices change
- **Check consistency**: Ensure new rules don't contradict existing ones
- **Keep it short**: Aim for ~100 lines or less. Rules should be concise and focused.
- **Write generically**: Avoid project-specific file names or paths unless in project-specific rule directories. Generic rules should apply across projects.
- **Avoid tables**: Use simple lists instead of comparison tables for better readability.
