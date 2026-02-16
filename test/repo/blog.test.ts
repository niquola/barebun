import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import * as blog from "@/repo/blog.ts";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "blog-test-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true });
});

describe("blog repo", () => {
  it("list returns empty for empty dir", async () => {
    const posts = await blog.list(dir);
    expect(posts).toEqual([]);
  });

  it("create + read", async () => {
    const post = await blog.create({
      slug: "first-post",
      title: "First Post",
      date: "2026-01-15",
      body: "Hello world!",
    }, dir);

    expect(post.slug).toBe("first-post");
    expect(post.title).toBe("First Post");
    expect(post.date).toBe("2026-01-15");
    expect(post.body).toBe("Hello world!");

    const found = await blog.read("first-post", dir);
    expect(found).not.toBeNull();
    expect(found!.title).toBe("First Post");
    expect(found!.body).toBe("Hello world!");
  });

  it("create without frontmatter", async () => {
    const post = await blog.create({
      slug: "no-meta",
      body: "# Just a Heading\n\nSome text.",
    }, dir);

    expect(post.title).toBe("Just a Heading");
    expect(post.date).toBe("");

    const raw = await Bun.file(join(dir, "no-meta.md")).text();
    expect(raw.startsWith("---")).toBe(false);
  });

  it("create rejects duplicate slug", async () => {
    await blog.create({ slug: "dup-test", body: "one" }, dir);
    expect(blog.create({ slug: "dup-test", body: "two" }, dir)).rejects.toThrow("already exists");
  });

  it("read returns null for missing slug", async () => {
    const found = await blog.read("nonexistent", dir);
    expect(found).toBeNull();
  });

  it("list returns posts sorted by date desc", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "blog-sort-"));
    try {
      await blog.create({ slug: "old", title: "Old", date: "2025-01-01", body: "old" }, tmpDir);
      await blog.create({ slug: "new", title: "New", date: "2026-06-01", body: "new" }, tmpDir);
      await blog.create({ slug: "mid", title: "Mid", date: "2025-06-01", body: "mid" }, tmpDir);

      const posts = await blog.list(tmpDir);
      expect(posts.map((p) => p.slug)).toEqual(["new", "mid", "old"]);
    } finally {
      rmSync(tmpDir, { recursive: true });
    }
  });

  it("update title and date", async () => {
    await blog.create({ slug: "update-me", title: "Original", date: "2026-01-01", body: "content" }, dir);

    const updated = await blog.update("update-me", { title: "Updated Title", date: "2026-02-01" }, dir);
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated Title");
    expect(updated!.date).toBe("2026-02-01");
    expect(updated!.body).toBe("content");

    const reread = await blog.read("update-me", dir);
    expect(reread!.title).toBe("Updated Title");
  });

  it("update body only", async () => {
    await blog.create({ slug: "update-body", title: "Keep This", date: "2026-03-01", body: "old body" }, dir);

    const updated = await blog.update("update-body", { body: "new body" }, dir);
    expect(updated!.title).toBe("Keep This");
    expect(updated!.body).toBe("new body");
  });

  it("update returns null for missing slug", async () => {
    const result = await blog.update("ghost", { title: "nope" }, dir);
    expect(result).toBeNull();
  });

  it("remove deletes file", async () => {
    await blog.create({ slug: "delete-me", body: "bye" }, dir);
    expect(await blog.read("delete-me", dir)).not.toBeNull();

    const ok = await blog.remove("delete-me", dir);
    expect(ok).toBe(true);

    expect(await blog.read("delete-me", dir)).toBeNull();
  });

  it("remove returns false for missing slug", async () => {
    const ok = await blog.remove("already-gone", dir);
    expect(ok).toBe(false);
  });
});
