import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { startTest, stop, withTx, type Context } from "@/system.ts";
import * as repo from "@/repo/type_test.ts";

let ctx: Context;

beforeAll(async () => {
  ctx = await startTest();
});

afterAll(async () => {
  await stop(ctx);
});

describe("type_test repo", () => {
  it(
    "create + read",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { col_text: "col_text_1" });
      expect(row.id).toBeDefined();

      const found = await repo.read(tx, row.id);
      expect(found).not.toBeNull();
      expect(found!.col_text).toBe("col_text_1");
    }),
  );

  it(
    "update",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { col_text: "col_text_2" });
      const updated = await repo.update(tx, row.id, { col_text: "col_text_updated" });
      expect(updated).not.toBeNull();
      expect(updated!.col_text).toBe("col_text_updated");
    }),
  );

  it(
    "remove",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, { col_text: "col_text_3" });
      const ok = await repo.remove(tx, row.id);
      expect(ok).toBe(true);

      const gone = await repo.read(tx, row.id);
      expect(gone).toBeNull();
    }),
  );

  it(
    "list",
    withTx(() => ctx, async (tx) => {
      await repo.create(tx, { col_text: "col_text_10" });
      await repo.create(tx, { col_text: "col_text_11" });
      await repo.create(tx, { col_text: "col_text_12" });

      const all = await repo.list(tx);
      expect(all.length).toBe(3);
    }),
  );

  it(
    "all column types round-trip",
    withTx(() => ctx, async (tx) => {
      const row = await repo.create(tx, {
        col_text: "hello",
        col_smallint: 42,
        col_integer: 100000,
        col_bigint: 9007199254740991,
        col_serial: 7,
        col_real: 3.14,
        col_double: 2.718281828,
        col_numeric: "12345678.1234",
        col_bool: true,
        col_varchar: "varchar value",
        col_char: "char10    ",
        col_bytea: new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]),
        col_timestamp: new Date("2025-06-15T10:30:00"),
        col_timestamptz: new Date("2025-06-15T10:30:00Z"),
        col_date: "2025-06-15" as any,
        col_uuid: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        col_interval: "1 year 2 mons 3 days 04:05:06",
        col_json: { foo: "bar" },
        col_jsonb: { key: "test", value: 42 },
        // arrays — JS arrays get converted to PG literals by prepareForSql
        col_text_arr: ["hello", "world"],
        col_int_arr: [1, 2, 3],
        col_date_arr: [new Date("2025-01-01"), new Date("2025-06-15")],
        col_timestamptz_arr: [new Date("2025-01-01T00:00:00Z"), new Date("2025-06-15T12:00:00Z")],
        col_interval_arr: ["1 day", "2 hours 30 minutes"],
        col_uuid_arr: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "b1ffcd00-0d1c-5fa9-cc7e-7cc0ce491b22"],
        col_bool_arr: [true, false, true],
      });

      expect(row.id).toBeDefined();

      const found = await repo.read(tx, row.id);
      expect(found).not.toBeNull();

      // integers
      expect(found!.col_smallint).toBe(42);
      expect(found!.col_integer).toBe(100000);
      expect(found!.col_bigint).toBe("9007199254740991");
      expect(found!.col_serial).toBe(7);

      // floats
      expect(found!.col_real).toBeCloseTo(3.14, 2);
      expect(found!.col_double).toBeCloseTo(2.718281828, 6);

      // numeric (string)
      expect(found!.col_numeric).toBe("12345678.1234");

      // boolean
      expect(found!.col_bool).toBe(true);

      // text types
      expect(found!.col_text).toBe("hello");
      expect(found!.col_varchar).toBe("varchar value");

      // binary
      expect(found!.col_bytea).toBeInstanceOf(Uint8Array);
      expect(found!.col_bytea![0]).toBe(0xDE);

      // dates
      expect(found!.col_timestamp).toBeInstanceOf(Date);
      expect(found!.col_timestamptz).toBeInstanceOf(Date);
      expect(found!.col_date).toBeInstanceOf(Date);

      // interval (returned as string by postgres)
      expect(typeof found!.col_interval).toBe("string");

      // uuid
      expect(found!.col_uuid).toBe("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

      // json / jsonb
      expect((found!.col_json as any).foo).toBe("bar");
      expect(found!.col_jsonb?.key).toBe("test");
      expect(found!.col_jsonb?.value).toBe(42);

      // arrays — text, bool come back as JS arrays; int as Int32Array; uuid as raw PG string
      expect(found!.col_text_arr).toEqual(["hello", "world"]);
      expect(Array.from(found!.col_int_arr as any)).toEqual([1, 2, 3]);
      expect(found!.col_bool_arr).toEqual([true, false, true]);
      expect(Array.isArray(found!.col_date_arr)).toBe(true);
      expect(found!.col_date_arr!.length).toBe(2);
      expect(Array.isArray(found!.col_timestamptz_arr)).toBe(true);
      expect(found!.col_timestamptz_arr!.length).toBe(2);
      expect(Array.isArray(found!.col_interval_arr)).toBe(true);
      expect(found!.col_interval_arr!.length).toBe(2);
      // uuid[] — Bun SQL returns raw PG literal, not parsed array
      expect(typeof found!.col_uuid_arr).toBe("string");

      // defaults
      expect(found!.created_at).toBeInstanceOf(Date);
      expect(found!.updated_at).toBeInstanceOf(Date);
    }),
  );
});
