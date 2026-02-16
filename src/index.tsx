import tailwindPlugin from "bun-plugin-tailwind";
import { Layout, html } from "./layout.tsx";
import { routes as blogRoutes } from "./pages/blog.tsx";
import { liveReloadWs } from "./lib/livereload.ts";
import { Tabs } from "./components/tabs.tsx";

// Build Tailwind CSS at startup (re-runs on --hot reload)
const built = await Bun.build({
  entrypoints: ["./src/styles.css"],
  plugins: [tailwindPlugin],
});
const css = await built.outputs[0].text();
console.log(`Tailwind CSS built: ${css.length} bytes`);

function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div class="border border-gray-300 p-4 my-2 rounded-lg">
      <strong class="text-gray-500 mb-6">{name}</strong>
      <br />
      <span class="text-gray-600">{email}</span>
    </div>
  );
}

const users = [
  { name: "Alice", email: "alice@example.com" },
  { name: "Bobi", email: "bob@example.com" },
  { name: "Diol", email: "bob@example.com" },
];

Bun.serve({
  port: 30555,
  routes: {
    "/styles.css": new Response(css, {
      headers: { "Content-Type": "text/css" },
    }),
    "/": () =>
      html(
        <Layout title="Home">
          <h1 class="text-3xl font-bold mb-6">Home</h1>
          <Tabs
            tabs={[
              {
                id: "users",
                label: "Users",
                content: (
                  <div>
                    {users.map((u) => (
                      <UserCard name={u.name} email={u.email} />
                    ))}
                  </div>
                ),
              },
              {
                id: "about",
                label: "About",
                content: (
                  <p class="text-gray-600">
                    This is a server-side rendered app built with Bun, TSX, Tailwind CSS, and Datastar.
                  </p>
                ),
              },
              {
                id: "settings",
                label: "Settings",
                content: (
                  <p class="text-gray-600">Settings panel placeholder.</p>
                ),
              },
            ]}
          />
        </Layout>,
      ),
    ...blogRoutes,
  },
  async fetch(req, server) {
    const path = new URL(req.url).pathname;
    if (path === "/__reload") {
      if (server.upgrade(req)) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    const file = Bun.file(`./public${path}`);
    if (await file.exists()) return new Response(file);
    return new Response("Not found", { status: 404 });
  },
  websocket: liveReloadWs,
  development: true,
});

console.log("http://localhost:30555");
