import type { Context } from "@/system.ts";
import { Layout, html } from "@/layout.tsx";
import * as users from "@/repo/users.ts";
import {
  verifyPassword,
  createSession, destroySession,
  setSessionCookie, clearSessionCookie, redirect,
  type Session, type SessionUser,
} from "@/lib/auth.ts";

function SignupPage({ error, user }: { error?: string; user?: SessionUser | null }) {
  return (
    <Layout title="Sign up" user={user}>
      <h1 class="text-3xl font-bold mb-6">Sign up</h1>
      <form method="POST" action="/signup" class="max-w-sm space-y-4">
        {error && (
          <p class="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}
        <div>
          <label class="block text-sm font-medium mb-1" for="user_name">Username</label>
          <input
            id="user_name"
            name="user_name"
            type="text"
            required
            autocomplete="username"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="password_confirm">Confirm password</label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Sign up
        </button>
      </form>
      <p class="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" class="text-blue-600 hover:text-blue-800">Log in</a>
      </p>
    </Layout>
  );
}

function LoginPage({ error, redirectTo, user }: { error?: string; redirectTo?: string; user?: SessionUser | null }) {
  return (
    <Layout title="Log in" user={user}>
      <h1 class="text-3xl font-bold mb-6">Log in</h1>
      <form method="POST" action="/login" class="max-w-sm space-y-4">
        {error && (
          <p class="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        <div>
          <label class="block text-sm font-medium mb-1" for="user_name">Username</label>
          <input
            id="user_name"
            name="user_name"
            type="text"
            required
            autocomplete="username"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Log in
        </button>
      </form>
      <p class="mt-4 text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/signup" class="text-blue-600 hover:text-blue-800">Sign up</a>
      </p>
    </Layout>
  );
}

function sanitizeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

async function signup(ctx: Context, { user }: Session, req: Request) {
  if (req.method === "GET") {
    return html(<SignupPage user={user} />);
  }

  const form = await req.formData();
  const result = await users.signup(ctx, {
    user_name: form.get("user_name") as string || "",
    password: form.get("password") as string || "",
    password_confirm: form.get("password_confirm") as string || "",
  });

  if (!result.ok) {
    return html(<SignupPage error={result.error.message} user={user} />);
  }

  const sessionId = await createSession(ctx, result.user.id);
  return redirect("/", { "Set-Cookie": setSessionCookie(sessionId) });
}

async function login(ctx: Context, { user }: Session, req: Request) {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get("redirect") || undefined;
    return html(<LoginPage redirectTo={redirectTo} user={user} />);
  }

  const form = await req.formData();
  const userName = (form.get("user_name") as string || "").trim();
  const password = form.get("password") as string || "";
  const redirectTo = form.get("redirect") as string || null;

  const genericError = "Invalid username or password.";

  if (!userName || !password) {
    return html(<LoginPage error={genericError} user={user} />);
  }

  const foundUser = await users.findByUserName(ctx, userName);
  if (!foundUser || !foundUser.password) {
    return html(<LoginPage error={genericError} user={user} />);
  }

  const valid = await verifyPassword(password, foundUser.password);
  if (!valid) {
    return html(<LoginPage error={genericError} user={user} />);
  }

  if (!foundUser.active) {
    return html(<LoginPage error={genericError} user={user} />);
  }

  const sessionId = await createSession(ctx, foundUser.id);
  return redirect(sanitizeRedirect(redirectTo), {
    "Set-Cookie": setSessionCookie(sessionId),
  });
}

async function logout(ctx: Context, { sessionId }: Session, req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (sessionId) {
    await destroySession(ctx, sessionId);
  }

  return redirect("/login", { "Set-Cookie": clearSessionCookie() });
}

export const routes = {
  "/signup": signup,
  "/login": login,
  "/logout": logout,
};
