import type { Context } from "@/system.ts";
import { html } from "@/layout.tsx";
import * as users from "@/repo/users.ts";
import {
  verifyPassword,
  createSession, destroySession,
  setSessionCookie, clearSessionCookie, redirect,
  type Session, type SessionUser,
} from "@/lib/auth.ts";
import { authUrl, exchangeCode, getUserInfo } from "@/lib/google.ts";
import { liveReloadScript } from "@/lib/livereload.ts";

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID;

const inputCls =
  "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";

const googleSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5"><path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" /><path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" /><path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" /><path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" /></svg>`;

function AuthShell({ title, children }: { title: string; children?: any }) {
  return (
    <html class="h-full bg-white">
      <head>
        <meta charset="utf-8" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
        {liveReloadScript}
      </head>
      <body class="h-full">
        <div class="flex min-h-full">
          <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div class="mx-auto w-full max-w-sm lg:w-96">
              {children}
            </div>
          </div>
          <div class="relative hidden w-0 flex-1 lg:block">
            <img
              src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
              alt=""
              class="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      </body>
    </html>
  );
}

function SocialButtons() {
  if (!googleEnabled) return "";
  return (
    <div class="mt-10">
      <div class="relative">
        <div aria-hidden="true" class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm/6 font-medium">
          <span class="bg-white px-6 text-gray-900">Or continue with</span>
        </div>
      </div>
      <div class="mt-6">
        <a
          href="/auth/google"
          class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent"
        >
          {googleSvg}
          <span class="text-sm/6 font-semibold">Google</span>
        </a>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message?: string }) {
  if (!message) return "";
  return (
    <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
      {message}
    </p>
  );
}

function LoginPage({ error, redirectTo }: { error?: string; redirectTo?: string }) {
  return (
    <AuthShell title="Log in">
      <div>
        <a href="/" class="text-xl font-bold text-indigo-600">BareBun</a>
        <h2 class="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">Sign in to your account</h2>
        <p class="mt-2 text-sm/6 text-gray-500">
          {"Don't have an account? "}
          <a href="/signup" class="font-semibold text-indigo-600 hover:text-indigo-500">Sign up</a>
        </p>
      </div>

      <div class="mt-10">
        <form method="POST" action="/login" class="space-y-6">
          <ErrorAlert message={error} />
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

          <div>
            <label for="user_name" class="block text-sm/6 font-medium text-gray-900">Username</label>
            <div class="mt-2">
              <input id="user_name" name="user_name" type="text" required autocomplete="username" class={inputCls} />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
            <div class="mt-2">
              <input id="password" name="password" type="password" required autocomplete="current-password" class={inputCls} />
            </div>
          </div>

          <div>
            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Sign in
            </button>
          </div>
        </form>

        <SocialButtons />
      </div>
    </AuthShell>
  );
}

function SignupPage({ error }: { error?: string }) {
  return (
    <AuthShell title="Sign up">
      <div>
        <a href="/" class="text-xl font-bold text-indigo-600">BareBun</a>
        <h2 class="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">Create your account</h2>
        <p class="mt-2 text-sm/6 text-gray-500">
          {"Already have an account? "}
          <a href="/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Sign in</a>
        </p>
      </div>

      <div class="mt-10">
        <form method="POST" action="/signup" class="space-y-6">
          <ErrorAlert message={error} />

          <div>
            <label for="user_name" class="block text-sm/6 font-medium text-gray-900">Username</label>
            <div class="mt-2">
              <input id="user_name" name="user_name" type="text" required autocomplete="username" class={inputCls} />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
            <div class="mt-2">
              <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" class={inputCls} />
            </div>
          </div>

          <div>
            <label for="password_confirm" class="block text-sm/6 font-medium text-gray-900">Confirm password</label>
            <div class="mt-2">
              <input id="password_confirm" name="password_confirm" type="password" required minlength="8" autocomplete="new-password" class={inputCls} />
            </div>
          </div>

          <div>
            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Sign up
            </button>
          </div>
        </form>

        <SocialButtons />
      </div>
    </AuthShell>
  );
}

// --- Handlers (unchanged) ---

function sanitizeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

async function signup(ctx: Context, { user }: Session, req: Request) {
  if (req.method === "GET") {
    return html(<SignupPage />);
  }

  const form = await req.formData();
  const result = await users.signup(ctx, {
    user_name: form.get("user_name") as string || "",
    password: form.get("password") as string || "",
    password_confirm: form.get("password_confirm") as string || "",
  });

  if (!result.ok) {
    return html(<SignupPage error={result.error.message} />);
  }

  const sessionId = await createSession(ctx, result.user.id);
  return redirect("/", { "Set-Cookie": setSessionCookie(sessionId) });
}

async function login(ctx: Context, { user }: Session, req: Request) {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get("redirect") || undefined;
    return html(<LoginPage redirectTo={redirectTo} />);
  }

  const form = await req.formData();
  const userName = (form.get("user_name") as string || "").trim();
  const password = form.get("password") as string || "";
  const redirectTo = form.get("redirect") as string || null;

  const genericError = "Invalid username or password.";

  if (!userName || !password) {
    return html(<LoginPage error={genericError} />);
  }

  const foundUser = await users.findByUserName(ctx, userName);
  if (!foundUser || !foundUser.password) {
    return html(<LoginPage error={genericError} />);
  }

  const valid = await verifyPassword(password, foundUser.password);
  if (!valid) {
    return html(<LoginPage error={genericError} />);
  }

  if (!foundUser.active) {
    return html(<LoginPage error={genericError} />);
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

async function googleAuth(_ctx: Context, _session: Session, req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return new Response("Google OAuth not configured", { status: 404 });

  const state = crypto.randomUUID();
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/auth/google/callback`;
  const location = authUrl(clientId, redirectUri, state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Set-Cookie": `google_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}

async function googleCallback(ctx: Context, _session: Session, req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return new Response("Google OAuth not configured", { status: 404 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect("/login");
  }

  if (!code || !state) {
    return html(<LoginPage error="Invalid OAuth response." />);
  }

  const cookie = req.headers.get("cookie") ?? "";
  const stateMatch = cookie.match(/(?:^|;\s*)google_oauth_state=([^;]+)/);
  const savedState = stateMatch ? stateMatch[1] : null;

  if (state !== savedState) {
    return html(<LoginPage error="OAuth state mismatch. Please try again." />);
  }

  const redirectUri = `${url.origin}/auth/google/callback`;

  try {
    const tokens = await exchangeCode(code, clientId, clientSecret, redirectUri);
    const googleUser = await getUserInfo(tokens.access_token);
    const user = await users.findOrCreateByGoogle(ctx, googleUser);
    const sessionId = await createSession(ctx, user.id);

    return new Response(null, {
      status: 302,
      headers: [
        ["Location", "/"],
        ["Set-Cookie", setSessionCookie(sessionId)],
        ["Set-Cookie", "google_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"],
      ],
    });
  } catch (e) {
    console.error("Google OAuth error:", e);
    return html(<LoginPage error="Google login failed. Please try again." />);
  }
}

export const routes = {
  "/signup": signup,
  "/login": login,
  "/logout": logout,
  "/auth/google": googleAuth,
  "/auth/google/callback": googleCallback,
};
