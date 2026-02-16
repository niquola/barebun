import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { startTest, stop, withTx, type Context } from "@/system.ts";
import * as users from "@/repo/users.ts";
import {
  hashPassword, verifyPassword,
  createSession, destroySession, getSession,
  setSessionCookie, clearSessionCookie,
  clearSessionCache,
} from "@/lib/auth.ts";

let ctx: Context;

beforeAll(async () => {
  ctx = await startTest();
});

afterAll(async () => {
  await stop(ctx);
});

beforeEach(() => {
  clearSessionCache();
});

describe("password hashing", () => {
  it("hashes and verifies password", async () => {
    const hash = await hashPassword("test-password-123");
    expect(hash).not.toBe("test-password-123");
    expect(await verifyPassword("test-password-123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("sessions", () => {
  it(
    "create and get session",
    withTx(() => ctx, async (tx) => {
      const user = await users.create(tx, { user_name: "session_user", password: "hashed" });
      const sessionId = await createSession(tx, user.id);
      expect(sessionId).toBeDefined();

      const req = new Request("http://localhost/", {
        headers: { cookie: `sid=${sessionId}` },
      });
      const session = await getSession(tx, req);
      expect(session).not.toBeNull();
      expect(session!.user_name).toBe("session_user");
      expect(session!.id).toBe(user.id);
    }),
  );

  it(
    "returns null for missing cookie",
    withTx(() => ctx, async (tx) => {
      const req = new Request("http://localhost/");
      const session = await getSession(tx, req);
      expect(session).toBeNull();
    }),
  );

  it(
    "returns null for invalid session id",
    withTx(() => ctx, async (tx) => {
      const req = new Request("http://localhost/", {
        headers: { cookie: "sid=00000000-0000-0000-0000-000000000000" },
      });
      const session = await getSession(tx, req);
      expect(session).toBeNull();
    }),
  );

  it(
    "returns null for inactive user",
    withTx(() => ctx, async (tx) => {
      const user = await users.create(tx, { user_name: "inactive_user", password: "hashed", active: false });
      const sessionId = await createSession(tx, user.id);

      const req = new Request("http://localhost/", {
        headers: { cookie: `sid=${sessionId}` },
      });
      const session = await getSession(tx, req);
      expect(session).toBeNull();
    }),
  );

  it(
    "destroy session",
    withTx(() => ctx, async (tx) => {
      const user = await users.create(tx, { user_name: "destroy_user", password: "hashed" });
      const sessionId = await createSession(tx, user.id);

      await destroySession(tx, sessionId);

      const req = new Request("http://localhost/", {
        headers: { cookie: `sid=${sessionId}` },
      });
      const session = await getSession(tx, req);
      expect(session).toBeNull();
    }),
  );
});

describe("cookie helpers", () => {
  it("setSessionCookie format", () => {
    const cookie = setSessionCookie("test-id");
    expect(cookie).toContain("sid=test-id");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Expires=");
  });

  it("clearSessionCookie expires immediately", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("sid=");
    expect(cookie).toContain("1970");
  });
});

describe("findByUserName", () => {
  it(
    "finds existing user",
    withTx(() => ctx, async (tx) => {
      await users.create(tx, { user_name: "findme" });
      const found = await users.findByUserName(tx, "findme");
      expect(found).not.toBeNull();
      expect(found!.user_name).toBe("findme");
    }),
  );

  it(
    "returns null for non-existent user",
    withTx(() => ctx, async (tx) => {
      const found = await users.findByUserName(tx, "nonexistent");
      expect(found).toBeNull();
    }),
  );
});
