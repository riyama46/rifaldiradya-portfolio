import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { siteEnv } from "@/lib/env";
import { apiError, isSameOrigin } from "@/lib/http/api";

// API-02 (App Flow section 10): always succeeds for a same-origin request, even without a session.
export async function POST(request: Request) {
  if (!isSameOrigin(request, siteEnv().SITE_URL)) {
    return apiError(403, "FORBIDDEN_ORIGIN", "Request not allowed.");
  }

  try {
    await deleteSession((await cookies()).get(SESSION_COOKIE)?.value);
  } catch (error) {
    console.error("[auth] logout could not delete the session row:", (error as Error).message);
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
