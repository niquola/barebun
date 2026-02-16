---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bunx <package>` instead of `npx`
- Bun automatically loads `.env`

## First-time setup

```sh
cp .env.example .env         # create .env from template (uses non-standard port 5493)
docker compose up -d          # start PostgreSQL 18 + ParadeDB (pg_search/BM25)
bun install                   # install dependencies
```

## Run

```sh
bun --watch src/index.tsx    # dev with live reload
bun src/index.tsx            # production
```

Open http://localhost:30555

## Database

PostgreSQL 18 with [ParadeDB](https://paradedb.com) pg_search extension (BM25 full-text search). Runs via Docker on a **non-standard port** to avoid conflicts.

Config is in `.env` (gitignored, see `.env.example`):

```
PGPORT=5493
PGUSER=iglite
PGPASSWORD=iglite
PGDATABASE=iglite
```

Bun auto-loads `.env` — access via `process.env.PGPORT` etc. Docker Compose also reads `.env` automatically.

```sh
docker compose up -d          # start
docker compose down           # stop
docker compose logs db        # logs
psql -h localhost -p 5493 -U iglite  # connect
```

## Architecture

Server-side rendered app: Bun + TSX templating + Tailwind CSS + htmx + Datastar. No React, no bundler step, no CLI watchers.

```
src/
├── index.tsx              # Entry: Tailwind build, routes, Bun.serve()
├── system.ts              # Context: start() creates ctx with SQL pool, stop() closes it
├── layout.tsx             # Layout component (nav, head, scripts)
├── styles.css             # Tailwind entry (@import "tailwindcss" + page CSS)
├── components/
│   └── tabs.tsx           # Reusable Datastar tab component
├── pages/
│   ├── blog.tsx           # Blog routes & components (static, no ctx)
│   ├── blog.css           # Blog typography (@apply)
│   └── tables.tsx         # DB tables browser (needs ctx)
├── repo/
│   ├── <table>.gen.ts     # Auto-generated CRUD (overwritten by codegen)
│   └── <table>.ts         # Manual wrapper (created once, never overwritten)
├── lib/
│   ├── jsx/               # JSX → HTML string runtime (no React)
│   │   ├── jsx-runtime.ts
│   │   └── jsx-dev-runtime.ts
│   ├── markdown.ts        # Bun.markdown + Shiki syntax highlighting
│   ├── db.ts              # DB helpers: array formatters/parsers for Bun SQL
│   ├── migrations.ts      # Migration engine (generate/up/down/status)
│   ├── codegen.ts         # Repo codegen from PostgreSQL metadata
│   └── livereload.ts      # WebSocket live reload for dev
scripts/
│   ├── migrate.ts         # CLI: bun scripts/migrate.ts <generate|up|down|status>
│   ├── codegen.ts         # CLI: bun scripts/codegen.ts [--schema <s>] [table ...]
│   └── sql.ts             # CLI: bun scripts/sql.ts [--test] "SQL query"
test/
│   └── repo/              # Tests mirror src/ structure
│       └── users.test.ts
migrations/                # Timestamped SQL/TS migration files
blog/                      # Markdown posts (*.md with optional frontmatter)
public/                    # Static assets (htmx.min.js, datastar.min.js, etc.)
docs/tech/                 # Detailed technical docs
docker-compose.yml         # PostgreSQL 18 + ParadeDB (pg_search/BM25)
.env.example               # Environment template (copy to .env)
```

## Key patterns

### System context

`src/system.ts` defines `Context` (holds the SQL connection pool) and lifecycle functions. Uses Bun's built-in SQL client (`import { SQL } from "bun"`) which auto-reads `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` from env.

- `start()` — creates context with connection pool for production
- `startTest()` — creates `<db>_test` database, runs migrations, returns test context
- `stop(ctx)` — closes the connection pool
- `withTx(() => ctx, fn)` — wraps a test in a transaction that rolls back (test isolation)

```tsx
import { start } from "@/system.ts";
const ctx = start();              // creates { sql: new SQL() }

