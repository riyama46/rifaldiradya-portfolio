// Applies SQL migrations from /drizzle. Idempotent: already-applied migrations are skipped.
// Runs with plain `node` (Node 24 strips TypeScript types), so imports are relative with .ts.
//
//   node scripts/migrate.mts           → used by `npm start`; if the DB is unreachable, warn and exit 0
//                                        so the static site can still start (SDD NFR "Ketersediaan").
//   node scripts/migrate.mts --strict  → CI; any failure exits 1.
import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { parseDatabaseEnv } from "../lib/env.ts";

const UNREACHABLE = new Set(["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"]);
const strict = process.argv.includes("--strict");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  const env = parseDatabaseEnv(process.env);
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    timezone: "Z",
    multipleStatements: true,
    connectTimeout: 10_000,
  });

  try {
    await migrate(drizzle(connection), { migrationsFolder: "./drizzle" });
    console.log("[migrate] database is up to date");
  } finally {
    await connection.end();
  }
}

main().catch((error: NodeJS.ErrnoException) => {
  if (!strict && error.code && UNREACHABLE.has(error.code)) {
    console.warn(`[migrate] database unreachable (${error.code}); skipping migrations for now`);
    process.exit(0);
  }
  console.error("[migrate] failed:", error.message);
  process.exit(1);
});
