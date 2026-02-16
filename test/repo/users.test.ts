import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { startTest, stop, withTx, type Context } from "@/system.ts";
import * as repo from "@/repo/users.ts";
import { verifyPassword } from "@/lib/auth.ts";

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

describe("users signup", () => {
  it(
    "creates user with hashed password",
    withTx(() => ctx, async (tx) => {
      const result = await repo.signup(tx, {
        user_name: "signup_user",
        password: "password123",
        password_confirm: "password123",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.user.user_name).toBe("signup_user");
      expect(result.user.password).not.toBe("password123");
      expect(await verifyPassword("password123", result.user.password!)).toBe(true);
    }),
  );

  it(
    "rejects empty username",
    withTx(() => ctx, async (tx) => {
      const result = await repo.signup(tx, {
        user_name: "  ",
        password: "password123",
        password_confirm: "password123",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.field).toBe("user_name");
      expect(result.error.message).toContain("required");
    }),
  );

  it(
    "rejects short password",
    withTx(() => ctx, async (tx) => {
      const result = await repo.signup(tx, {
        user_name: "signup_short",
        password: "abc",
        password_confirm: "abc",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.field).toBe("password");
      expect(result.error.message).toContain("8 characters");
    }),
  );

  it(
    "rejects mismatched passwords",
    withTx(() => ctx, async (tx) => {
      const result = await repo.signup(tx, {
        user_name: "signup_mismatch",
        password: "password123",
        password_confirm: "different123",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.field).toBe("password_confirm");
      expect(result.error.message).toContain("do not match");
    }),
  );

  it(
    "rejects duplicate username",
    withTx(() => ctx, async (tx) => {
      await repo.signup(tx, {
        user_name: "signup_dup",
        password: "password123",
        password_confirm: "password123",
      });
      const result = await repo.signup(tx, {
        user_name: "signup_dup",
        password: "password456",
        password_confirm: "password456",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.field).toBe("user_name");
      expect(result.error.message).toContain("already taken");
    }),
  );

  it(
    "trims username whitespace",
    withTx(() => ctx, async (tx) => {
      const result = await repo.signup(tx, {
        user_name: "  trimmed_user  ",
        password: "password123",
        password_confirm: "password123",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.user.user_name).toBe("trimmed_user");
    }),
  );
});
