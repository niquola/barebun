import { Glob } from "bun";
import { unlinkSync } from "node:fs";
import { parseFrontmatter } from "@/lib/markdown.ts";

const DEFAULT_DIR = "./blog";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  body: string;
};

export type BlogPostCreate = {
  slug: string;
  title?: string;
  date?: string;
  body: string;
};

export type BlogPostUpdate = {
  title?: string;
  date?: string;
  body?: string;
};

function toFilePath(slug: string, dir: string): string {
  return `${dir}/${slug}.md`;
}

function serializeFrontmatter(meta: Record<string, string>, body: string): string {
  const entries = Object.entries(meta).filter(([, v]) => v);
  if (entries.length === 0) return body;
  const yaml = entries.map(([k, v]) => `${k}: ${v}`).join("\n");
  return `---\n${yaml}\n---\n\n${body}`;
}

function parseFile(slug: string, raw: string): BlogPost {
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title || body.match(/^#\s+(.+)/m)?.[1] || slug;
  const date = meta.date || "";
  return { slug, title, date, body };
}

export async function list(dir = DEFAULT_DIR): Promise<BlogPost[]> {
  const glob = new Glob("*.md");
  const posts: BlogPost[] = [];
  for (const path of glob.scanSync(dir)) {
    const slug = path.replace(/\.md$/, "");
    const raw = await Bun.file(`${dir}/${path}`).text();
    posts.push(parseFile(slug, raw));
  }
  return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function read(slug: string, dir = DEFAULT_DIR): Promise<BlogPost | null> {
  const file = Bun.file(toFilePath(slug, dir));
  if (!(await file.exists())) return null;
  const raw = await file.text();
  return parseFile(slug, raw);
}

export async function create(data: BlogPostCreate, dir = DEFAULT_DIR): Promise<BlogPost> {
  const filePath = toFilePath(data.slug, dir);
  if (await Bun.file(filePath).exists()) {
    throw new Error(`Post "${data.slug}" already exists`);
  }
  const meta: Record<string, string> = {};
  if (data.title) meta.title = data.title;
  if (data.date) meta.date = data.date;
  const content = serializeFrontmatter(meta, data.body);
  await Bun.write(filePath, content);
  return parseFile(data.slug, content);
}

export async function update(slug: string, data: BlogPostUpdate, dir = DEFAULT_DIR): Promise<BlogPost | null> {
  const existing = await read(slug, dir);
  if (!existing) return null;

  const raw = await Bun.file(toFilePath(slug, dir)).text();
  const { meta } = parseFrontmatter(raw);

  if (data.title !== undefined) meta.title = data.title;
  if (data.date !== undefined) meta.date = data.date;
  const body = data.body !== undefined ? data.body : existing.body;

  const content = serializeFrontmatter(meta, body);
  await Bun.write(toFilePath(slug, dir), content);
  return parseFile(slug, content);
}

export async function remove(slug: string, dir = DEFAULT_DIR): Promise<boolean> {
  const filePath = toFilePath(slug, dir);
  const file = Bun.file(filePath);
  if (!(await file.exists())) return false;
  unlinkSync(filePath);
  return true;
}
