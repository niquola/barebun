# Static Assets

Files in `./public/` are served automatically via the `fetch` fallback.

## How it works

Unmatched routes fall through to the `fetch` handler which checks `./public/`:

```ts
async fetch(req, server) {
  const path = new URL(req.url).pathname;
  // ... WS upgrade for /__reload
  const file = Bun.file(`./public${path}`);
  if (await file.exists()) return new Response(file);
  return new Response("Not found", { status: 404 });
},
```

`Bun.file()` auto-detects Content-Type, supports range requests, and uses `sendfile(2)` on Linux.

## Current assets

- `/htmx.min.js` — htmx library (51KB)
- `/datastar.min.js` — Datastar library (35KB)
- `/robots.txt` — robots file

## Adding assets

Drop files into `./public/` — they're served at the root path:
- `public/images/logo.png` → `/images/logo.png`
- `public/favicon.ico` → `/favicon.ico`

## Priority

1. Explicit routes (`/`, `/blog`, `/styles.css`) — matched first
2. WebSocket upgrade (`/__reload`) — checked in fetch
3. Static files (`./public/`) — checked in fetch
4. 404 — if nothing matches
