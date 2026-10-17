import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { loadMigrations, runMigrations } from "@/lib/db/migrate";
import { parseDatabaseEnv } from "@/lib/env";
import { toPublicProject } from "@/lib/projects/public";
import { projectInputSchema } from "@/lib/projects/validation";
import { toProjectInput } from "@/lib/projects/mutations";

// AC-14 (CHANGE v2.0.0, D-21): migration 0004 on a v1 database. Runs in its own database so the
// main one is never rebuilt. It is created once with the root account: in CI by the step "Create
// the migration test database", locally with
//   docker compose exec db mysql -uroot -proot_local_only -e "CREATE DATABASE portfolio_migtest;
//     GRANT ALL ON portfolio_migtest.* TO 'portfolio'@'%';"
const env = parseDatabaseEnv(process.env);
const MIGRATION_DB = process.env.MIGRATION_TEST_DATABASE ?? `${env.DATABASE_NAME}_migtest`;
const target = { ...env, DATABASE_NAME: MIGRATION_DB };

const V1_MIGRATIONS = 4; // 0000–0003 = the schema live in v1.0.1

let connection: Connection;

const query = async <T extends RowDataPacket>(sql: string, values: unknown[] = []) =>
  (await connection.query<T[]>(sql, values))[0];

beforeAll(async () => {
  connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: MIGRATION_DB,
    timezone: "Z",
  });
  // Start from an empty database every run.
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  const tables = await query<RowDataPacket>(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
    [MIGRATION_DB],
  );
  for (const { name } of tables) await connection.query(`DROP TABLE \`${name}\``);
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
});

afterAll(async () => {
  await connection?.end();
});

describe("migration 0004 on a v1 database (AC-14)", () => {
  it("builds the v1 schema and fills it with v1 rows", async () => {
    await runMigrations(target, loadMigrations().slice(0, V1_MIGRATIONS));
    const insert = (id: string, slug: string, featured: number, published: number, order: number) =>
      connection.query(
        `INSERT INTO projects (id, slug, title_en, title_id, summary_en, summary_id, live_url, tags,
           thumbnail_url, thumbnail_width, thumbnail_height, thumbnail_alt_en, thumbnail_alt_id,
           sort_order, featured, published, created_at, updated_at)
         VALUES (?, ?, 'Café ☕', 'Kafe', 'From v1.', 'Dari v1.', 'https://example.com', '["Next.js"]',
           '/media/x.webp', 1600, 1000, 'a', 'a', ?, ?, ?, NOW(3), NOW(3))`,
        [id, slug, order, featured, published],
      );
    await insert("01JV1000000000000000000001", "hero-live", 1, 1, 1);
    await insert("01JV1000000000000000000002", "grid-live", 0, 1, 2);
    await insert("01JV1000000000000000000003", "featured-draft", 1, 0, 3);
    const [{ count }] = await query<RowDataPacket>("SELECT COUNT(*) AS count FROM projects");
    expect(count).toBe(3);
  });

  it("adds the v2 columns with their defaults and keeps every v1 value", async () => {
    await runMigrations(target);
    const rows = await query<RowDataPacket>(
      `SELECT slug, title_en, live_url, featured, published, \`group\`, case_action, visual_type,
         show_on_home, meta_en, case_did_en, card_number
       FROM projects ORDER BY sort_order`,
    );
    expect(rows).toEqual([
      expect.objectContaining({ slug: "hero-live", featured: 1, show_on_home: 1 }),
      expect.objectContaining({ slug: "grid-live", featured: 0, show_on_home: 0 }),
      // Drafts never start in Selected work, even if they were featured.
      expect.objectContaining({ slug: "featured-draft", featured: 1, show_on_home: 0 }),
    ]);
    for (const row of rows) {
      expect(row).toMatchObject({
        title_en: "Café ☕",
        live_url: "https://example.com",
        group: "web",
        case_action: "site",
        visual_type: "screenshot",
        meta_en: null,
        case_did_en: null,
        card_number: null,
      });
    }
  });

  it("makes live_url nullable (D-21), with utf8mb4_unicode_ci text and the new index", async () => {
    const columns = await query<RowDataPacket>(
      `SELECT COLUMN_NAME AS name, IS_NULLABLE AS nullable, COLLATION_NAME AS collation
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND DATA_TYPE = 'varchar'`,
      [MIGRATION_DB],
    );
    expect(columns.find((c) => c.name === "live_url")?.nullable).toBe("YES");
    for (const column of columns) expect(column.collation).toBe("utf8mb4_unicode_ci");

    const index = await query<RowDataPacket>(
      `SELECT COLUMN_NAME AS name FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND INDEX_NAME = 'projects_home_order_idx'
       ORDER BY SEQ_IN_INDEX`,
      [MIGRATION_DB],
    );
    expect(index.map((c) => c.name)).toEqual(["published", "show_on_home", "sort_order"]);

    await connection.query("UPDATE projects SET live_url = NULL WHERE slug = 'featured-draft'");
  });

  it("old rows are valid v2 data: public as before (E-27), drafts still save", async () => {
    const db = drizzle(connection, { schema, mode: "default" });
    const rows = await db.select().from(schema.projects).orderBy(schema.projects.sortOrder);

    const live = toPublicProject(rows[0], "en");
    expect(live).toMatchObject({ title: "Café ☕", caseAction: "site", showOnHome: true });
    expect(live.visual?.type).toBe("screenshot");

    // The draft without a URL needs a URL or another button; with walkthrough it saves.
    const draft = toProjectInput(rows[2]);
    expect(projectInputSchema.safeParse(draft).success).toBe(false);
    expect(projectInputSchema.safeParse({ ...draft, case_action: "walkthrough" }).success).toBe(
      true,
    );
  });

  it("is idempotent: running again applies nothing and records each migration once", async () => {
    await runMigrations(target);
    await runMigrations(target);
    const [{ count }] = await query<RowDataPacket>(
      "SELECT COUNT(*) AS count FROM __drizzle_migrations",
    );
    expect(count).toBe(loadMigrations().length);
  });
});
