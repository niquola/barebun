# Routing

All HTTP routing via `Bun.serve()` `routes` property. No external routers.

## Request flow

```
Request → routes (exact > params > wildcard) → fetch fallback → 404
```

1. **Explicit routes** — matched by specificity (exact → `:param` → `*`)
2. **`fetch` fallback** — handles WS upgrades (`/__reload`) and static files (`./public/`)
3. **404** — if nothing matches

## Route patterns

```ts
routes: {
  "/":           () => html(<Home />),         // exact
  "/blog":       () => html(<BlogIndex />),    // exact
  "/blog/:slug": (req) => { /* req.params.slug */ },  // param
  "/api/*":      () => new Response("catch-all"),      // wildcard
}
```

## Per-method handlers

```ts
"/api/posts": {
  GET: () => Response.json(posts),
  POST: async (req) => { /* req.json() */ },
},
```

## Static responses

Zero-allocation, ~15% faster than handler functions:

```ts
"/styles.css": new Response(css, { headers: { "Content-Type": "text/css" } }),
"/health": new Response("OK"),
```

## Spreading page routes

Pages export their own routes, spread into main:

```ts
// src/pages/blog.tsx
export const routes = {
  "/blog": () => html(<BlogIndex />),
  "/blog/:slug": (req) => { ... },
};

// src/index.tsx
import { routes as blogRoutes } from "./pages/blog.tsx";
Bun.serve({ routes: { ...blogRoutes } });
```

## Static files via fetch fallback

```ts
async fetch(req, server) {
  const path = new URL(req.url).pathname;
  if (path === "/__reload") {
    if (server.upgrade(req)) return;  // WS upgrade
  }
  const file = Bun.file(`./public${path}`);
  if (await file.exists()) return new Response(file);
  return new Response("Not found", { status: 404 });
},
```
