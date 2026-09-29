import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { adminSessions, type AdminSession } from "@/lib/db/schema";
import { newSessionToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/** Cookie flags from App Flow G4 / SDD section 6. `secure` is off only for http://localhost dev. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Creates a session row (hashed token) and returns the raw token for the cookie. */
export async function createSession(userAgent: string | null, now = new Date()): Promise<string> {
  const token = newSessionToken();
  await getDb()
    .insert(adminSessions)
    .values({
      tokenHash: sha256(token),
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
      userAgent: userAgent?.slice(0, 255) ?? null,
    });
  return token;
}

/** The unexpired session for this token, or null. Refreshes last_seen_at at most every 5 min. */
export async function findValidSession(
  token: string | undefined,
  now = new Date(),
): Promise<AdminSession | null> {
  if (!token) return null;
  const db = getDb();
  const [session] = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, now)))
    .limit(1);
  if (!session) return null;

  if (now.getTime() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.update(adminSessions).set({ lastSeenAt: now }).where(eq(adminSessions.id, session.id));
  }
  return session;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await getDb()
    .delete(adminSessions)
    .where(eq(adminSessions.tokenHash, sha256(token)));
}

export async function deleteExpiredSessions(now = new Date()): Promise<void> {
  await getDb().delete(adminSessions).where(lt(adminSessions.expiresAt, now));
}
