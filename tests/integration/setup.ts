import { afterAll } from "vitest";
import { getDb } from "@/lib/db/client";

// Safety net: these tests insert and delete rows. Never let them touch a remote (production) DB.
const host = process.env.DATABASE_HOST ?? "";
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error(
    `Integration tests only run against a local database (DATABASE_HOST=${host || "unset"}).`,
  );
}

afterAll(async () => {
  await getDb().$client.end();
  // getDb() caches the pool on globalThis; drop it so a later file in the same worker reconnects.
  delete (globalThis as { portfolioDb?: unknown }).portfolioDb;
});
