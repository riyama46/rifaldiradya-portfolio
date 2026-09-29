import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { sha256 } from "@/lib/auth/crypto";
import { checkRateLimit, MAX_FAILED_ATTEMPTS, recordLoginAttempt } from "@/lib/auth/rate-limit";
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

afterAll(async () => {
  await getDb().delete(adminSessions).where(eq(adminSessions.userAgent, userAgent));
  await getDb().delete(loginAttempts).where(eq(loginAttempts.ipHash, ipHash));
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
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) await recordLoginAttempt(ipHash, false);
    await recordLoginAttempt(ipHash, true); // successes don't count toward the limit

    await recordLoginAttempt(ipHash, false);
    const wait = await checkRateLimit(ipHash);
    expect(wait).toBeGreaterThan(14 * 60);
    expect(wait).toBeLessThanOrEqual(15 * 60);
  });
});
