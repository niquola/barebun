# Server-Side JSX Runtime

Custom JSX-to-HTML string runtime. No React, no virtual DOM — JSX compiles directly to HTML strings.

## How it works

TSX config in `tsconfig.json`:
```json
{
  "jsx": "react-jsx",
  "jsxImportSource": "jsx",
  "paths": {
    "jsx/jsx-runtime": ["./src/lib/jsx/jsx-runtime.ts"],
    "jsx/jsx-dev-runtime": ["./src/lib/jsx/jsx-dev-runtime.ts"]
  }
}
```

When Bun compiles `<div class="foo">hello</div>`, it transforms it to:
```ts
import { jsx } from "jsx/jsx-runtime";
jsx("div", { class: "foo", children: "hello" });
// → '<div class="foo">hello</div>'
```

The `paths` aliases resolve `jsx/jsx-runtime` to `./src/lib/jsx/jsx-runtime.ts` — no fake package needed.

## Runtime implementation (`src/lib/jsx/jsx-runtime.ts`)

- `jsx(tag, props)` — if `tag` is a function, calls it with props (component). Otherwise renders HTML tag string.
- `escapeHtml()` — escapes `&`, `<`, `>`, `"` in attribute values
- `renderAttrs()` — converts props to HTML attributes. Skips `children`, `false`, `null`. Boolean `true` renders as bare attribute.
- `renderChildren()` — recursively stringifies children. Handles arrays (`.map()`), nulls, strings.
- `Fragment` — renders children without a wrapper tag
- Void elements (`br`, `img`, `input`, etc.) self-close with `<tag />`

## Usage patterns

```tsx
// Component — just a function returning a string
function Card({ title, children }: { title: string; children?: any }) {
  return (
    <div class="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Renders to: '<div class="card"><h2>Hello</h2>content</div>'
const html = <Card title="Hello">content</Card>;
```

## Important notes

- Use `class` not `className` (no React compat layer)
- Children are NOT escaped — raw HTML strings pass through (intentional for markdown rendering)
- `jsx-dev-runtime.ts` is identical to `jsx-runtime.ts` (used in development mode)
