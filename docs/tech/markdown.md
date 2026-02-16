# Markdown Rendering

Uses `Bun.markdown` (built-in, no external libraries) with Shiki for syntax highlighting.

## Bun.markdown API

Bun has three markdown APIs:

| Method | Returns | Use case |
|---|---|---|
| `Bun.markdown.html(source, opts)` | HTML string | Quick rendering, no customization |
| `Bun.markdown.render(source, callbacks, opts)` | Custom string | **We use this** — hooks for every element |
| `Bun.markdown.react(source, overrides, opts)` | React elements | Client-side React apps |

### Why `render()` not `html()`

`html()` produces standard HTML with no hooks. We need `render()` to intercept code blocks and pass them to Shiki for syntax highlighting:

```ts
code: (children, { language }) => highlight(children, language),
```

### Important: `render()` requires ALL callbacks

If you don't register a callback for an element, `render()` strips its wrapper tag — children pass through raw. That's why `src/lib/markdown.ts` registers callbacks for every element type (heading, paragraph, blockquote, list, etc.), even though most just produce standard HTML tags.

## Parser options

```ts
const opts = { tables: true, strikethrough: true, tasklists: true, autolinks: true };
```

All available options:

| Option | Default | Description |
|---|---|---|
| `tables` | `false` | GFM tables |
| `strikethrough` | `false` | `~~text~~` → `<del>` |
| `tasklists` | `false` | `- [x] item` checkboxes |
| `autolinks` | `false` | Auto-link URLs/emails |
| `headings` | `false` | Heading IDs/autolinks |
| `wikiLinks` | `false` | `[[wiki links]]` |
| `latexMath` | `false` | `$inline$` and `$$display$$` |
| `underline` | `false` | `__text__` as `<u>` instead of `<strong>` |

## render() callbacks

### Block callbacks

| Callback | Meta | Output |
|---|---|---|
| `heading(children, {level})` | `level`: 1-6 | `<h1>`...`<h6>` |
| `paragraph(children)` | — | `<p>` |
| `blockquote(children)` | — | `<blockquote>` |
| `code(children, {language})` | `language`: string | **→ Shiki** |
| `list(children, {ordered, start})` | `ordered`: bool | `<ul>` / `<ol>` |
| `listItem(children)` | — | `<li>` |
| `hr()` | — | `<hr />` |
| `table(children)` | — | `<table>` |
| `thead/tbody/tr(children)` | — | standard |
| `th/td(children, {align})` | `align`: string | standard |

### Inline callbacks

| Callback | Meta | Output |
|---|---|---|
| `strong(children)` | — | `<strong>` |
| `emphasis(children)` | — | `<em>` |
| `link(children, {href, title})` | — | `<a>` |
| `image(children, {src, title})` | — | `<img>` |
| `codespan(children)` | — | `<code>` |
| `strikethrough(children)` | — | `<del>` |

## Shiki syntax highlighting

Created once at startup (async, uses top-level await):

```ts
const highlighter = await createHighlighter({
  themes: ["github-light"],
  langs: ["javascript", "typescript", "html", "css", "json", "bash", "sql", "python", "go", "rust"],
});
```

The `code` callback passes raw code + language to Shiki:

```ts
function highlight(code: string, lang?: string): string {
  try {
    return highlighter.codeToHtml(code, { lang: lang || "text", theme: "github-light" });
  } catch {
    return `<pre><code>${code}</code></pre>`;  // fallback for unknown langs
  }
}
```

Shiki outputs `<pre>` with inline `style="color:..."` spans — no client-side JS or CSS needed.

### Adding languages

Add to the `langs` array in `createHighlighter()`. Shiki supports 200+ languages via TextMate grammars.

### Changing theme

Replace `"github-light"` in both `createHighlighter({ themes })` and `codeToHtml({ theme })`. Popular themes: `github-dark`, `one-dark-pro`, `dracula`, `nord`, `vitesse-light`.

## Frontmatter parser

Simple parser for YAML-like frontmatter:

```md
---
title: My Post
date: 2026-02-16
---

Content here...
```

Implementation:
1. Checks if file starts with `---`
2. Finds closing `---`
3. Splits lines, extracts `key: value` pairs
4. Returns `{ meta: Record<string, string>, body: string }`

Not a full YAML parser — only handles simple `key: value` lines. No nested objects, arrays, or multiline values.

## Usage

```ts
import { renderMarkdown, parseFrontmatter } from "./lib/markdown";

const raw = await Bun.file("./blog/hello.md").text();
const { meta, body } = parseFrontmatter(raw);
const html = renderMarkdown(body);

// meta.title → "My Post"
// meta.date  → "2026-02-16"
// html       → "<h1>Hello</h1>\n<p>Content...</p>\n<pre class=\"shiki ...\">..."
```
