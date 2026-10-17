import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import type { MigrationConfig, MigrationMeta } from "drizzle-orm/migrator";
import mysql, { type RowDataPacket } from "mysql2/promise";
import type { parseDatabaseEnv } from "../env";
import { embeddedMigrations } from "./migrations.generated.ts";

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
 * Same shape and hashes as drizzle's readMigrationFiles(), but from the bundled copy of /drizzle,
 * because the production host does not ship that folder (tests/unit/migrations.test.ts).
 */
export function loadMigrations(): MigrationMeta[] {
  return embeddedMigrations.map((migration) => ({
    sql: migration.sql.split("--> statement-breakpoint"),
    bps: migration.breakpoints,
    folderMillis: migration.when,
    hash: createHash("sha256").update(migration.sql).digest("hex"),
  }));
}

// drizzle's own migrate() is `db.dialect.migrate(readMigrationFiles(config), db.session, config)`;
// dialect and session exist at runtime but are not part of the public types.
type MigratableDatabase = {
  dialect: { migrate(m: MigrationMeta[], s: unknown, c: MigrationConfig): Promise<void> };
  session: unknown;
};

/**
 * Applies pending migrations. Idempotent. A MySQL named lock makes concurrent callers (several
 * server processes starting at once) run one after another instead of racing. `migrations` is only
 * narrowed by tests (a v1 database built from the first migrations, AC-14).
 */
export async function runMigrations(
  env: DatabaseEnv,
  migrations: MigrationMeta[] = loadMigrations(),
): Promise<void> {
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
      const db = drizzle(connection) as unknown as MigratableDatabase;
      await db.dialect.migrate(migrations, db.session, { migrationsFolder: "(embedded)" });
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    }
  } finally {
    await connection.end();
  }
}
