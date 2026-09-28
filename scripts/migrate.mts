// Applies SQL migrations from /drizzle (CI and manual use). Production servers run the same
// migrations automatically on start via instrumentation.ts.
// Runs with plain `node` (Node 24 strips TypeScript types), so imports are relative with .ts.
//
//   node scripts/migrate.mts           → if the DB is unreachable, warn and exit 0
//   node scripts/migrate.mts --strict  → npm run db:migrate / CI; any failure exits 1
import { existsSync } from "node:fs";
import { isUnreachable, runMigrations } from "../lib/db/migrate.ts";
import { parseDatabaseEnv } from "../lib/env.ts";

const strict = process.argv.includes("--strict");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

try {
  await runMigrations(parseDatabaseEnv(process.env));
  console.log("[migrate] database is up to date");
} catch (error) {
  if (!strict && isUnreachable(error)) {
    const code = (error as NodeJS.ErrnoException).code;
    console.warn(`[migrate] database unreachable (${code}); skipping migrations for now`);
    process.exit(0);
  }
  console.error("[migrate] failed:", (error as Error).message);
  process.exit(1);
}
