// Custom repo for sessions — add validation, hooks, custom queries here.
import type { Context } from "../system.ts";
import { type Sessions, type SessionsCreate, type SessionsUpdate,
  create as _create, read as _read, update as _update, remove as _remove, list as _list
} from "./sessions.gen.ts";

export type { Sessions, SessionsCreate, SessionsUpdate };

export async function create(ctx: Context, data: SessionsCreate): Promise<Sessions> {
  // TODO: add validation
  return _create(ctx, data);
}

export async function read(ctx: Context, id: string): Promise<Sessions | null> {
  return _read(ctx, id);
}

export async function update(ctx: Context, id: string, data: SessionsUpdate): Promise<Sessions | null> {
  // TODO: add validation
  return _update(ctx, id, data);
}

export async function remove(ctx: Context, id: string): Promise<boolean> {
  return _remove(ctx, id);
}

export async function list(ctx: Context, opts: { limit?: number; offset?: number } = {}): Promise<Sessions[]> {
  return _list(ctx, opts);
}
