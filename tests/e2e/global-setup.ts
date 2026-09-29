import mysql from "mysql2/promise";

/**
 * Each run makes one deliberate wrong login (UF-06), so a few runs within 15 minutes would hit the
 * real rate limit (5 failures per IP). Clear failed attempts first, and only on a local database.
 */
export default async function globalSetup() {
  const host = process.env.DATABASE_HOST ?? "";
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw new Error(
      `E2E tests only run against a local database (DATABASE_HOST=${host || "unset"}).`,
    );
  }

  const connection = await mysql.createConnection({
    host,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  try {
    await connection.execute("DELETE FROM login_attempts WHERE success = 0");
  } finally {
    await connection.end();
  }
}
