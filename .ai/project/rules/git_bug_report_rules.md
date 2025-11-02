# Bug Report Template

When reporting a bug, please use the following template to ensure all necessary information is provided.

### Description

A clear and concise description of what the bug is.

### Steps to Reproduce and Observed Behavior

1. Run command '...'
2. With flags '...'
3. See error

A clear and concise description of what you observed.

### Expected Behavior

A clear and concise description of what you expected to happen.

---

## Referencing GitHub Resources

When writing issues, pull requests, or comments, you can reference other GitHub resources:

### Issues and Pull Requests
- Reference an issue: `#123`
- Reference a PR: `#456`
- Reference from another repo: `owner/repo#789`

### Commits
- Reference a commit: Full SHA or short SHA (e.g., `abc1234` or `abc1234567890abcdef1234567890abcdef12345`)
- Link format: `owner/repo@abc1234`

### Files and Code
- Link to a file: `[fetch_with_retry.ts](modpack_creator/src/fetch_with_retry.ts)`
- Link to specific line: `[fetch_with_retry.ts:19](modpack_creator/src/fetch_with_retry.ts#L19)`
- Link to line range: `[fetch_with_retry.ts:19-34](modpack_creator/src/fetch_with_retry.ts#L19-L34)`
- Permanent link (with commit SHA): `https://github.com/owner/repo/blob/abc1234/modpack_creator/src/fetch_with_retry.ts#L19-L34`

### Users
- Mention a user: `@username`
- Mention a team: `@org/team-name`

---

## Available Labels

Please use one or more of the following labels to categorize the issue:

- `bug`: Something is not working
- `enhancement`: Improve existing functionality
- `security`: This is a security issue
- `testing`: Issue or pull request related to testing
- `docs`: Documentation changes
- `breaking`: Breaking change that won't be backward compatible
- `question`: More information is needed
- `wontfix`: This won't be fixed
- `modpack`: Related to modpack configuration or mod selection
- `tooling`: Related to the modpack_creator tool
