import type { Context } from "@/system.ts";
import { Layout, html } from "@/layout.tsx";
import * as users from "@/repo/users.ts";
import { hasRole, hashPassword, redirect, type Session, type SessionUser } from "@/lib/auth.ts";
import { DataTable, Badge, type Column, type Action } from "@/components/table.tsx";
import { Breadcrumb } from "@/components/breadcrumb.tsx";
import { FormSection, Field, Input, Textarea, Select, Checkbox, FormError, FormActions } from "@/components/form.tsx";

const userColumns: Column<users.Users>[] = [
  {
    key: "user_name",
    label: "Username",
    render: (u) => `<div class="font-medium text-gray-900">${u.user_name}</div><div class="mt-1 text-gray-500">${u.display_name ?? ""}</div>`,
  },
  {
    key: "roles",
    label: "Roles",
    render: (u) => u.roles?.map((r) => r.value).join(", ") ?? "",
  },
  {
    key: "status",
    label: "Status",
    render: (u) => u.active
      ? Badge({ label: "Active", color: "green" })
      : Badge({ label: "Inactive", color: "gray" }),
  },
  {
    key: "created_at",
    label: "Created",
    render: (u) => u.created_at.toLocaleDateString(),
  },
];

const userActions: Action<users.Users>[] = [
  { label: "Edit", href: (u) => `/users/${u.id}`, srLabel: (u) => u.user_name },
];

function UsersIndex({ usersList, user }: { usersList: users.Users[]; user?: SessionUser | null }) {
  return (
    <Layout title="Users" user={user} activePath="/users">
      <DataTable
        title="Users"
        description="All registered users and their roles."
        columns={userColumns}
        rows={usersList}
        actions={userActions}
        addButton={{ label: "Add user", href: "/users/new" }}
        empty="No users found."
      />
    </Layout>
  );
}

function UserForm({ mode, u }: { mode: "create" | "edit"; u?: users.Users }) {
  const v = (fn: (u: users.Users) => string | undefined) => u ? (fn(u) ?? "") : "";
  return (
    <div class="space-y-12">
      <FormSection title="Account" description="Login credentials and account status.">
        {mode === "create" ? (
          <Field span={4}>
            <Input id="user_name" label="Username" required autocomplete="username" />
          </Field>
        ) : (
          <>
            <Field span={4}>
              <Input id="user_name" label="Username" value={v(u => u.user_name)} readonly />
            </Field>
            <Field span={4}>
              <Input id="external_id" label="External ID" value={v(u => u.external_id)} readonly hint="Set by OAuth provider." />
            </Field>
          </>
        )}
        {mode === "create" && (
          <>
            <Field span={3}>
              <Input id="password" label="Password" type="password" required autocomplete="new-password" />
            </Field>
            <Field span={3}>
              <Input id="password_confirm" label="Confirm password" type="password" required autocomplete="new-password" />
            </Field>
          </>
        )}
        <Field span={4}>
          <Input id="roles" label="Roles" value={v(u => u.roles?.map(r => r.value).join(", "))} placeholder="admin, user" hint="Comma-separated role values." />
        </Field>
        <Field span="full">
          <Checkbox id="active" label="Active" description="Inactive users cannot log in." checked={u ? u.active : true} />
        </Field>
      </FormSection>

      <FormSection title="Profile" description="SCIM user profile fields.">
        <Field span={4}>
          <Input id="display_name" label="Display name" value={v(u => u.display_name)} />
        </Field>
        <Field span={4}>
          <Input id="nick_name" label="Nickname" value={v(u => u.nick_name)} />
        </Field>
        <Field span={3}>
          <Input id="given_name" label="First name" value={v(u => u.name?.givenName)} autocomplete="given-name" />
        </Field>
        <Field span={3}>
          <Input id="family_name" label="Last name" value={v(u => u.name?.familyName)} autocomplete="family-name" />
        </Field>
        <Field span={3}>
          <Input id="middle_name" label="Middle name" value={v(u => u.name?.middleName)} />
        </Field>
        <Field span={3}>
          <Input id="honorific_prefix" label="Prefix" value={v(u => u.name?.honorificPrefix)} placeholder="Mr., Dr." />
        </Field>
        <Field span={4}>
          <Input id="title" label="Title" value={v(u => u.title)} placeholder="Senior Engineer" />
        </Field>
        <Field span={3}>
          <Input id="user_type" label="User type" value={v(u => u.user_type)} placeholder="Employee, Contractor" />
        </Field>
      </FormSection>

      <FormSection title="Contact" description="Email addresses, phone numbers, and messaging.">
        <Field span={4}>
          <Input id="email" label="Primary email" type="email" value={v(u => u.emails?.[0]?.value)} autocomplete="email" />
        </Field>
        <Field span={4}>
          <Input id="phone" label="Phone number" type="tel" value={v(u => u.phone_numbers?.[0]?.value)} autocomplete="tel" />
        </Field>
        <Field span={4}>
          <Input id="profile_url" label="Profile URL" type="url" value={v(u => u.profile_url)} placeholder="https://" />
        </Field>
      </FormSection>

      <FormSection title="Locale" description="Language, timezone, and regional preferences.">
        <Field span={3}>
          <Input id="preferred_language" label="Preferred language" value={v(u => u.preferred_language)} placeholder="en" />
        </Field>
        <Field span={3}>
          <Input id="locale" label="Locale" value={v(u => u.locale)} placeholder="en-US" />
        </Field>
        <Field span={3}>
          <Input id="timezone" label="Timezone" value={v(u => u.timezone)} placeholder="America/New_York" />
        </Field>
      </FormSection>

      {mode === "edit" && (
        <FormSection title="Change password" description="Leave blank to keep the current password.">
          <Field span={3}>
            <Input id="password" label="New password" type="password" autocomplete="new-password" />
          </Field>
          <Field span={3}>
            <Input id="password_confirm" label="Confirm password" type="password" autocomplete="new-password" />
          </Field>
        </FormSection>
      )}
    </div>
  );
}

