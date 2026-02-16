// Custom repo for users — add validation, hooks, custom queries here.
import type { Context } from "../system.ts";
import { type Users, type UsersCreate, type UsersUpdate,
  create as _create, read as _read, update as _update, remove as _remove, list as _list
} from "./users.gen.ts";

export type { Users, UsersCreate, UsersUpdate };

export async function create(ctx: Context, data: UsersCreate): Promise<Users> {
  // TODO: add validation
  return _create(ctx, data);
}

export async function read(ctx: Context, id: string): Promise<Users | null> {
  return _read(ctx, id);
}

export async function update(ctx: Context, id: string, data: UsersUpdate): Promise<Users | null> {
  // TODO: add validation
  return _update(ctx, id, data);
}

export async function remove(ctx: Context, id: string): Promise<boolean> {
  return _remove(ctx, id);
}

export async function list(ctx: Context, opts: { limit?: number; offset?: number } = {}): Promise<Users[]> {
  return _list(ctx, opts);
}

// Example: custom search by user_name
export async function searchByUserName(ctx: Context, q: string): Promise<Users[]> {
  return await ctx.sql`SELECT * FROM public.users WHERE user_name ILIKE ${"%" + q + "%"} LIMIT 100` as Users[];
}