// Pages that need DB export a routes(ctx) factory
import { routes as tableRoutes } from "@/pages/tables.tsx";
...tableRoutes(ctx)               // spread into Bun.serve() routes

// Pages without DB export a plain routes object
import { routes as blogRoutes } from "@/pages/blog.tsx";
...blogRoutes
```

### Migrations

```sh
bun run db:generate <name> [--ts]   # create migration files
bun run db:migrate                   # apply pending migrations
bun run db:rollback                  # rollback last migration
bun run db:status                    # show migration status
```

Files in `migrations/` follow `<timestamp>-<name>.up.sql` / `.down.sql` naming (or `.ts` with `--ts` flag). Each migration runs in a transaction. The `_migrations` table tracks applied migrations.

### SQL runner

Run ad-hoc SQL against dev or test database:

```sh
bun run db:sql "SELECT * FROM users LIMIT 5"           # dev database
bun run db:sql -- --test "SELECT * FROM _migrations"    # test database
echo "SELECT 1" | bun run db:sql                        # pipe from stdin
echo "SELECT 1" | bun run db:sql -- --test              # pipe to test db
```

### DB helpers (`src/lib/db.ts`)

Shared utilities for working with Bun's SQL client:

- **`prepareForSql(data, arrayCols)`** — converts JS arrays to PostgreSQL array literals before passing to `sql(data)`. Used in generated `.gen.ts` files for tables with array columns.
- **`parsePgArray(val)`** — parses a PostgreSQL array literal string into a JS array. Useful for types Bun doesn't auto-parse (e.g. `uuid[]`).

Bun SQL array quirks:
- `sql(data)` can't serialize JS arrays — they must be PG literals like `{a,b,c}`
- `integer[]` returns as `Int32Array`, not `number[]`
- `uuid[]` returns as raw PG literal string (not parsed)
- `text[]`, `bool[]`, `date[]`, `timestamptz[]`, `interval[]` parse correctly

### Repository codegen

```sh
bun run db:codegen                   # all public tables (skips _prefixed)
bun run db:codegen -- users posts    # specific tables
bun run db:codegen -- --schema app   # different schema
```

Generates two files per table in `src/repo/`:

- **`<table>.gen.ts`** — auto-generated, always overwritten. Contains types (`Users`, `UsersCreate`, `UsersUpdate`) and CRUD functions (`create`, `read`, `update`, `remove`, `list`). Types are derived: `Create = Omit<T, Defaults> & Partial<Pick<T, Defaults>>`, `Update = Partial<Omit<T, PK>>`.
- **`<table>.ts`** — manual wrapper, created once, **never overwritten** by codegen. Imports from `.gen.ts` with `_` prefix, re-exports with pass-through functions. Add validation, hooks, custom queries here.

Always import from `<table>.ts` (the wrapper), not from `.gen.ts` directly.

**JSONB typing via column comments:** `COMMENT ON COLUMN` with TypeScript type syntax → codegen reads via `col_description()` and generates typed fields instead of `unknown`.

```sql
-- In migration:
COMMENT ON COLUMN users.emails IS '{ value: string; type?: string; primary?: boolean }[]';
-- Generates: emails?: { value: string; type?: string; primary?: boolean }[];
```

### Import alias

`@/` maps to `./src/` via `tsconfig.json` paths. Use from anywhere — no relative `../../`:

```ts
import { start } from "@/system.ts";
import * as users from "@/repo/users.ts";
```

### Testing

Tests live in `test/`, mirroring `src/` structure. Run with `bun test`.

```sh
bun test                          # all tests
bun test test/repo/users.test.ts  # single file
```

Uses `iglite_test` database (auto-created). Each test wrapped in `withTx` runs in a transaction that rolls back — no cleanup needed.

```ts
import { startTest, stop, withTx, type Context } from "@/system.ts";

let ctx: Context;
beforeAll(async () => { ctx = await startTest(); });
afterAll(async () => { await stop(ctx); });

