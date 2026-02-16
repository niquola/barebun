import { renderMarkdown } from "../lib/markdown";
import { Layout, html } from "../layout.tsx";
import * as blogRepo from "../repo/blog.ts";
import type { Context } from "../system.ts";
import type { Session, SessionUser } from "../lib/auth.ts";

type RenderedPost = blogRepo.BlogPost & { content: string };

const rawPosts = await blogRepo.list();
const posts: RenderedPost[] = rawPosts.map((p) => ({ ...p, content: renderMarkdown(p.body) }));
console.log(`Blog: ${posts.length} posts loaded`);

function BlogIndex({ user }: { user?: SessionUser | null }) {
  return (
    <Layout title="Blog" user={user}>
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

function BlogPostPage({ post, user }: { post: RenderedPost; user?: SessionUser | null }) {
  return (
    <Layout title={post.title} user={user}>
      <article class="prose max-w-none">
        {post.content}
      </article>
    </Layout>
  );
}

function blogIndex(ctx: Context, { user }: Session, req: Request) {
  return html(<BlogIndex user={user} />);
}

function blogPost(ctx: Context, { user }: Session, req: Request & { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === req.params.slug);
  if (!post) return new Response("Not found", { status: 404 });
  return html(<BlogPostPage post={post} user={user} />);
}

export const routes = {
  "/blog": blogIndex,
  "/blog/:slug": blogPost,
};
