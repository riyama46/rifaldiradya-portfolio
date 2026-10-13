import { z } from "zod";

// docs/specs/SDD.md section 9. Groups are validated on first use so builds and local dev work without
// every secret; instrumentation.ts validates all required groups when the production server starts.

type Source = Record<string, string | undefined>;

const required = () => z.string({ error: "is required" }).trim().min(1, "is required");

const siteSchema = z.object({
  SITE_URL: z
    .url({ protocol: /^https?$/, error: "must be a full URL, e.g. https://rifaldiradya.com" })
    .refine((value) => !value.endsWith("/"), "must not end with /"),
});

const databaseSchema = z.object({
  DATABASE_HOST: required().refine(
    (value) => value !== "localhost",
    "use 127.0.0.1, not localhost (Node may resolve localhost to IPv6 ::1)",
  ),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DATABASE_NAME: required(),
  DATABASE_USER: required(),
  DATABASE_PASSWORD: required(),
});

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/** `npm run hash-password` prints the bcrypt hash base64-encoded: `$` in .env files and some host
 * panels is treated as a variable reference and would silently corrupt a raw `$2b$…` hash. */
function decodePasswordHash(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("$2") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
}

const adminSchema = z.object({
  ADMIN_EMAIL: z.email("must be an email address"),
  ADMIN_PASSWORD_HASH: z
    .string({ error: "is required" })
    .transform(decodePasswordHash)
    .pipe(z.string().regex(BCRYPT_HASH, "must come from npm run hash-password")),
  RATE_LIMIT_SALT: z
    .string({ error: "is required" })
    .min(32, "must be at least 32 random characters"),
});

const analyticsSchema = z.object({
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .pipe(
      z
        .string()
        .regex(/^G-[A-Z0-9]+$/, "must look like G-XXXXXXXXXX")
        .optional(),
    )
    .optional(),
});

function parse<S extends z.ZodType>(group: string, schema: S, source: Source): z.infer<S> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  // Only variable names and rule messages; never echo values (they may be secrets).
  const problems = result.error.issues
    .map((issue) => `${issue.path.join(".")} ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid ${group} environment variables: ${problems}. See .env.example.`);
}

export const parseSiteEnv = (source: Source) => parse("site", siteSchema, source);
export const parseDatabaseEnv = (source: Source) => parse("database", databaseSchema, source);
export const parseAdminEnv = (source: Source) => parse("admin", adminSchema, source);
export const parseAnalyticsEnv = (source: Source) => parse("analytics", analyticsSchema, source);

function cached<T>(load: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= load());
}

export const siteEnv = cached(() => parseSiteEnv(process.env));
export const databaseEnv = cached(() => parseDatabaseEnv(process.env));
export const adminEnv = cached(() => parseAdminEnv(process.env));
export const analyticsEnv = cached(() => parseAnalyticsEnv(process.env));

const groupParsers = {
  site: parseSiteEnv,
  database: parseDatabaseEnv,
  admin: parseAdminEnv,
  analytics: parseAnalyticsEnv,
};

export type EnvGroup = keyof typeof groupParsers;

// Groups the public site cannot run without: a problem here stops the server with a clear message.
// Analytics is optional (empty = off) but a wrong ID is still rejected.
export const REQUIRED_AT_START: readonly EnvGroup[] = ["site", "database", "analytics"];

// Admin-only groups: a problem is logged at start and only that feature is disabled, so a typo in
// an admin secret never takes the public site down (SDD NFR "Ketersediaan").
export const CHECKED_AT_START: readonly EnvGroup[] = ["admin"];

/** Error messages for the given groups; empty when all are valid. Never includes values. */
export function envProblems(groups: readonly EnvGroup[], source: Source = process.env): string[] {
  return groups.flatMap((group) => {
    try {
      groupParsers[group](source);
      return [];
    } catch (error) {
      return [(error as Error).message];
    }
  });
}

/** Throws one error listing every missing/invalid group. Used at production server start. */
export function assertServerEnv(
  source: Source = process.env,
  groups: readonly EnvGroup[] = REQUIRED_AT_START,
): void {
  const errors = envProblems(groups, source);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
