# Blog Engine

Markdown-based blog using `Bun.markdown` with Shiki syntax highlighting.

## How it works

1. At startup, scans `./blog/*.md` files
2. Parses optional YAML frontmatter (`title`, `date`)
3. Renders markdown to HTML via `Bun.markdown.render()` with custom callbacks
4. Code blocks get Shiki syntax highlighting (inline styles, no client JS)
5. Posts sorted by date (newest first)

## Adding a post

Drop a `.md` file in `./blog/`:

```md
---
title: My Post Title
date: 2026-02-16
---

Content with **markdown** and code:

```js
console.log("highlighted by shiki");
```
```

Frontmatter is optional. Without `title`, the first `# heading` is used. Without that, the filename becomes the title.

## Routes

- `/blog` — index page listing all posts
- `/blog/:slug` — individual post (slug = filename without `.md`)

Routes are exported from `src/pages/blog.tsx` and spread into the main routes.

## Markdown rendering (`src/lib/markdown.ts`)

Uses `Bun.markdown.render()` (not `.html()`) with custom callbacks for all elements. This allows the `code` callback to hook into Shiki:

```ts
code: (children, { language }) => highlight(children, language),
```

Other callbacks produce standard HTML tags. Without registering callbacks, `render()` strips wrapper tags (children pass through raw).

### Shiki highlighter

Created once at startup with `createHighlighter()`:
- Theme: `github-light`
- Languages: js, ts, html, css, json, bash, sql, python, go, rust
- Falls back to `<pre><code>` if language is unknown

### Frontmatter parser

Simple YAML parser — splits on `---` delimiters, extracts `key: value` pairs. Not a full YAML parser.

## Typography (`src/pages/blog.css`)

Blog content styled via `article.prose` using Tailwind `@apply` directives for headings, paragraphs, blockquotes, lists, code blocks, tables, etc.