function UserNewPage({ error, user }: { error?: string; user?: SessionUser | null }) {
  return (
    <Layout title="New user" user={user} activePath="/users">
      <Breadcrumb crumbs={[{ label: "Users", href: "/users" }, { label: "New user" }]} />
      <form method="POST" action="/users/new">
        <FormError message={error} />
        <UserForm mode="create" />
        <FormActions submitLabel="Create user" cancelHref="/users" />
      </form>
    </Layout>
  );
}

function UserEditPage({ editUser, error, user }: { editUser: users.Users; error?: string; user?: SessionUser | null }) {
  return (
    <Layout title={`Edit ${editUser.user_name}`} user={user} activePath="/users">
      <Breadcrumb crumbs={[{ label: "Users", href: "/users" }, { label: editUser.user_name }]} />
      <form method="POST" action={`/users/${editUser.id}`}>
        <FormError message={error} />
        <UserForm mode="edit" u={editUser} />
        <FormActions submitLabel="Save changes" cancelHref="/users" />
      </form>

      <div class="mt-10 border-t border-gray-900/10 pt-10">
        <h2 class="text-base/7 font-semibold text-red-600">Danger zone</h2>
        <p class="mt-1 text-sm/6 text-gray-600">Permanently delete this user account. This action cannot be undone.</p>
        <form method="POST" action={`/users/${editUser.id}/delete`} class="mt-6">
          <button
            type="submit"
            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500"
            onclick="return confirm('Delete this user?')"
          >
            Delete user
          </button>
        </form>
      </div>
    </Layout>
  );
}

function parseCSV(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseRoles(raw: string): { value: string; type?: string; primary?: boolean }[] {
  return parseCSV(raw).map((value) => ({ value }));
}

function str(form: FormData, key: string): string {
  return ((form.get(key) as string) || "").trim();
}

function parseScimFields(form: FormData): Partial<users.UsersUpdate> {
  const displayName = str(form, "display_name");
  const nickName = str(form, "nick_name");
  const givenName = str(form, "given_name");
  const familyName = str(form, "family_name");
  const middleName = str(form, "middle_name");
  const prefix = str(form, "honorific_prefix");
  const title = str(form, "title");
  const userType = str(form, "user_type");
  const email = str(form, "email");
  const phone = str(form, "phone");
  const profileUrl = str(form, "profile_url");
  const preferredLanguage = str(form, "preferred_language");
  const locale = str(form, "locale");
  const timezone = str(form, "timezone");
  const roles = parseRoles(str(form, "roles"));

  const hasName = givenName || familyName || middleName || prefix;
  const name = hasName ? {
    ...(givenName ? { givenName } : {}),
    ...(familyName ? { familyName } : {}),
    ...(middleName ? { middleName } : {}),
    ...(prefix ? { honorificPrefix: prefix } : {}),
    formatted: [prefix, givenName, middleName, familyName].filter(Boolean).join(" ") || undefined,
  } : undefined;

  return {
    ...(displayName ? { display_name: displayName } : {}),
    ...(nickName ? { nick_name: nickName } : {}),
    ...(name ? { name } : {}),
    ...(title ? { title } : {}),
    ...(userType ? { user_type: userType } : {}),
    ...(email ? { emails: [{ value: email, primary: true }] } : {}),
    ...(phone ? { phone_numbers: [{ value: phone }] } : {}),
    ...(profileUrl ? { profile_url: profileUrl } : {}),
    ...(preferredLanguage ? { preferred_language: preferredLanguage } : {}),
    ...(locale ? { locale } : {}),
    ...(timezone ? { timezone } : {}),
    roles: roles.length > 0 ? roles : [],
    active: form.has("active"),
  };
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
    user_name: str(form, "user_name"),
    password: str(form, "password"),
    password_confirm: str(form, "password_confirm"),
  });

  if (!result.ok) {
    return html(<UserNewPage error={result.error.message} user={user} />);
  }

  await users.update(ctx, result.user.id, parseScimFields(form));
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
  const updateData: users.UsersUpdate = parseScimFields(form);

  const password = str(form, "password");
  const passwordConfirm = str(form, "password_confirm");

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
