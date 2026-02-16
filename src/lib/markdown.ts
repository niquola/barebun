import { createHighlighter } from "shiki";

// Shiki syntax highlighter (created once at startup)
const highlighter = await createHighlighter({
  themes: ["github-light"],
  langs: ["javascript", "typescript", "html", "css", "json", "bash", "sql", "python", "go", "rust"],
});

function highlight(code: string, lang?: string): string {
  try {
    return highlighter.codeToHtml(code, { lang: lang || "text", theme: "github-light" });
  } catch {
    return `<pre><code>${code}</code></pre>`;
  }
}

const renderCallbacks = {
  heading: (children: string, { level }: { level: number }) => `<h${level}>${children}</h${level}>\n`,
  paragraph: (children: string) => `<p>${children}</p>\n`,
  blockquote: (children: string) => `<blockquote>${children}</blockquote>\n`,
  list: (children: string, { ordered, start }: { ordered: boolean; start?: number }) =>
    ordered ? `<ol start="${start ?? 1}">${children}</ol>\n` : `<ul>${children}</ul>\n`,
  listItem: (children: string) => `<li>${children}</li>\n`,
  hr: () => `<hr />\n`,
  strong: (children: string) => `<strong>${children}</strong>`,
  emphasis: (children: string) => `<em>${children}</em>`,
  link: (children: string, { href, title }: { href: string; title?: string }) =>
    `<a href="${href}"${title ? ` title="${title}"` : ""}>${children}</a>`,
  image: (children: string, { src, title }: { src: string; title?: string }) =>
    `<img src="${src}" alt="${children}"${title ? ` title="${title}"` : ""} />`,
  codespan: (children: string) => `<code>${children}</code>`,
  code: (children: string, { language }: { language?: string }) => highlight(children, language),
  table: (children: string) => `<table>${children}</table>\n`,
  thead: (children: string) => `<thead>${children}</thead>`,
  tbody: (children: string) => `<tbody>${children}</tbody>`,
  tr: (children: string) => `<tr>${children}</tr>`,
  th: (children: string, { align }: { align?: string }) => `<th${align ? ` align="${align}"` : ""}>${children}</th>`,
  td: (children: string, { align }: { align?: string }) => `<td${align ? ` align="${align}"` : ""}>${children}</td>`,
  strikethrough: (children: string) => `<del>${children}</del>`,
};

const defaultOpts = { tables: true, strikethrough: true, tasklists: true, autolinks: true };

export function renderMarkdown(source: string): string {
  return Bun.markdown.render(source, renderCallbacks, defaultOpts);
}

export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of raw.slice(3, end).trim().split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: raw.slice(end + 3).trim() };
}
