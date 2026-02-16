import { Glob } from "bun";
import { renderMarkdown, parseFrontmatter } from "../lib/markdown";
import { Layout, html } from "../layout.tsx";

type BlogPost = { slug: string; title: string; date: string; content: string };

async function loadPosts(): Promise<BlogPost[]> {
  const glob = new Glob("*.md");
  const posts: BlogPost[] = [];
  for (const path of glob.scanSync("./blog")) {
    const slug = path.replace(/\.md$/, "");
    const raw = await Bun.file(`./blog/${path}`).text();
    const { meta, body } = parseFrontmatter(raw);
    const title = meta.title || body.match(/^#\s+(.+)/m)?.[1] || slug;
    const date = meta.date || "";
    const content = renderMarkdown(body);
    posts.push({ slug, title, date, content });
  }
  return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

const posts = await loadPosts();
console.log(`Blog: ${posts.length} posts loaded`);

function BlogIndex() {
  return (
    <Layout title="Blog">
      <h1 class="text-3xl font-bold mb-6">Blog</h1>
      {posts.length === 0 && <p class="text-gray-500">No posts yet.</p>}
      {posts.map((p) => (
        <a href={`/blog/${p.slug}`} class="block border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50 transition-colors">
          <h2 class="text-xl font-semibold text-blue-600">{p.title}</h2>
          {p.date && <time class="text-sm text-gray-400">{p.date}</time>}
        </a>
      ))}
    </Layout>
  );
}

function BlogPostPage({ post }: { post: BlogPost }) {
  return (
    <Layout title={post.title}>
      <article class="prose max-w-none">
        {post.content}
      </article>
    </Layout>
  );
}

export const routes = {
  "/blog": () => html(<BlogIndex />),
  "/blog/:slug": (req: Request & { params: Record<string, string> }) => {
    const post = posts.find((p) => p.slug === req.params.slug);
    if (!post) return new Response("Not found", { status: 404 });
    return html(<BlogPostPage post={post} />);
  },
};
