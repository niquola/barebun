// Custom repo for users — add validation, hooks, custom queries here.
import type { Context } from "../system.ts";
import { type Users, type UsersCreate, type UsersUpdate,
  create as _create, read as _read, update as _update, remove as _remove, list as _list
} from "./users.gen.ts";
import { hashPassword, verifyPassword } from "../lib/auth.ts";
import type { GoogleUser } from "../lib/google.ts";

export type { Users, UsersCreate, UsersUpdate };

export type SignupInput = {
  user_name: string;
  password: string;
  password_confirm: string;
};

export type SignupError = {
  field: "user_name" | "password" | "password_confirm";
  message: string;
};

export type SignupResult =
  | { ok: true; user: Users }
  | { ok: false; error: SignupError };

export async function signup(ctx: Context, input: SignupInput): Promise<SignupResult> {
  const userName = input.user_name.trim();
  if (!userName) {
    return { ok: false, error: { field: "user_name", message: "Username is required." } };
  }
  if (input.password.length < 8) {
    return { ok: false, error: { field: "password", message: "Password must be at least 8 characters." } };
  }
  if (input.password !== input.password_confirm) {
    return { ok: false, error: { field: "password_confirm", message: "Passwords do not match." } };
  }

  const existing = await findByUserName(ctx, userName);
  if (existing) {
    return { ok: false, error: { field: "user_name", message: "Username is already taken." } };
  }

  const hash = await hashPassword(input.password);
  const user = await _create(ctx, { user_name: userName, password: hash });
  return { ok: true, user };
}

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

// Exact match by user_name
export async function findByUserName(ctx: Context, userName: string): Promise<Users | null> {
  const rows = await ctx.sql`SELECT * FROM public.users WHERE user_name = ${userName}`;
  return (rows[0] as Users) ?? null;
}

// Find by external_id (OAuth provider ID)
export async function findByExternalId(ctx: Context, externalId: string): Promise<Users | null> {
  const rows = await ctx.sql`SELECT * FROM public.users WHERE external_id = ${externalId}`;
  return (rows[0] as Users) ?? null;
}

// Find or create user from Google OAuth
export async function findOrCreateByGoogle(ctx: Context, google: GoogleUser): Promise<Users> {
  const existing = await findByExternalId(ctx, google.id);
  if (existing) return existing;

  return _create(ctx, {
    external_id: google.id,
    user_name: google.email,
    display_name: google.name,
    emails: [{ value: google.email, primary: true }],
    photos: [{ value: google.picture }],
  });
}

// Fuzzy search by user_name (ILIKE)
export async function searchByUserName(ctx: Context, q: string): Promise<Users[]> {
  return await ctx.sql`SELECT * FROM public.users WHERE user_name ILIKE ${"%" + q + "%"} LIMIT 100` as Users[];
}
