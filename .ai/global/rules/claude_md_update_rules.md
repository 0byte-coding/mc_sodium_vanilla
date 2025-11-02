# CLAUDE.md Update Rules

## Purpose

The `CLAUDE.md` file provides AI agents with frequently-needed project information to minimize tool calls. It contains verbatim copies of key rule files that are needed in almost every task.

## When to Update

Update `CLAUDE.md` when:
- User explicitly requests adding or updating rule content
- Modifying rules that are already embedded in `CLAUDE.md`
- User identifies new rules that should be embedded (frequently-used core rules)

**DO NOT update** for specialized rules that are only occasionally needed.

## How to Generate

Generate the entire `CLAUDE.md` file in a **single bash command** using a compound command that chains together the header, sections, and file contents.

### Single Command Template

```bash
{
  cat << 'EOF'
# CLAUDE.md

This file contains frequently-needed project rules embedded for quick reference.

**Files embedded in this document:**
- `file1.md` - Description
- `file2.md` - Description

---

## 📄 Source: `.ai/project/rules/file1.md`

EOF
  cat .ai/project/rules/file1.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/file2.md`

EOF
  cat .ai/project/rules/file2.md
} > CLAUDE.md
```

## Section Format

Each embedded rule file MUST follow this format:

```markdown
---

## 📄 Source: `relative/path/to/rule_file.md`

[Exact file content copied via cat command]
```

**Format requirements:**
- Horizontal rule (`---`) separates sections
- Heading with file icon emoji: `## 📄 Source:`
- Relative file path in backticks
- Complete file content copied verbatim using `cat`
- No modifications to copied content

## Best Practices

- **Single command**: Always use the compound command pattern `{ ... } > CLAUDE.md` to generate in one tool call
- **Keep it current**: Update `CLAUDE.md` when embedded rules change
- **Be selective**: Only embed truly essential, frequently-used rules
- **User decides**: Let the user specify which files to include
