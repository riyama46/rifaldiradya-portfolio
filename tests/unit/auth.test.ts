import { beforeAll, describe, expect, it } from "vitest";
import { hashIp, newSessionToken, sha256 } from "@/lib/auth/crypto";
import { safeAdminNext } from "@/lib/auth/next-path";
import { hashPassword, verifyCredentials } from "@/lib/auth/password";
import {
  GLOBAL_MAX_FAILED_ATTEMPTS,
  MAX_FAILED_ATTEMPTS,
  retryAfterSeconds,
  WINDOW_MS,
} from "@/lib/auth/rate-limit";
import { parseAdminEnv } from "@/lib/env";
import { apiError, clientIp, isSameOrigin } from "@/lib/http/api";

describe("safeAdminNext (no open redirects)", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/projects/new", "/admin/projects/new"],
    ["/admin/projects/01JABC", "/admin/projects/01JABC"],
  ])("keeps %s", (input, expected) => {
    expect(safeAdminNext(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "/",
    "/work",
    "https://evil.com/admin",
    "//evil.com",
    "/admin//evil.com",
    "/\\evil.com",
    "/admin\\@evil.com",
    "/adminx",
    "/admin/login",
    "/admin/login?next=/admin",
    "javascript:alert(1)",
    "/admin/%2F%2Fevil.com",
  ])("falls back to /admin for %s", (input) => {
    expect(safeAdminNext(input)).toBe("/admin");
  });
});

describe("retryAfterSeconds", () => {
  const now = new Date("2026-09-29T10:00:00Z");
  const minutesAgo = (...minutes: number[]) =>
    minutes.map((m) => new Date(now.getTime() - m * 60 * 1000));

  it("is 0 below the failure limit", () => {
    expect(retryAfterSeconds(minutesAgo(4, 3, 2, 1), MAX_FAILED_ATTEMPTS, now)).toBe(0);
  });

  it("waits until the oldest failure leaves the 15-minute window", () => {
    expect(retryAfterSeconds(minutesAgo(5, 4, 3, 2, 1), MAX_FAILED_ATTEMPTS, now)).toBe(10 * 60);
  });

  it("with more failures than the limit, waits until enough have expired", () => {
    // 7 failures: unlocked only once 3 have expired, i.e. when the 3rd oldest (12 min ago) does.
    const failures = minutesAgo(14, 13, 12, 3, 2, 1, 0.5);
    expect(retryAfterSeconds(failures, MAX_FAILED_ATTEMPTS, now)).toBe(3 * 60);
  });

  it("never returns less than 1 second while limited", () => {
    const failures = [new Date(now.getTime() - WINDOW_MS + 10), ...minutesAgo(3, 2, 1, 0)];
    expect(retryAfterSeconds(failures, MAX_FAILED_ATTEMPTS, now)).toBe(1);
  });

  it("applies the global cap across IPs", () => {
    const nineteen = Array.from({ length: 19 }, (_, i) => minutesAgo(10 - i * 0.5)[0]);
    expect(retryAfterSeconds(nineteen, GLOBAL_MAX_FAILED_ATTEMPTS, now)).toBe(0);
    expect(
      retryAfterSeconds([...minutesAgo(11), ...nineteen], GLOBAL_MAX_FAILED_ATTEMPTS, now),
    ).toBe(4 * 60);
  });
});

describe("crypto helpers", () => {
  it("creates long, unique, URL-safe session tokens", () => {
    const a = newSessionToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newSessionToken()).not.toBe(a);
  });

  it("hashes IPs with the salt (never the raw IP)", () => {
    const one = hashIp("203.0.113.9", "salt-a".repeat(6));
    expect(one).toMatch(/^[0-9a-f]{64}$/);
    expect(one).not.toContain("203.0.113.9");
    expect(hashIp("203.0.113.9", "salt-b".repeat(6))).not.toBe(one);
    expect(sha256("x")).toBe(sha256("x"));
  });
});

describe("verifyCredentials", () => {
  let admin: { email: string; passwordHash: string };

  beforeAll(async () => {
    admin = {
      email: "Admin@Example.com",
      passwordHash: await hashPassword("correct horse battery"),
    };
  });

  it("accepts the right email (any case) and password", async () => {
    await expect(
      verifyCredentials({ email: " admin@example.com ", password: "correct horse battery" }, admin),
    ).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    await expect(
      verifyCredentials({ email: "admin@example.com", password: "wrong" }, admin),
    ).resolves.toBe(false);
  });

  it("rejects a wrong email even with the right password", async () => {
    await expect(
      verifyCredentials({ email: "someone@else.com", password: "correct horse battery" }, admin),
    ).resolves.toBe(false);
  });
});

describe("admin env password hash", () => {
  const base = { ADMIN_EMAIL: "admin@example.com", RATE_LIMIT_SALT: "s".repeat(32) };

  it("accepts the base64 form printed by npm run hash-password", async () => {
    const hash = await hashPassword("correct horse battery");
    const encoded = Buffer.from(hash).toString("base64");
    expect(encoded).not.toContain("$");
    expect(parseAdminEnv({ ...base, ADMIN_PASSWORD_HASH: encoded }).ADMIN_PASSWORD_HASH).toBe(hash);
  });

  it("still accepts a raw bcrypt hash", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(parseAdminEnv({ ...base, ADMIN_PASSWORD_HASH: hash }).ADMIN_PASSWORD_HASH).toBe(hash);
  });

  it("rejects anything else", () => {
    expect(() => parseAdminEnv({ ...base, ADMIN_PASSWORD_HASH: "not-a-hash" })).toThrow(
      /hash-password/,
    );
  });
});

describe("http helpers", () => {
  const request = (headers: Record<string, string>) =>
    new Request("https://rifaldiradya.com/api/admin/login", { method: "POST", headers });

  it("prefers X-Real-IP, then the last X-Forwarded-For entry", () => {
    expect(clientIp(request({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(request({ "x-forwarded-for": "1.1.1.1, 198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(request({}))).toBe("unknown");
  });

  it("ignores a spoofed first X-Forwarded-For entry", () => {
    const spoofed = request({ "x-forwarded-for": "6.6.6.6, 198.51.100.7" });
    expect(clientIp(spoofed)).not.toBe("6.6.6.6");
  });

  it("only accepts the site's own Origin", () => {
    const site = "https://rifaldiradya.com";
    expect(isSameOrigin(request({ origin: "https://rifaldiradya.com" }), site)).toBe(true);
    expect(isSameOrigin(request({ origin: "https://evil.com" }), site)).toBe(false);
    expect(isSameOrigin(request({}), site)).toBe(false);
  });

  it("uses the App Flow error shape and Retry-After", async () => {
    const response = apiError(429, "RATE_LIMITED", "Too many attempts.", { retryAfterSeconds: 60 });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.json()).toEqual({
      error: { code: "RATE_LIMITED", message: "Too many attempts.", retryAfterSeconds: 60 },
    });
  });
});