it("example", withTx(() => ctx, async (tx) => {
  // tx is an isolated context — rolled back after test
}));
```

### Server-side JSX → HTML strings

JSX compiles to HTML strings via custom runtime (`src/lib/jsx/`). Use `class` not `className`. No React, no virtual DOM. See [docs/tech/jsx-runtime.md](docs/tech/jsx-runtime.md).

```tsx
function Page({ title }: { title: string }) {
  return <Layout title={title}><h1>{title}</h1></Layout>;
}
// Returns: '<html>...<h1>Hello</h1>...</html>'

html(<Page title="Hello" />);
// Returns: Response with Content-Type: text/html
```

### Tailwind CSS via Bun.build()

`Bun.build()` with `bun-plugin-tailwind` at startup. The plugin's filesystem scanner finds classes in .tsx files even with just CSS as entrypoint. See [docs/tech/tailwind.md](docs/tech/tailwind.md).

### Routing

`Bun.serve()` routes + `fetch` fallback for static files (`./public/`) and WS upgrades. Pages export their routes, spread into main. See [docs/tech/routing.md](docs/tech/routing.md).

### Markdown rendering

`Bun.markdown.render()` with custom callbacks for all elements. The `code` callback hooks into Shiki for syntax highlighting (inline styles, no client JS). Must register ALL callbacks — unregistered ones strip wrapper tags. See [docs/tech/markdown.md](docs/tech/markdown.md).

### Blog engine

Markdown files in `./blog/` with optional YAML frontmatter for title/date. Loaded at startup, sorted by date. See [docs/tech/blog.md](docs/tech/blog.md).

### Live reload

WebSocket-based: server sends buildId on connect, `bun --watch` restarts process → WS drops → browser reconnects → gets new buildId → reloads. Must use `--watch` not `--hot`. See [docs/tech/livereload.md](docs/tech/livereload.md).

### Static assets

Drop files in `./public/` → served at root path. `Bun.file()` auto-detects Content-Type. See [docs/tech/static-assets.md](docs/tech/static-assets.md).

## Bun APIs used

- `Bun.serve()` — HTTP server with routes, WebSocket, fetch fallback
- `Bun.build()` — programmatic bundler (Tailwind CSS compilation)
- `Bun.file()` — file reading, static serving
- `Bun.markdown` — built-in markdown parser with render callbacks
- `SQL` from `"bun"` — built-in PostgreSQL client ([docs](https://bun.sh/docs/runtime/sql))
- `Glob` — file scanning (`./blog/*.md`)
- WebSocket — built-in, used for live reload

## Client-side libraries

- **htmx** (`/htmx.min.js`) — HTML-driven AJAX with `hx-*` attributes
- **Datastar** (`/datastar.min.js` v1.0) — reactive signals + SSE-driven DOM patching with `data-*` attributes

### Datastar in JSX

Datastar uses **colon syntax** for attribute modifiers (`data-on:click`, `data-signals:name`). Bun's JSX parser supports colons in attribute names — they compile to quoted property keys like `{"data-on:click": "..."}`, which our custom JSX runtime renders correctly.

```tsx
// Signals — reactive state
<div data-signals={`{"count": 0}`}>          // object form (no colon)
<div data-signals:count="0">                 // single signal (colon form)

// Events — colon separates plugin from event name
<button data-on:click="$count++">            // click handler
<input data-on:keydown="$name = evt.target.value">

// Conditional display
<div data-show="$count > 0">                 // show/hide

// Dynamic classes — object form (no colon needed)
<div data-class={`{"active": $tab === 'home'}`}>

// Two-way binding
<input data-bind:name />                     // binds to $name signal

// Text content
<span data-text="$count"></span>             // reactive text
```

`$varName` references a signal in expressions. Use `!` prefix for Tailwind `!important` overrides in `data-class` when needed.

Reusable components go in `src/components/`. See `src/components/tabs.tsx` for a Datastar-based example.

## Dependencies

```json
{
  "bun-plugin-tailwind": "^0.1.2",   // Tailwind bundler plugin
  "tailwindcss": "^4.1.18",          // Tailwind CSS v4
  "shiki": "^3.22.0"                 // Syntax highlighting
}
```
