import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { sha256 } from "@/lib/auth/crypto";
import {
  checkRateLimit,
  markLoginSucceeded,
  MAX_FAILED_ATTEMPTS,
  startLoginAttempt,
} from "@/lib/auth/rate-limit";
import {
  createSession,
  deleteExpiredSessions,
  deleteSession,
  findValidSession,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { adminSessions, loginAttempts } from "@/lib/db/schema";

const userAgent = `integration-test-${Date.now()}`;
const ipHash = sha256(`integration-ip-${Date.now()}`);
const parallelIpHash = sha256(`integration-ip-parallel-${Date.now()}`);

afterAll(async () => {
  await getDb().delete(adminSessions).where(eq(adminSessions.userAgent, userAgent));
  await getDb().delete(loginAttempts).where(eq(loginAttempts.ipHash, ipHash));
  await getDb().delete(loginAttempts).where(eq(loginAttempts.ipHash, parallelIpHash));
});

describe("admin sessions (SDD section 6)", () => {
  it("finds a fresh session by its token and never stores the raw token", async () => {
    const token = await createSession(userAgent);
    const session = await findValidSession(token);
    expect(session?.userAgent).toBe(userAgent);
    expect(session?.tokenHash).toBe(sha256(token));
    expect(session?.tokenHash).not.toContain(token);
    expect(await findValidSession(`${token}x`)).toBeNull();
    expect(await findValidSession(undefined)).toBeNull();
  });

  it("rejects an expired session and cleans it up", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const token = await createSession(userAgent, eightDaysAgo);
    expect(await findValidSession(token)).toBeNull();

    await deleteExpiredSessions();
    const rows = await getDb()
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.tokenHash, sha256(token)));
    expect(rows).toHaveLength(0);
  });

  it("logout revokes the session immediately", async () => {
    const token = await createSession(userAgent);
    await deleteSession(token);
    expect(await findValidSession(token)).toBeNull();
  });
});

describe("login rate limit (E-10)", () => {
  it(`locks an IP after ${MAX_FAILED_ATTEMPTS} failures in 15 minutes`, async () => {
    // The race fix itself: an allowed attempt is already counted before the password check runs.
    const first = await startLoginAttempt(ipHash);
    const [row] = await getDb()
      .select({ success: loginAttempts.success })
      .from(loginAttempts)
      .where(eq(loginAttempts.id, first.id));
    expect(row?.success).toBe(false);

    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 2; i++) await startLoginAttempt(ipHash);
    // successes don't count toward the limit
    await markLoginSucceeded((await startLoginAttempt(ipHash)).id);

    expect((await startLoginAttempt(ipHash)).retryAfterSeconds).toBe(0);
    const wait = await checkRateLimit(ipHash);
    expect(wait).toBeGreaterThan(14 * 60);
    expect(wait).toBeLessThanOrEqual(15 * 60);
    expect((await startLoginAttempt(ipHash)).retryAfterSeconds).toBeGreaterThan(0);
  });

  it(`lets at most ${MAX_FAILED_ATTEMPTS} of many parallel attempts through`, async () => {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () => startLoginAttempt(parallelIpHash)),
    );
    const allowed = attempts.filter((attempt) => attempt.retryAfterSeconds === 0);
    // Often 0: when all insert before any counts, every one is refused. Safe, just strict.
    expect(allowed.length).toBeLessThanOrEqual(MAX_FAILED_ATTEMPTS);
  });
});
