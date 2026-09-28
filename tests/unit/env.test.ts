import { describe, expect, it } from "vitest";
import {
  assertServerEnv,
  parseAdminEnv,
  parseAnalyticsEnv,
  parseCloudinaryEnv,
  parseDatabaseEnv,
  parseSiteEnv,
} from "@/lib/env";

const BCRYPT = "$2b$12$" + "a".repeat(53);

const valid = {
  SITE_URL: "https://rifaldiradya.com",
  DATABASE_HOST: "127.0.0.1",
  DATABASE_PORT: "3306",
  DATABASE_NAME: "portfolio",
  DATABASE_USER: "portfolio",
  DATABASE_PASSWORD: "secret-db-password",
  ADMIN_EMAIL: "rifaldi@rifaldiradya.com",
  ADMIN_PASSWORD_HASH: BCRYPT,
  RATE_LIMIT_SALT: "x".repeat(32),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "123",
  CLOUDINARY_API_SECRET: "super-secret-cloudinary",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123",
};

describe("site env", () => {
  it("accepts a full URL without a trailing slash", () => {
    expect(parseSiteEnv(valid).SITE_URL).toBe("https://rifaldiradya.com");
  });

  it.each(["rifaldiradya.com", "https://rifaldiradya.com/", "ftp://rifaldiradya.com"])(
    "rejects %s",
    (SITE_URL) => {
      expect(() => parseSiteEnv({ SITE_URL })).toThrow(/SITE_URL/);
    },
  );
});

describe("database env", () => {
  it("parses values and defaults the port to 3306", () => {
    const env = parseDatabaseEnv({ ...valid, DATABASE_PORT: undefined });
    expect(env.DATABASE_PORT).toBe(3306);
    expect(env.DATABASE_HOST).toBe("127.0.0.1");
  });

  it("coerces the port to a number", () => {
    expect(parseDatabaseEnv({ ...valid, DATABASE_PORT: "3307" }).DATABASE_PORT).toBe(3307);
  });

  it("rejects localhost with a hint to use 127.0.0.1", () => {
    expect(() => parseDatabaseEnv({ ...valid, DATABASE_HOST: "localhost" })).toThrow(
      /127\.0\.0\.1/,
    );
  });

  it("names every missing variable", () => {
    expect(() => parseDatabaseEnv({})).toThrow(
      /DATABASE_HOST.*DATABASE_NAME.*DATABASE_USER.*DATABASE_PASSWORD/,
    );
  });

  it("treats whitespace-only values as missing", () => {
    expect(() => parseDatabaseEnv({ ...valid, DATABASE_PASSWORD: "   " })).toThrow(
      /DATABASE_PASSWORD is required/,
    );
  });
});

describe("admin env", () => {
  it("accepts a bcrypt hash and a long salt", () => {
    expect(parseAdminEnv(valid).ADMIN_EMAIL).toBe("rifaldi@rifaldiradya.com");
  });

  it("rejects a plain-text password", () => {
    expect(() => parseAdminEnv({ ...valid, ADMIN_PASSWORD_HASH: "hunter2" })).toThrow(
      /hash-password/,
    );
  });

  it("rejects a short salt", () => {
    expect(() => parseAdminEnv({ ...valid, RATE_LIMIT_SALT: "short" })).toThrow(/32/);
  });
});

describe("cloudinary env", () => {
  it("requires all three values", () => {
    expect(() => parseCloudinaryEnv({ ...valid, CLOUDINARY_API_SECRET: "" })).toThrow(
      /CLOUDINARY_API_SECRET/,
    );
  });
});

describe("analytics env", () => {
  it("is optional; empty means disabled", () => {
    expect(parseAnalyticsEnv({}).NEXT_PUBLIC_GA_MEASUREMENT_ID).toBeUndefined();
    expect(
      parseAnalyticsEnv({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "" }).NEXT_PUBLIC_GA_MEASUREMENT_ID,
    ).toBeUndefined();
  });

  it("validates the measurement id format when set", () => {
    expect(() => parseAnalyticsEnv({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "UA-123" })).toThrow(/G-/);
  });
});

describe("assertServerEnv", () => {
  it("passes with a complete environment", () => {
    expect(() => assertServerEnv(valid)).not.toThrow();
  });

  it("reports every broken group at once", () => {
    expect(() => assertServerEnv({ ...valid, SITE_URL: "", CLOUDINARY_API_KEY: "" })).toThrow(
      /site[\s\S]*Cloudinary/,
    );
  });

  it("never includes secret values in error messages", () => {
    const broken = { ...valid, SITE_URL: "", ADMIN_PASSWORD_HASH: "plain-secret-value" };
    try {
      assertServerEnv(broken);
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      for (const secret of [
        "plain-secret-value",
        "secret-db-password",
        "super-secret-cloudinary",
      ]) {
        expect(message).not.toContain(secret);
      }
    }
  });
});
