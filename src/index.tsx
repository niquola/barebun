import tailwindPlugin from "bun-plugin-tailwind";
import { Layout, html } from "./layout.tsx";
import { routes as blogRoutes } from "./pages/blog.tsx";
import { liveReloadWs } from "./lib/livereload.ts";

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
          <h1 class="text-3xl font-bold mb-4 text-red-500">Users</h1>
          {users.map((u) => (
            <UserCard name={u.name} email={u.email} />
          ))}
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
