import type { Context } from "@/system.ts";

export type SessionUser = {
  id: string;
  user_name: string;
  display_name?: string;
  roles?: { value: string; type?: string; primary?: boolean }[];
};

// In-memory session cache: sessionId → { user, expiresAt }
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const sessionCache = new Map<string, { user: SessionUser; expiresAt: number }>();

export function invalidateSession(sessionId: string): void {
  sessionCache.delete(sessionId);
}

export function clearSessionCache(): void {
  sessionCache.clear();
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function createSession(ctx: Context, userId: string): Promise<string> {
  const [row] = await ctx.sql`
    INSERT INTO sessions (user_id) VALUES (${userId}) RETURNING id
  `;
  return row.id;
}

export async function destroySession(ctx: Context, sessionId: string): Promise<void> {
  sessionCache.delete(sessionId);
  await ctx.sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

export type Session = { user: SessionUser | null; sessionId: string | null };

function extractSessionId(req: Request): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)sid=([^;]+)/);
  return match ? match[1] : null;
}

async function resolveUser(ctx: Context, sessionId: string): Promise<SessionUser | null> {
  // Check cache first
  const cached = sessionCache.get(sessionId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  sessionCache.delete(sessionId);

  const rows = await ctx.sql`
    SELECT u.id, u.user_name, u.display_name, u.roles
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > now()
      AND u.active = true
  `;

  if (rows.length === 0) return null;

  const user = rows[0] as SessionUser;
  sessionCache.set(sessionId, { user, expiresAt: Date.now() + SESSION_TTL_MS });
  return user;
}

export async function getSession(ctx: Context, req: Request): Promise<SessionUser | null> {
  const sessionId = extractSessionId(req);
  if (!sessionId) return null;
  return resolveUser(ctx, sessionId);
}

export function withSession(
  ctx: Context,
  routes: Record<string, (ctx: Context, session: Session, req: any) => Response | Promise<Response>>,
): Record<string, (req: any) => Promise<Response>> {
  const result: Record<string, (req: any) => Promise<Response>> = {};
  for (const [path, handler] of Object.entries(routes)) {
    result[path] = async (req: any) => {
      const sessionId = extractSessionId(req);
      const user = sessionId ? await resolveUser(ctx, sessionId) : null;
      return handler(ctx, { user, sessionId }, req);
    };
  }
  return result;
}

export function setSessionCookie(sessionId: string): string {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  return `sid=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires}`;
}

export function clearSessionCookie(): string {
  return "sid=; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function hasRole(user: SessionUser | null | undefined, role: string): boolean {
  return user?.roles?.some((r) => r.value === role) ?? false;
}

export function redirect(location: string, headers?: Record<string, string>): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, ...headers },
  });
}
