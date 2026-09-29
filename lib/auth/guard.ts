import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AdminSession } from "@/lib/db/schema";
import { siteEnv } from "@/lib/env";
import { apiError, isSameOrigin } from "@/lib/http/api";
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

/**
 * Preamble for every admin write route (API-03…07): same-origin check (403), then a valid session
 * (401). Returns the error response to send, or null to continue.
 */
export async function guardAdminWrite(request: Request) {
  if (!isSameOrigin(request, siteEnv().SITE_URL)) {
    return apiError(403, "FORBIDDEN_ORIGIN", "Request not allowed.");
  }
  try {
    return await requireAdminApi();
  } catch (error) {
    console.error("[auth] session check failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Something went wrong. Try again.");
  }
}
