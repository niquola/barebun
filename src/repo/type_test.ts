// Custom repo for type_test — add validation, hooks, custom queries here.
import type { Context } from "../system.ts";
import { type TypeTest, type TypeTestCreate, type TypeTestUpdate,
  create as _create, read as _read, update as _update, remove as _remove, list as _list
} from "./type_test.gen.ts";

export type { TypeTest, TypeTestCreate, TypeTestUpdate };

export async function create(ctx: Context, data: TypeTestCreate): Promise<TypeTest> {
  // TODO: add validation
  return _create(ctx, data);
}

export async function read(ctx: Context, id: string): Promise<TypeTest | null> {
  return _read(ctx, id);
}

export async function update(ctx: Context, id: string, data: TypeTestUpdate): Promise<TypeTest | null> {
  // TODO: add validation
  return _update(ctx, id, data);
}

export async function remove(ctx: Context, id: string): Promise<boolean> {
  return _remove(ctx, id);
}

export async function list(ctx: Context, opts: { limit?: number; offset?: number } = {}): Promise<TypeTest[]> {
  return _list(ctx, opts);
}

// Example: custom search by col_text
export async function searchByColText(ctx: Context, q: string): Promise<TypeTest[]> {
  return await ctx.sql`SELECT * FROM public.type_test WHERE col_text ILIKE ${"%" + q + "%"} LIMIT 100` as TypeTest[];
}
