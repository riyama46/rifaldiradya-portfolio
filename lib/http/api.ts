import { NextResponse } from "next/server";

// Error shape and codes from App Flow section 10 (+ ADMIN_NOT_CONFIGURED, IMAGE_IN_USE: DECISIONS).
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ORIGIN"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "ADMIN_NOT_CONFIGURED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "IMAGE_TOO_SMALL"
  | "UPLOAD_FAILED"
  | "IMAGE_IN_USE";

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

/** Admin JSON bodies are small forms; anything bigger is rejected before parsing. */
export const MAX_JSON_BYTES = 32 * 1024;

/** Parsed JSON body, or undefined when it is missing, too large, or not valid JSON. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES || !request.body) return undefined;
  // Counted while reading: a chunked body has no Content-Length, so the header alone can't stop it.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      size += part.value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(part.value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    return text ? (JSON.parse(text) as unknown) : undefined;
  } catch {
    return undefined;
  }
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
