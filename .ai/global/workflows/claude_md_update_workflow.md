# Update CLAUDE.md Workflow

## Objective

Generate the `CLAUDE.md` file with embedded project rules for quick AI agent reference.

## Instructions

Follow these instructions precisely to update the `CLAUDE.md` file:

### 1. Generate CLAUDE.md in a Single Command

Use the following compound bash command to generate the entire `CLAUDE.md` file in **one tool call**:

```bash
{
  cat << 'EOF'
# CLAUDE.md

This file contains frequently-needed project rules embedded for quick reference. These rules are copied verbatim from `.ai/project/rules/` to minimize tool calls during common tasks.

**Files embedded in this document:**
- `read_only_rules.md` - Critical rules about read-only files
- `project_structure.md` - Project organization and structure
- `typescript_coding_style.md` - TypeScript coding standards
- `project_commands.md` - Common project commands
- `naming_conventions_rules.md` - Naming standards
- `typescript_testing_style.md` - Testing conventions and patterns
- `bun_runtime_rules.md` - Bun runtime configuration and usage
- `project_state_management.md` - Rules for keeping project documentation current

---

## 📄 Source: `.ai/project/rules/read_only_rules.md`

EOF
  cat .ai/project/rules/read_only_rules.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/project_structure.md`

EOF
  cat .ai/project/rules/project_structure.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/typescript_coding_style.md`

EOF
  cat .ai/project/rules/typescript_coding_style.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/project_commands.md`

EOF
  cat .ai/project/rules/project_commands.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/naming_conventions_rules.md`

EOF
  cat .ai/project/rules/naming_conventions_rules.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/typescript_testing_style.md`

EOF
  cat .ai/project/rules/typescript_testing_style.md
  cat << 'EOF'

---

## 📄 Source: `.ai/project/rules/bun_runtime_rules.md`

EOF
  cat .ai/project/rules/bun_runtime_rules.md
  cat << 'EOF'

---

## 📄 Source: `.ai/global/rules/project_state_management.md`

EOF
  cat .ai/global/rules/project_state_management.md
} > CLAUDE.md
```

### 2. Files to Embed

The following rule files must be embedded in this exact order:

1. `.ai/project/rules/read_only_rules.md` - Critical rules about read-only files
2. `.ai/project/rules/project_structure.md` - Project organization and structure
3. `.ai/project/rules/typescript_coding_style.md` - TypeScript coding standards
4. `.ai/project/rules/project_commands.md` - Common project commands
5. `.ai/project/rules/naming_conventions_rules.md` - Naming standards
6. `.ai/project/rules/typescript_testing_style.md` - Testing conventions and patterns
7. `.ai/project/rules/bun_runtime_rules.md` - Bun runtime configuration and usage
8. `.ai/global/rules/project_state_management.md` - Rules for keeping project documentation current

### 3. Format Requirements

Each embedded rule section MUST follow this exact format:

```markdown
---

## 📄 Source: `relative/path/to/file.md`

[Complete file content copied verbatim via cat command]
```

**Critical requirements:**
- Horizontal rule (`---`) separates each section
- Section heading with file icon: `## 📄 Source:`
- Relative file path in backticks
- Complete file content copied using `cat` (no modifications)
- No manual editing of the copied content

### 4. Verification

After generating `CLAUDE.md`, verify that:
- All 8 rule files are embedded
- Each section has proper formatting with `---` separator and `## 📄 Source:` heading
- File contents are complete and verbatim (no truncation or modification)
- The file list in the header matches the embedded files

## Expected Outcome

A complete `CLAUDE.md` file at the project root containing all 8 embedded rule files, generated efficiently in a single bash command.
