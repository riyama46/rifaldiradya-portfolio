import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { databaseEnv } from "@/lib/env";
import * as schema from "./schema";

function createDatabase() {
  const env = databaseEnv();
  const pool = mysql.createPool({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    connectionLimit: 5,
    timezone: "Z",
    charset: "UTF8MB4_UNICODE_CI",
  });
  return drizzle(pool, { schema, mode: "default" });
}

type Database = ReturnType<typeof createDatabase>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { portfolioDb?: Database };

/** Only lib/projects and lib/auth may call this (AGENTS.md). Connects lazily on first use. */
export function getDb(): Database {
  globalForDb.portfolioDb ??= createDatabase();
  return globalForDb.portfolioDb;
}
