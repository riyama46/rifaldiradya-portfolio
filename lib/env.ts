import { z } from "zod";

// docs/SDD.md section 9. Groups are validated on first use so builds and local dev work without
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

const adminSchema = z.object({
  ADMIN_EMAIL: z.email("must be an email address"),
  ADMIN_PASSWORD_HASH: z
    .string({ error: "is required" })
    .regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, "must be a bcrypt hash (npm run hash-password)"),
  RATE_LIMIT_SALT: z
    .string({ error: "is required" })
    .min(32, "must be at least 32 random characters"),
});

const cloudinarySchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: required(),
  CLOUDINARY_API_KEY: required(),
  CLOUDINARY_API_SECRET: required(),
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
export const parseCloudinaryEnv = (source: Source) => parse("Cloudinary", cloudinarySchema, source);
export const parseAnalyticsEnv = (source: Source) => parse("analytics", analyticsSchema, source);

function cached<T>(load: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= load());
}

export const siteEnv = cached(() => parseSiteEnv(process.env));
export const databaseEnv = cached(() => parseDatabaseEnv(process.env));
export const adminEnv = cached(() => parseAdminEnv(process.env));
export const cloudinaryEnv = cached(() => parseCloudinaryEnv(process.env));
export const analyticsEnv = cached(() => parseAnalyticsEnv(process.env));

/** Throws one error listing every missing/invalid group. Used at production server start. */
export function assertServerEnv(source: Source = process.env): void {
  const checks = [
    parseSiteEnv,
    parseDatabaseEnv,
    parseAdminEnv,
    parseCloudinaryEnv,
    parseAnalyticsEnv,
  ];
  const errors = checks.flatMap((check) => {
    try {
      check(source);
      return [];
    } catch (error) {
      return [(error as Error).message];
    }
  });
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
