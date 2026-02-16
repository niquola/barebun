import type { Context } from "@/system.ts";
import { Layout, html } from "@/layout.tsx";
import * as users from "@/repo/users.ts";
import { hasRole, hashPassword, redirect, type Session, type SessionUser } from "@/lib/auth.ts";

function UsersIndex({ usersList, user }: { usersList: users.Users[]; user?: SessionUser | null }) {
  return (
    <Layout title="Users" user={user}>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Users</h1>
        <a
          href="/users/new"
          class="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          New user
        </a>
      </div>
      {usersList.length === 0
        ? <p class="text-gray-500">No users found.</p>
        : <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-gray-300 text-left">
                <th class="py-2 pr-4 font-semibold">Username</th>
                <th class="py-2 pr-4 font-semibold">Display name</th>
                <th class="py-2 pr-4 font-semibold">Roles</th>
                <th class="py-2 pr-4 font-semibold">Active</th>
                <th class="py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-2 pr-4">
                    <a href={`/users/${u.id}`} class="text-blue-600 hover:text-blue-800 font-medium">
                      {u.user_name}
                    </a>
                  </td>
                  <td class="py-2 pr-4 text-gray-600">{u.display_name ?? ""}</td>
                  <td class="py-2 pr-4 text-gray-600">{u.roles?.map((r) => r.value).join(", ") ?? ""}</td>
                  <td class="py-2 pr-4">
                    {u.active
                      ? <span class="text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5 text-xs font-medium">active</span>
                      : <span class="text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs font-medium">inactive</span>
                    }
                  </td>
                  <td class="py-2 text-gray-500">{u.created_at.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </Layout>
  );
}

function UserNewPage({ error, user }: { error?: string; user?: SessionUser | null }) {
  return (
    <Layout title="New user" user={user}>
      <div class="mb-4">
        <a href="/users" class="text-blue-600 hover:text-blue-800 text-sm">&larr; All users</a>
      </div>
      <h1 class="text-3xl font-bold mb-6">New user</h1>
      <form method="POST" action="/users/new" class="max-w-sm space-y-4">
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
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="display_name">Display name</label>
          <input
            id="display_name"
            name="display_name"
            type="text"
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
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="roles">Roles</label>
          <input
            id="roles"
            name="roles"
            type="text"
            placeholder="admin, user"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            checked
            class="rounded border-gray-300"
          />
          <label class="text-sm font-medium" for="active">Active</label>
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Create user
        </button>
      </form>
    </Layout>
  );
}

function UserEditPage({ editUser, error, user }: { editUser: users.Users; error?: string; user?: SessionUser | null }) {
  return (
    <Layout title={`Edit ${editUser.user_name}`} user={user}>
      <div class="mb-4">
        <a href="/users" class="text-blue-600 hover:text-blue-800 text-sm">&larr; All users</a>
      </div>
      <h1 class="text-3xl font-bold mb-6">Edit user</h1>
      <form method="POST" action={`/users/${editUser.id}`} class="max-w-sm space-y-4">
        {error && (
          <p class="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}
        <div>
          <label class="block text-sm font-medium mb-1" for="user_name">Username</label>
          <input
            id="user_name"
            name="user_name"
            type="text"
            value={editUser.user_name}
            readonly
            class="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="display_name">Display name</label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            value={editUser.display_name ?? ""}
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="roles">Roles</label>
          <input
            id="roles"
            name="roles"
            type="text"
            value={editUser.roles?.map((r) => r.value).join(", ") ?? ""}
            placeholder="admin, user"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-400 mt-1">Comma-separated</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            checked={editUser.active}
            class="rounded border-gray-300"
          />
          <label class="text-sm font-medium" for="active">Active</label>
        </div>
        <hr class="border-gray-200" />
        <p class="text-sm text-gray-500">Leave blank to keep current password.</p>
        <div>
          <label class="block text-sm font-medium mb-1" for="password">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            minlength="8"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="password_confirm">Confirm new password</label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            minlength="8"
            class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Save changes
        </button>
      </form>
      <form method="POST" action={`/users/${editUser.id}/delete`} class="max-w-sm mt-6">
        <button
          type="submit"
          class="w-full border border-red-300 text-red-600 rounded px-4 py-2 text-sm font-medium hover:bg-red-50"
          onclick="return confirm('Delete this user?')"
        >
          Delete user
        </button>
      </form>
    </Layout>
  );
}

function parseRoles(raw: string): { value: string; type?: string; primary?: boolean }[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value) => ({ value }));
}

async function usersList(ctx: Context, { user }: Session, req: Request) {
  if (!hasRole(user, "admin")) return redirect("/");
  const list = await users.list(ctx);
  return html(<UsersIndex usersList={list} user={user} />);
}

async function userNew(ctx: Context, { user }: Session, req: Request) {
  if (!hasRole(user, "admin")) return redirect("/");

  if (req.method === "GET") {
    return html(<UserNewPage user={user} />);
  }

  const form = await req.formData();
  const result = await users.signup(ctx, {
    user_name: (form.get("user_name") as string) || "",
    password: (form.get("password") as string) || "",
    password_confirm: (form.get("password_confirm") as string) || "",
  });

  if (!result.ok) {
    return html(<UserNewPage error={result.error.message} user={user} />);
  }

  const active = form.has("active");
  const displayName = (form.get("display_name") as string) || "";
  const rolesRaw = (form.get("roles") as string) || "";
  const roles = parseRoles(rolesRaw);

  await users.update(ctx, result.user.id, {
    active,
    ...(displayName ? { display_name: displayName } : {}),
    ...(roles.length > 0 ? { roles } : {}),
  });

  return redirect("/users");
}

async function userEdit(ctx: Context, { user }: Session, req: Request & { params: { id: string } }) {
  if (!hasRole(user, "admin")) return redirect("/");
  const editUser = await users.read(ctx, req.params.id);
  if (!editUser) return new Response("Not found", { status: 404 });

  if (req.method === "GET") {
    return html(<UserEditPage editUser={editUser} user={user} />);
  }

  const form = await req.formData();
  const displayName = (form.get("display_name") as string) || "";
  const active = form.has("active");
  const password = (form.get("password") as string) || "";
  const passwordConfirm = (form.get("password_confirm") as string) || "";
  const rolesRaw = (form.get("roles") as string) || "";
  const roles = parseRoles(rolesRaw);

  const updateData: users.UsersUpdate = {
    display_name: displayName || undefined,
    active,
    roles: roles.length > 0 ? roles : [],
  };

  if (password) {
    if (password.length < 8) {
      return html(<UserEditPage editUser={editUser} error="Password must be at least 8 characters." user={user} />);
    }
    if (password !== passwordConfirm) {
      return html(<UserEditPage editUser={editUser} error="Passwords do not match." user={user} />);
    }
    updateData.password = await hashPassword(password);
  }

  await users.update(ctx, editUser.id, updateData);
  return redirect("/users");
}

async function userDelete(ctx: Context, { user }: Session, req: Request & { params: { id: string } }) {
  if (!hasRole(user, "admin")) return redirect("/");
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  await users.remove(ctx, req.params.id);
  return redirect("/users");
}

export const routes = {
  "/users": usersList,
  "/users/new": userNew,
  "/users/:id": userEdit,
  "/users/:id/delete": userDelete,
};
