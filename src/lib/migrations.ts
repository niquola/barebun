import type { Context } from "../system.ts";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(import.meta.dir, "../../migrations");

interface ParsedMigration {
  timestamp: string;
  name: string;
  direction: "up" | "down";
  ext: "sql" | "ts";
}

function parseMigrationFile(filename: string): ParsedMigration | null {
  const match = filename.match(/^(\d+)-(.+)\.(up|down)\.(sql|ts)$/);
  if (!match) return null;
  return {
    timestamp: match[1],
    name: `${match[1]}-${match[2]}`,
    direction: match[3] as "up" | "down",
    ext: match[4] as "sql" | "ts",
  };
}

async function ensureTable(ctx: Context) {
  await ctx.sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function getApplied(ctx: Context): Promise<Set<string>> {
  const rows = await ctx.sql`SELECT name FROM _migrations ORDER BY id`;
  return new Set(rows.map((r: any) => r.name));
}

async function listMigrations(): Promise<ParsedMigration[]> {
  const files = await readdir(MIGRATIONS_DIR).catch(() => []);
  const upFiles = files
    .map(parseMigrationFile)
    .filter((m): m is ParsedMigration => m !== null && m.direction === "up")
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return [...new Map(upFiles.map((m) => [m.name, m])).values()];
}

async function runMigration(ctx: Context, name: string, direction: "up" | "down") {
  const files = await readdir(MIGRATIONS_DIR);
  const file = files.find((f) => {
    const parsed = parseMigrationFile(f);
    return parsed && parsed.name === name && parsed.direction === direction;
  });

  if (!file) throw new Error(`Migration file not found: ${name}.${direction}.*`);

  const filePath = path.join(MIGRATIONS_DIR, file);
  const isSql = file.endsWith(".sql");

  await ctx.sql.begin(async (tx) => {
    if (isSql) {
      const content = await Bun.file(filePath).text();
      await tx.unsafe(content);
    } else {
      const mod = await import(filePath);
      await mod.default(tx);
    }

    if (direction === "up") {
      await tx`INSERT INTO _migrations (name) VALUES (${name})`;
    } else {
      await tx`DELETE FROM _migrations WHERE name = ${name}`;
    }
  });
}

export async function generate(name: string, ts = false) {
  await mkdir(MIGRATIONS_DIR, { recursive: true });
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);
  const base = `${timestamp}-${name}`;
  const ext = ts ? "ts" : "sql";

  const upFile = path.join(MIGRATIONS_DIR, `${base}.up.${ext}`);
  const downFile = path.join(MIGRATIONS_DIR, `${base}.down.${ext}`);

  if (ts) {
    await Bun.write(
      upFile,
      'import type { SQL } from "bun";\n\nexport default async function(sql: SQL) {\n  // migration up\n}\n',
    );
    await Bun.write(
      downFile,
      'import type { SQL } from "bun";\n\nexport default async function(sql: SQL) {\n  // migration down\n}\n',
    );
  } else {
    await Bun.write(upFile, "-- migration up\n");
    await Bun.write(downFile, "-- migration down\n");
  }

  console.log(`Created:\n  ${upFile}\n  ${downFile}`);
}

export async function up(ctx: Context) {
  await ensureTable(ctx);
  const applied = await getApplied(ctx);
  const all = await listMigrations();
  const pending = all.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const m of pending) {
    console.log(`Applying: ${m.name}`);
    await runMigration(ctx, m.name, "up");
    console.log(`Applied:  ${m.name}`);
  }

  console.log(`\n${pending.length} migration(s) applied.`);
}

export async function down(ctx: Context) {
  await ensureTable(ctx);
  const rows = await ctx.sql`SELECT name FROM _migrations ORDER BY id DESC LIMIT 1`;

  if (rows.length === 0) {
    console.log("Nothing to roll back.");
    return;
  }

  const name = rows[0].name;
  console.log(`Rolling back: ${name}`);
  await runMigration(ctx, name, "down");
  console.log(`Rolled back:  ${name}`);
}

export async function status(ctx: Context) {
  await ensureTable(ctx);
  const applied = await getApplied(ctx);
  const all = await listMigrations();

  if (all.length === 0) {
    console.log("No migrations found.");
    return;
  }

  console.log("\nMigrations:\n");
  for (const m of all) {
    const state = applied.has(m.name) ? "✓ applied" : "… pending";
    console.log(`  ${state}  ${m.name}`);
  }
  console.log();
}
