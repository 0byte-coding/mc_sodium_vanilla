# Naming Conventions

## File and Folder Naming

All files and folders MUST follow snake_case naming:

- **Use snake_case**: `user_profile.ts`, `workout_template.ts`, `api_helpers.ts`
- **Never use kebab-case**: ~~`user-profile.ts`~~, ~~`workout-template.ts`~~
- **Never use hyphens (-)**: The hyphen symbol is not allowed in file or folder names

## File Extensions

All files MUST have an appropriate extension:

- TypeScript: `.ts`
- TypeScript React: `.tsx`
- JavaScript: `.js`
- JSON: `.json`
- Markdown: `.md`
- SQL: `.sql`
- etc.

## Examples

### Correct
- `database_types.ts`
- `user_settings.tsx`
- `api_integration.test.ts`
- `supabase_tools/`

### Incorrect
- ~~`database-types.ts`~~ (uses hyphens)
- ~~`workoutComplete.ts`~~ (uses camelCase for file name)
- ~~`UserSettings.tsx`~~ (uses PascalCase)
- ~~`config`~~ (missing extension)
- ~~`api-helpers/`~~ (folder uses hyphens)
