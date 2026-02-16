# iglite

Server-side rendered web app using Bun + TSX templating + Tailwind CSS — no React, no bundler step, no CLI watchers.

## Setup

```sh
bun install
bun --hot src/index.tsx
```

Open http://localhost:30555

## Tailwind CSS + Bun.serve() + TSX Templating

The key pattern: use `Bun.build()` with `bun-plugin-tailwind` to compile Tailwind CSS at server startup, then serve it as a static route.

### The problem

`bun-plugin-tailwind` is a **bundler plugin** designed for HTML imports (`import index from "./index.html"`). In that mode, Bun's bundler finds `<link>` and `<script>` tags, processes CSS, and the plugin hooks in automatically.

With server-side TSX templating, there are no HTML imports — JSX produces HTML strings at runtime. The bundler never sees your `<link>` tags, so the plugin has nothing to hook into via `bunfig.toml`.

### The solution

Call `Bun.build()` programmatically at the top of your server file:

```ts
import tailwindPlugin from "bun-plugin-tailwind";

// 1. Build Tailwind CSS at startup
const built = await Bun.build({
  entrypoints: ["./src/styles.css"],
  plugins: [tailwindPlugin],
});
const css = await built.outputs[0].text();

// 2. Serve compiled CSS as a static route
Bun.serve({
  routes: {
    "/styles.css": new Response(css, {
      headers: { "Content-Type": "text/css" },
    }),
    "/": () => html(
      <Layout title="Home">
        <h1 class="text-3xl font-bold">Hello</h1>
      </Layout>
    ),
  },
});
```

```css
/* src/styles.css */
@import "tailwindcss";
```

### Why this works

The plugin internally has **two sources** for discovering which Tailwind classes you use:

1. **`onBeforeParse`** (native NAPI, Rust) — scans files in the bundle's module graph
2. **Filesystem scanner** (`tailwindcss-oxide`) — scans `**/*` from project root

Even though only `styles.css` is in the bundle graph, the **filesystem scanner** walks your entire project and finds Tailwind classes in `.tsx`, `.ts`, `.html` files. It extracts candidates like `text-3xl`, `font-bold`, `border-gray-300` and compiles only the CSS you actually use.

### Hot reload

With `bun --hot`, editing any `.tsx` file re-executes the module top-to-bottom:

```
Edit index.tsx (add bg-purple-700)
  → --hot detects change
  → module re-executes
  → Bun.build() re-runs
  → plugin scans files, finds new class
  → CSS rebuilt (16888 → 17146 bytes)
  → new Response(css, ...) serves updated CSS
  → browser refresh picks up new styles
```

No separate watch process needed. Single `bun --hot src/index.tsx` handles everything.

`--hot` keeps the process alive and re-executes changed modules. `--watch` would also work but kills and restarts the entire process (slower, port flicker).

## Server-Side JSX

JSX compiles to HTML strings via a minimal runtime (`jsx/jsx-runtime.ts`) — no React, no virtual DOM:

```tsx
function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div class="border border-gray-300 p-4 my-2 rounded-lg">
      <strong>{name}</strong>
      <br />
      <span class="text-gray-600">{email}</span>
    </div>
  );
}
// → '<div class="border border-gray-300 p-4 my-2 rounded-lg"><strong>Alice</strong><br /><span class="text-gray-600">alice@example.com</span></div>'
```

TSX config in `tsconfig.json`:
```json
{
  "jsx": "react-jsx",
  "jsxImportSource": "jsx"
}
```

The `html()` helper wraps JSX output into a `Response`:
```ts
function html(body: string) {
  return new Response("<!DOCTYPE html>" + body, {
    headers: { "Content-Type": "text/html" },
  });
}
```

## Tailwind Config

Tailwind v4 uses CSS-first configuration — no `tailwind.config.js`:

```css
/* src/styles.css */
@import "tailwindcss";

/* Optional customization */
@theme {
  --color-brand: oklch(0.6 0.2 250);
}

@utility card {
  @apply border border-gray-300 p-4 my-2 rounded-lg;
}
```

## Project Structure

```
iglite/
├── src/
│   ├── index.tsx        # Server + JSX components + Tailwind build
│   └── styles.css       # Tailwind entry point (@import "tailwindcss")
├── jsx/
│   ├── jsx-runtime.ts   # JSX → HTML string runtime
│   └── jsx-dev-runtime.ts
├── .claude/
│   └── skills/          # Claude Code skills (markdown, routing, htmx, tailwind, datastar)
├── package.json
└── tsconfig.json
```

## Google OAuth Setup

Google Sign-In credentials are stored in GCP Secret Manager (`atomic-ehr/iglite-google-oauth`).

**For developers** — fetch credentials and save to `.env`:

```sh
bash scripts/google-oauth-setup.sh
```

**First-time setup** (when creating a new OAuth client):

1. Go to [GCP Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials?project=atomic-ehr)
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID** > **Web application**
3. Name: `iglite-dev`
4. Authorized JavaScript origins: `http://localhost:30555`
5. Authorized redirect URIs: `http://localhost:30555/auth/google/callback`
6. Copy the Client ID and Client Secret, then store in Secret Manager:

```sh
bash scripts/google-oauth-setup.sh --save <CLIENT_ID> <CLIENT_SECRET>
```

> Note: Standard Google Sign-In OAuth clients (`*.apps.googleusercontent.com`) can only be
> created through the GCP Console — there is no CLI/API for this. The script handles
> storage and retrieval via GCP Secret Manager.

## Dependencies

```json
{
  "dependencies": {
    "bun-plugin-tailwind": "^0.1.2",
    "tailwindcss": "^4.1.18"
  }
}
```
