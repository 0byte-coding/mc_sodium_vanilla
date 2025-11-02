# .claudeignore Update Rules

## Purpose

The `.claudeignore` file tells Claude Code which files and directories to ignore. Generate it from `.ai/project/rules/ignore_rules.md`.

## How to Update

1. Read `.ai/project/rules/ignore_rules.md`
2. Extract the patterns from the `ignore` code block
3. Write those patterns directly to `.claudeignore` (overwrite the file)

## When to Update

- User explicitly requests it
- The `ignore_rules.md` file has been modified
