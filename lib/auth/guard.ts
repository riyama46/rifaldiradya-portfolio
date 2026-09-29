import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AdminSession } from "@/lib/db/schema";
import { apiError } from "@/lib/http/api";
import { findValidSession, SESSION_COOKIE } from "./session";

// The source of truth for admin access (SDD section 6); proxy.ts only does a quick cookie check.
// Layouts don't re-render on client navigation, so every admin page that reads data also calls
// requireAdmin() itself; cache() keeps that to one session lookup per request.

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return findValidSession(token);
});

/** For admin pages: no valid session → /admin/login?next=… */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/** For admin API routes: returns a 401 response to send, or null when the session is valid. */
export async function requireAdminApi() {
  const session = await getAdminSession();
  return session ? null : apiError(401, "UNAUTHENTICATED", "Your session expired. Sign in again.");
}
