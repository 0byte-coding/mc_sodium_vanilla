# Ignore Rules

Files and directories that AI agents should completely ignore and never read or modify:

```ignore
# Cache & output directories
node_modules/
dist/
out/
coverage/

# Build artifacts & modpack outputs
*.zip
*.mrpack
*.tgz

# Secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build artifacts & caches
*.tsbuildinfo
bun.lock
.cache
.eslintcache

# IDE configuration
.vscode/
.idea/

# Logs
logs/
*.log
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# OS files
.DS_Store

# AI related
.ai/generic/

# Minecraft mod downloads
mods/
resourcepacks/
```

## Notes

- `mods/` and `resourcepacks/` directories contain downloaded Minecraft mods and resource packs, which are binary files managed by packwiz
- Only the TOML configuration files for mods should be edited, not the mod files themselves
- `node_modules/` contains dependencies that should never be modified directly
- `.env` files contain secrets and should never be committed or exposed
