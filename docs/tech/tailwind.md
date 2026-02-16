# Tailwind CSS Integration

Tailwind v4 with `bun-plugin-tailwind`, compiled at server startup via `Bun.build()`.

## The problem

`bun-plugin-tailwind` is a bundler plugin designed for HTML imports. With server-side JSX, there are no HTML imports — JSX produces HTML strings at runtime. The bundler never sees `<link>` tags, so the plugin has nothing to hook into via `bunfig.toml`.

## The solution

Call `Bun.build()` programmatically at server startup:

```ts
import tailwindPlugin from "bun-plugin-tailwind";

const built = await Bun.build({
  entrypoints: ["./src/styles.css"],
  plugins: [tailwindPlugin],
});
const css = await built.outputs[0].text();
```

Serve as a static route:
```ts
"/styles.css": new Response(css, {
  headers: { "Content-Type": "text/css" },
}),
```

## Why it works

The plugin has two sources for discovering Tailwind classes:

1. **`onBeforeParse`** (native NAPI, Rust) — scans files in the bundle's module graph
2. **Filesystem scanner** (`tailwindcss-oxide`) — scans `**/*` from project root

Even with just `styles.css` as entrypoint, the filesystem scanner walks the entire project and finds Tailwind classes in `.tsx`, `.ts`, `.html` files.

## CSS structure

```
src/styles.css          ← Entry point: @import "tailwindcss" + page CSS imports
src/pages/blog.css      ← Blog typography (article.prose styles with @apply)
```

`styles.css` imports page-specific CSS files. Tailwind v4 uses CSS-first config — no `tailwind.config.js`.

## Hot rebuild

With `bun --watch`, editing any `.tsx` file restarts the process → `Bun.build()` re-runs → plugin scans files → CSS rebuilt with new classes.
