import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { startTest, stop, withTx, type Context } from "@/system.ts";
import * as repo from "@/repo/sessions.ts";
import * as users from "@/repo/users.ts";

let ctx: Context;

beforeAll(async () => {
  ctx = await startTest();
});

afterAll(async () => {
  await stop(ctx);
});

async function createTestUser(tx: Context, name: string) {
  return users.create(tx, { user_name: name });
}

describe("sessions repo", () => {
  it(
    "create + read",
    withTx(() => ctx, async (tx) => {
      const user = await createTestUser(tx, "sess_user_1");
      const row = await repo.create(tx, { user_id: user.id });
      expect(row.id).toBeDefined();

      const found = await repo.read(tx, row.id);
      expect(found).not.toBeNull();
      expect(found!.user_id).toBe(user.id);
    }),
  );

  it(
    "update",
    withTx(() => ctx, async (tx) => {
      const user1 = await createTestUser(tx, "sess_user_2a");
      const user2 = await createTestUser(tx, "sess_user_2b");
      const row = await repo.create(tx, { user_id: user1.id });
      const updated = await repo.update(tx, row.id, { user_id: user2.id });
      expect(updated).not.toBeNull();
      expect(updated!.user_id).toBe(user2.id);
    }),
  );

  it(
    "remove",
    withTx(() => ctx, async (tx) => {
      const user = await createTestUser(tx, "sess_user_3");
      const row = await repo.create(tx, { user_id: user.id });
      const ok = await repo.remove(tx, row.id);
      expect(ok).toBe(true);

      const gone = await repo.read(tx, row.id);
      expect(gone).toBeNull();
    }),
  );

  it(
    "list",
    withTx(() => ctx, async (tx) => {
      const user = await createTestUser(tx, "sess_user_list");
      await repo.create(tx, { user_id: user.id });
      await repo.create(tx, { user_id: user.id });
      await repo.create(tx, { user_id: user.id });

      const all = await repo.list(tx);
      expect(all.length).toBe(3);
    }),
  );
});
