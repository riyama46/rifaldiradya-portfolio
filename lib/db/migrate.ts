import { join } from "node:path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql, { type RowDataPacket } from "mysql2/promise";
import type { parseDatabaseEnv } from "../env";

// Shared by instrumentation.ts (every production server start) and scripts/migrate.mts (CI/manual).
// No path aliases here: the script runs with plain `node`.

type DatabaseEnv = ReturnType<typeof parseDatabaseEnv>;

const LOCK_NAME = "rifaldiradya_portfolio_migrations";
const LOCK_TIMEOUT_SECONDS = 60;
const UNREACHABLE_CODES = new Set(["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"]);

/** True when the database could not be reached at all (as opposed to a real migration error). */
export function isUnreachable(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code !== undefined && UNREACHABLE_CODES.has(code);
}

/**
 * Applies pending SQL migrations from /drizzle. Idempotent. A MySQL named lock makes concurrent
 * callers (several server processes starting at once) run one after another instead of racing.
 */
export async function runMigrations(env: DatabaseEnv): Promise<void> {
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
    const [rows] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK(?, ?) AS locked", [
      LOCK_NAME,
      LOCK_TIMEOUT_SECONDS,
    ]);
    if (rows[0]?.locked !== 1) {
      throw new Error(`could not acquire the migration lock within ${LOCK_TIMEOUT_SECONDS}s`);
    }

    try {
      await migrate(drizzle(connection), {
        migrationsFolder: join(process.cwd(), "drizzle"),
      });
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    }
  } finally {
    await connection.end();
  }
}
