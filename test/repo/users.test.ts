import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { startTest, stop, withTx, type Context } from "@/system.ts";
import * as repo from "@/repo/users.ts";

let ctx: Context;

beforeAll(async () => {
  ctx = await startTest();
});

afterAll(async () => {
  await stop(ctx);
});

describe("users repo", () => {
  it(
    "create + read",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { user_name: "user_name_1" });
      expect(row.id).toBeDefined();

      const found = await repo.read(tx, row.id);
      expect(found).not.toBeNull();
      expect(found!.user_name).toBe("user_name_1");
    }),
  );

  it(
    "update",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { user_name: "user_name_2" });
      const updated = await repo.update(tx, row.id, { user_name: "user_name_updated" });
      expect(updated).not.toBeNull();
      expect(updated!.user_name).toBe("user_name_updated");
    }),
  );

  it(
    "remove",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { user_name: "user_name_3" });
      const ok = await repo.remove(tx, row.id);
      expect(ok).toBe(true);

      const gone = await repo.read(tx, row.id);
      expect(gone).toBeNull();
    }),
  );

  it(
    "list",
    withTx(() => ctx, async (tx) => {
      await repo.create(tx, { user_name: "user_name_10" });
      await repo.create(tx, { user_name: "user_name_11" });
      await repo.create(tx, { user_name: "user_name_12" });

      const all = await repo.list(tx);
      expect(all.length).toBe(3);
    }),
  );
});
