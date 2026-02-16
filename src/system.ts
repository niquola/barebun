// System context — created once at startup, passed to all subsystems.
// See https://bun.sh/docs/runtime/sql
import { SQL } from "bun";
import { up } from "./lib/migrations.ts";

export interface Context {
  sql: InstanceType<typeof SQL>;
}

export function start(): Context {
  const sql = new SQL();
  return { sql };
}

export async function stop(ctx: Context) {
  await ctx.sql.close();
}

// Test context — creates <db>_test database, runs migrations.
const TEST_DB = (process.env.PGDATABASE || "iglite") + "_test";

export async function startTest(): Promise<Context> {
  const admin = new SQL();
  const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${TEST_DB}`;
  if (exists.length === 0) {
    await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
    console.log(`Created test database: ${TEST_DB}`);
  }
  await admin.close();

  const sql = new SQL({ database: TEST_DB });
  const ctx = { sql };
  await up(ctx);
  return ctx;
}

// Wrap a test body in a transaction that always rolls back.
// Usage: it("name", withTx(() => ctx, async (tx) => { ... }))
export function withTx(getCtx: () => Context, fn: (ctx: Context) => Promise<void>) {
  return async () => {
    const reserved = await getCtx().sql.reserve();
    await reserved`BEGIN`;
    const txCtx: Context = { sql: reserved as any };
    try {
      await fn(txCtx);
    } finally {
      await reserved`ROLLBACK`;
      reserved.release();
    }
  };
}
