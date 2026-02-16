import type { Context } from "@/system.ts";
import { Layout, html } from "@/layout.tsx";
import * as users from "@/repo/users.ts";
import { hashPassword, redirect, type Session, type SessionUser } from "@/lib/auth.ts";
import { Breadcrumb } from "@/components/breadcrumb.tsx";
import { FormSection, Field, Input, FormError, FormActions } from "@/components/form.tsx";

function ProfileForm({ u }: { u: users.Users }) {
  const v = (fn: (u: users.Users) => string | undefined) => fn(u) ?? "";
  return (
    <div class="space-y-12">
      <FormSection title="Profile" description="Your public profile information.">
        <Field span={4}>
          <Input id="user_name" label="Username" value={v(u => u.user_name)} readonly />
        </Field>
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
      </FormSection>

      <FormSection title="Contact" description="Your email and phone number.">
        <Field span={4}>
          <Input id="email" label="Email" type="email" value={v(u => u.emails?.[0]?.value)} autocomplete="email" />
        </Field>
        <Field span={4}>
          <Input id="phone" label="Phone" type="tel" value={v(u => u.phone_numbers?.[0]?.value)} autocomplete="tel" />
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
    </div>
  );
}

function str(form: FormData, key: string): string {
  return ((form.get(key) as string) || "").trim();
}

function parseProfileFields(form: FormData): Partial<users.UsersUpdate> {
  const displayName = str(form, "display_name");
  const nickName = str(form, "nick_name");
  const givenName = str(form, "given_name");
  const familyName = str(form, "family_name");
  const middleName = str(form, "middle_name");
  const prefix = str(form, "honorific_prefix");
  const title = str(form, "title");
  const email = str(form, "email");
  const phone = str(form, "phone");
  const profileUrl = str(form, "profile_url");
  const preferredLanguage = str(form, "preferred_language");
  const locale = str(form, "locale");
  const timezone = str(form, "timezone");

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
    ...(email ? { emails: [{ value: email, primary: true }] } : {}),
    ...(phone ? { phone_numbers: [{ value: phone }] } : {}),
    ...(profileUrl ? { profile_url: profileUrl } : {}),
    ...(preferredLanguage ? { preferred_language: preferredLanguage } : {}),
    ...(locale ? { locale } : {}),
    ...(timezone ? { timezone } : {}),
  };
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <p class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-6">
      {message}
    </p>
  );
}

function ProfilePage({ profileUser, error, passwordError, success, user }: {
  profileUser: users.Users;
  error?: string;
  passwordError?: string;
  success?: "profile" | "password";
  user?: SessionUser | null;
}) {
  return (
    <Layout title="Your Profile" user={user} activePath="/profile">
      <Breadcrumb crumbs={[{ label: "Profile" }]} />

      {success === "profile" && <SuccessBanner message="Profile updated successfully." />}

      <form method="POST" action="/profile">
        <FormError message={error} />
        <ProfileForm u={profileUser} />
        <FormActions submitLabel="Save changes" cancelHref="/" />
      </form>

      <div class="mt-10 border-t border-gray-900/10 pt-10">
        {success === "password" && <SuccessBanner message="Password changed successfully." />}
        <form method="POST" action="/profile/password">
          <FormError message={passwordError} />
          <div class="space-y-12">
            <FormSection title="Change password" description="Update your account password.">
              <Field span={3}>
                <Input id="current_password" label="Current password" type="password" required autocomplete="current-password" />
              </Field>
              <Field span={3}>
                <Input id="password" label="New password" type="password" required autocomplete="new-password" />
              </Field>
              <Field span={3}>
                <Input id="password_confirm" label="Confirm new password" type="password" required autocomplete="new-password" />
              </Field>
            </FormSection>
          </div>
          <FormActions submitLabel="Change password" cancelHref="/profile" />
        </form>
      </div>
    </Layout>
  );
}

async function profile(ctx: Context, { user }: Session, req: Request) {
  if (!user) return redirect("/login");

  const profileUser = await users.read(ctx, user.id);
  if (!profileUser) return redirect("/login");

  if (req.method === "GET") {
    const url = new URL(req.url);
    const success = url.searchParams.get("saved") as "profile" | "password" | null;
    return html(<ProfilePage profileUser={profileUser} user={user} success={success || undefined} />);
  }

  const form = await req.formData();
  const updateData: users.UsersUpdate = parseProfileFields(form);
  await users.update(ctx, user.id, updateData);
  return redirect("/profile?saved=profile");
}

async function changePassword(ctx: Context, { user }: Session, req: Request) {
  if (!user) return redirect("/login");
  if (req.method !== "POST") return redirect("/profile");

  const profileUser = await users.read(ctx, user.id);
  if (!profileUser) return redirect("/login");

  const form = await req.formData();
  const currentPassword = str(form, "current_password");
  const password = str(form, "password");
  const passwordConfirm = str(form, "password_confirm");

  // Verify current password
  if (profileUser.password) {
    const { verifyPassword } = await import("@/lib/auth.ts");
    const valid = await verifyPassword(currentPassword, profileUser.password);
    if (!valid) {
      return html(<ProfilePage profileUser={profileUser} passwordError="Current password is incorrect." user={user} />);
    }
  }

  if (password.length < 8) {
    return html(<ProfilePage profileUser={profileUser} passwordError="New password must be at least 8 characters." user={user} />);
  }
  if (password !== passwordConfirm) {
    return html(<ProfilePage profileUser={profileUser} passwordError="Passwords do not match." user={user} />);
  }

  await users.update(ctx, user.id, { password: await hashPassword(password) });
  return redirect("/profile?saved=password");
}

export const routes = {
  "/profile": profile,
  "/profile/password": changePassword,
};
