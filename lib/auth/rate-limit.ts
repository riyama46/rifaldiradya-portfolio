import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { loginAttempts } from "@/lib/db/schema";

// App Flow E-10 / SDD section 6: 5 failed logins per 15 minutes per IP.
export const MAX_FAILED_ATTEMPTS = 5;
// Plus a cap across all IPs: the client IP comes from proxy headers that may be spoofable, and
// there is only one admin account, so 20 failures per window from anywhere also locks the form.
export const GLOBAL_MAX_FAILED_ATTEMPTS = 20;
export const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Seconds until fewer than `max` failures remain in the window, or 0 when not limited.
 * `failures` must be the failure times inside the window, oldest first. Pure for unit tests.
 */
export function retryAfterSeconds(failures: readonly Date[], max: number, now: Date): number {
  if (failures.length < max) return 0;
  const unlocksAt = failures[failures.length - max].getTime() + WINDOW_MS;
  return Math.max(1, Math.ceil((unlocksAt - now.getTime()) / 1000));
}

async function failuresSince(since: Date, ipHash?: string): Promise<Date[]> {
  const rows = await getDb()
    .select({ createdAt: loginAttempts.createdAt })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since),
        ipHash ? eq(loginAttempts.ipHash, ipHash) : undefined,
      ),
    )
    .orderBy(asc(loginAttempts.createdAt));
  return rows.map((row) => row.createdAt);
}

/**
 * 0 when a login may be attempted, otherwise the seconds to wait. `pending` = failure rows of
 * attempts still in progress that are already counted (see startLoginAttempt).
 */
export async function checkRateLimit(
  ipHash: string,
  now = new Date(),
  pending = 0,
): Promise<number> {
  const since = new Date(now.getTime() - WINDOW_MS);
  const [fromIp, fromAnywhere] = await Promise.all([
    failuresSince(since, ipHash),
    failuresSince(since),
  ]);
  return Math.max(
    retryAfterSeconds(fromIp, MAX_FAILED_ATTEMPTS + pending, now),
    retryAfterSeconds(fromAnywhere, GLOBAL_MAX_FAILED_ATTEMPTS + pending, now),
  );
}

/**
 * Records the attempt as a failure *before* the slow password check, so parallel requests count
 * each other and can't all slip under the limit (DECISIONS 2026-10-22). A blocked attempt is not a
 * guess: its row is removed again, so hammering a locked form doesn't extend the lock.
 */
export async function startLoginAttempt(
  ipHash: string,
  now = new Date(),
): Promise<{ id: number; retryAfterSeconds: number }> {
  const db = getDb();
  const [{ id }] = await db.insert(loginAttempts).values({ ipHash, success: false }).$returningId();
  const retryAfterSeconds = await checkRateLimit(ipHash, now, 1);
  if (retryAfterSeconds > 0) await db.delete(loginAttempts).where(eq(loginAttempts.id, id));
  return { id, retryAfterSeconds };
}

export async function markLoginSucceeded(id: number): Promise<void> {
  await getDb().update(loginAttempts).set({ success: true }).where(eq(loginAttempts.id, id));
}

export async function deleteOldLoginAttempts(now = new Date()): Promise<void> {
  await getDb()
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(now.getTime() - RETENTION_MS)));
}
