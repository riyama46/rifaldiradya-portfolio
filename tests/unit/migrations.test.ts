import { readMigrationFiles } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import { loadMigrations } from "@/lib/db/migrate";

describe("embedded migrations", () => {
  it("match /drizzle exactly (run `npm run db:embed` if this fails)", () => {
    expect(loadMigrations()).toEqual(readMigrationFiles({ migrationsFolder: "drizzle" }));
  });

  it("are ordered by creation time", () => {
    const times = loadMigrations().map((migration) => migration.folderMillis);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
