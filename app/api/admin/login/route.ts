import { NextResponse } from "next/server";
import { z } from "zod";
import { hashIp } from "@/lib/auth/crypto";
import { verifyCredentials } from "@/lib/auth/password";
import {
  checkRateLimit,
  deleteOldLoginAttempts,
  markLoginSucceeded,
  startLoginAttempt,
} from "@/lib/auth/rate-limit";
import {
  createSession,
  deleteExpiredSessions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { adminEnv, siteEnv } from "@/lib/env";
import { apiError, clientIp, isSameOrigin, readJsonBody } from "@/lib/http/api";

const bodySchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

// API-01 (App Flow section 10, SDD section 6).
export async function POST(request: Request) {
  if (!isSameOrigin(request, siteEnv().SITE_URL)) {
    return apiError(403, "FORBIDDEN_ORIGIN", "Request not allowed.");
  }

  let admin: ReturnType<typeof adminEnv>;
  try {
    admin = adminEnv();
  } catch {
    console.error("[auth] login attempted but admin environment variables are invalid");
    return apiError(503, "ADMIN_NOT_CONFIGURED", "Admin login is not configured on the server.");
  }

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_FAILED", "Enter your email and password.");
  }

  try {
    const ipHash = hashIp(clientIp(request), admin.RATE_LIMIT_SALT);

    const attempt = await startLoginAttempt(ipHash);
    if (attempt.retryAfterSeconds > 0) {
      return apiError(429, "RATE_LIMITED", "Too many attempts.", {
        retryAfterSeconds: attempt.retryAfterSeconds,
      });
    }

    const valid = await verifyCredentials(parsed.data, {
      email: admin.ADMIN_EMAIL,
      passwordHash: admin.ADMIN_PASSWORD_HASH,
    });

    if (!valid) {
      // The 5th failure in the window already locks the form (App Flow E-10).
      const waitAfter = await checkRateLimit(ipHash);
      return waitAfter > 0
        ? apiError(429, "RATE_LIMITED", "Too many attempts.", { retryAfterSeconds: waitAfter })
        : apiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    await markLoginSucceeded(attempt.id);
    await Promise.all([deleteExpiredSessions(), deleteOldLoginAttempts()]);
    const token = await createSession(request.headers.get("user-agent"));

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[auth] login failed:", (error as Error).message);
    return apiError(500, "SERVER_ERROR", "Couldn't sign in right now. Try again.");
  }
}
