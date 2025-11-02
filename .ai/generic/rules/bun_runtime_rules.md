# Bun Runtime Rules

This project uses Bun as the default runtime. Prefer Bun's built-in APIs over third-party packages.

## Built-in APIs

- `Bun.serve()` - HTTP server with WebSocket support. Don't use `express`.
- `bun:sqlite` - SQLite database. Don't use `better-sqlite3`.
- `Bun.sql` - Postgres client. Don't use `pg` or `postgres.js`.
- `Bun.redis` - Redis client. Don't use `ioredis`.
- `WebSocket` - Built-in WebSocket. Don't use `ws` package.
- `Bun.file()` and `Bun.write()` - File I/O. Prefer over `node:fs` readFile/writeFile.
- `Bun.$` - Shell commands. Don't use `execa`.

## Environment Variables

Bun automatically loads `.env` files. **NEVER** use the `dotenv` package.
