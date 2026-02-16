import { liveReloadScript } from "./lib/livereload.ts";
import { hasRole, type SessionUser } from "./lib/auth.ts";

export function Layout({ title, children, user }: { title: string; children?: any; user?: SessionUser | null }) {
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
        <nav class="flex items-center py-3 mb-6 border-b border-gray-200 text-sm">
          <div class="flex gap-4">
            <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">
              Home
            </a>
            <a href="/blog" class="text-blue-600 hover:text-blue-800 font-medium">
              Blog
            </a>
            <a href="/tables" class="text-blue-600 hover:text-blue-800 font-medium">
              Tables
            </a>
            {hasRole(user, "admin") && (
              <a href="/users" class="text-blue-600 hover:text-blue-800 font-medium">
                Users
              </a>
            )}
            <a href="/about" class="text-blue-600 hover:text-blue-800 font-medium">
              About
            </a>
          </div>
          <div class="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span class="text-gray-700">{user.display_name || user.user_name}</span>
                <form method="POST" action="/logout" class="inline">
                  <button type="submit" class="text-blue-600 hover:text-blue-800 font-medium">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <a href="/login" class="text-blue-600 hover:text-blue-800 font-medium">
                  Log in
                </a>
                <a href="/signup" class="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up
                </a>
              </>
            )}
          </div>
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
