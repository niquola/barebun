import { liveReloadScript } from "./lib/livereload.ts";
import { hasRole, type SessionUser } from "./lib/auth.ts";

type NavItem = { href: string; label: string; adminOnly?: boolean };

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tables", label: "Tables" },
  { href: "/users", label: "Users", adminOnly: true },
  { href: "/about", label: "About" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const cls = active
    ? "rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
    : "rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white";
  return <a href={href} class={cls} {...(active ? { "aria-current": "page" } : {})}>{label}</a>;
}

function MobileNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const cls = active
    ? "block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
    : "block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white";
  return <a href={href} class={cls} {...(active ? { "aria-current": "page" } : {})}>{label}</a>;
}

function UserInitials({ user }: { user: SessionUser }) {
  const name = user.display_name || user.user_name;
  const initials = name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <span class="inline-flex size-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-medium text-white">
      {initials}
    </span>
  );
}

const bellIcon = `<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

const menuOpenIcon = `<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const menuCloseIcon = `<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

export function Layout({ title, children, user, activePath }: { title: string; children?: any; user?: SessionUser | null; activePath?: string }) {
  const visibleNav = navItems.filter(n => !n.adminOnly || hasRole(user, "admin"));
  const active = activePath || "/";

  return (
    <html class="h-full bg-gray-100">
      <head>
        <meta charset="utf-8" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/htmx.min.js" defer></script>
        <script src="/datastar.min.js" defer type="module"></script>
        {liveReloadScript}
      </head>
      <body class="h-full">
        <div class="min-h-full">
          <nav class="bg-gray-800">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div class="flex h-16 items-center justify-between">
                <div class="flex items-center">
                  <div class="shrink-0">
                    <a href="/" class="text-xl font-bold text-white">BareBun</a>
                  </div>
                  <div class="hidden md:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                      {visibleNav.map(n => (
                        <NavLink href={n.href} label={n.label} active={active === n.href} />
                      ))}
                    </div>
                  </div>
                </div>
                <div class="hidden md:block">
                  <div class="ml-4 flex items-center md:ml-6">
                    {user ? (
                      <div class="flex items-center gap-3">
                        <button type="button" class="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span class="sr-only">View notifications</span>
                          {bellIcon}
                        </button>
                        {/* Profile dropdown */}
                        <div class="relative" id="user-dropdown">
                          <button type="button" onclick="event.stopPropagation();var d=document.getElementById('user-dropdown-menu');d.classList.toggle('hidden');if(!d.classList.contains('hidden')){setTimeout(function(){document.addEventListener('click',function h(){d.classList.add('hidden');document.removeEventListener('click',h)})},0)}" class="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800" aria-expanded="false" aria-haspopup="true">
                            <span class="sr-only">Open user menu</span>
                            <UserInitials user={user} />
                          </button>
                          <div id="user-dropdown-menu" class="hidden absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                            <div class="px-4 py-2 border-b border-gray-100">
                              <p class="text-sm font-medium text-gray-900">{user.display_name || user.user_name}</p>
                              <p class="text-xs text-gray-500">{user.user_name}</p>
                            </div>
                            <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                            <form method="POST" action="/logout">
                              <button type="submit" class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div class="flex items-center gap-4">
                        <a href="/login" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Log in</a>
                        <a href="/signup" class="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400">Sign up</a>
                      </div>
                    )}
                  </div>
                </div>
                {/* Mobile menu button */}
                <div class="-mr-2 flex md:hidden">
                  <button type="button" onclick="var m=document.getElementById('mobile-menu');var o=document.getElementById('menu-open');var c=document.getElementById('menu-close');m.classList.toggle('hidden');o.classList.toggle('hidden');c.classList.toggle('hidden')" class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span class="sr-only">Open main menu</span>
                    <span id="menu-open">{menuOpenIcon}</span>
                    <span id="menu-close" class="hidden">{menuCloseIcon}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <div id="mobile-menu" class="hidden md:hidden">
              <div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                {visibleNav.map(n => (
                  <MobileNavLink href={n.href} label={n.label} active={active === n.href} />
                ))}
              </div>
              <div class="border-t border-gray-700 pt-4 pb-3">
                {user ? (
                  <>
                    <div class="flex items-center px-5">
                      <UserInitials user={user} />
                      <div class="ml-3">
                        <div class="text-base/5 font-medium text-white">{user.display_name || user.user_name}</div>
                        <div class="text-sm font-medium text-gray-400">{user.user_name}</div>
                      </div>
                      <button type="button" class="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span class="sr-only">View notifications</span>
                        {bellIcon}
                      </button>
                    </div>
                    <div class="mt-3 space-y-1 px-2">
                      <a href="/profile" class="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Your Profile</a>
                      <form method="POST" action="/logout">
                        <button type="submit" class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Sign out</button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div class="space-y-1 px-2">
                    <a href="/login" class="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Log in</a>
                    <a href="/signup" class="block rounded-md px-3 py-2 text-base font-medium text-indigo-400 hover:bg-gray-700 hover:text-white">Sign up</a>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <main>
            <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

export function html(body: string) {
  return new Response("<!DOCTYPE html>" + body, {
    headers: { "Content-Type": "text/html" },
  });
}
