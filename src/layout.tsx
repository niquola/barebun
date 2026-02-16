import { liveReloadScript } from "./lib/livereload.ts";

export function Layout({ title, children }: { title: string; children?: any }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/htmx.min.js" defer></script>
        <script src="/datastar.min.js" defer type="module"></script>
        {liveReloadScript}
      </head>
      <body class="max-w-3xl mx-auto p-4 font-sans">
        <nav class="flex gap-4 py-3 mb-6 border-b border-gray-200 text-sm">
          <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">
            Home
          </a>
          <a href="/blog" class="text-blue-600 hover:text-blue-800 font-medium">
            Blog
          </a>
          <a
            href="/about"
            class="text-blue-600 hover:text-blue-800 font-medium"
          >
            About
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}

export function html(body: string) {
  return new Response("<!DOCTYPE html>" + body, {
    headers: { "Content-Type": "text/html" },
  });
}
