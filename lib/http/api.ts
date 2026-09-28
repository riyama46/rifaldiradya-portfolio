import { NextResponse } from "next/server";

// Error shape and codes from App Flow section 10 (+ ADMIN_NOT_CONFIGURED, see DECISIONS T-13).
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ORIGIN"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "ADMIN_NOT_CONFIGURED";

type ErrorExtras = { fields?: Record<string, string>; retryAfterSeconds?: number };

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extras: ErrorExtras = {},
): NextResponse {
  const headers = extras.retryAfterSeconds
    ? { "Retry-After": String(extras.retryAfterSeconds) }
    : undefined;
  return NextResponse.json({ error: { code, message, ...extras } }, { status, headers });
}

/** CSRF guard for write requests (SDD section 6): the Origin header must be this site. */
export function isSameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(siteUrl).origin;
}

/**
 * Client IP for rate limiting. The *first* X-Forwarded-For entry is whatever the client sent and
 * can be spoofed to dodge the limit, so prefer X-Real-IP, then the entry appended last by the
 * proxy in front of the app.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || "unknown";
}
