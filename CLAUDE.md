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

## Run

```sh
bun --watch src/index.tsx    # dev with live reload
bun src/index.tsx            # production
```

Open http://localhost:30555

## Architecture

Server-side rendered app: Bun + TSX templating + Tailwind CSS + htmx + Datastar. No React, no bundler step, no CLI watchers.

```
src/
├── index.tsx              # Entry: Tailwind build, routes, Bun.serve()
├── layout.tsx             # Layout component (nav, head, scripts)
├── styles.css             # Tailwind entry (@import "tailwindcss" + page CSS)
├── components/
│   └── tabs.tsx           # Reusable Datastar tab component
├── pages/
│   ├── blog.tsx           # Blog routes & components
│   └── blog.css           # Blog typography (@apply)
├── lib/
│   ├── jsx/               # JSX → HTML string runtime (no React)
│   │   ├── jsx-runtime.ts
│   │   └── jsx-dev-runtime.ts
│   ├── markdown.ts        # Bun.markdown + Shiki syntax highlighting
│   └── livereload.ts      # WebSocket live reload for dev
blog/                      # Markdown posts (*.md with optional frontmatter)
public/                    # Static assets (htmx.min.js, datastar.min.js, etc.)
docs/tech/                 # Detailed technical docs
```

## Key patterns

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
