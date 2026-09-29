const DEFAULT_ADMIN_PATH = "/admin";

/**
 * Where to go after login (App Flow S-10): only same-site /admin paths, never the login page
 * itself, so `?next=` cannot be used as an open redirect (e.g. `//evil.com`, `/admin\\@evil`).
 */
export function safeAdminNext(next: string | null | undefined): string {
  if (!next) return DEFAULT_ADMIN_PATH;
  const isAdminPath = next === "/admin" || /^\/admin\/[A-Za-z0-9\-._~/]*$/.test(next);
  if (!isAdminPath || next.includes("//") || next.startsWith("/admin/login")) {
    return DEFAULT_ADMIN_PATH;
  }
  return next;
}
