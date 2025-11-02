# Naming Conventions

## File and Folder Naming

All files and folders MUST follow snake_case naming:

- **Use snake_case**: `user_profile.ts`, `mod_list.ts`, `git_tag_manager.ts`
- **Never use kebab-case**: ~~`user-profile.ts`~~, ~~`mod-list.ts`~~
- **Never use hyphens (-)**: The hyphen symbol is not allowed in file or folder names

## File Extensions

All files MUST have an appropriate extension:

- TypeScript: `.ts`
- TypeScript React: `.tsx`
- JavaScript: `.js`
- JSON: `.json`
- Markdown: `.md`
- TOML: `.toml`
- etc.

## Examples

### Correct
- `git_tag_manager.ts`
- `auto_update.ts`
- `fetch_with_retry.test.ts`
- `modpack_creator/`

### Incorrect
- ~~`git-tag-manager.ts`~~ (uses hyphens)
- ~~`autoUpdate.ts`~~ (uses camelCase for file name)
- ~~`GitTagManager.ts`~~ (uses PascalCase)
- ~~`config`~~ (missing extension)
- ~~`mod-list/`~~ (folder uses hyphens)
