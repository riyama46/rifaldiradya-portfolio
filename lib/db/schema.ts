import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  smallint,
  varchar,
} from "drizzle-orm/mysql-core";
import { ulid } from "ulid";

// docs/SDD.md section 3. All datetimes are stored as UTC (the pool uses timezone "Z").
// Column builders are created per table; sharing one builder instance between tables is unsafe.
const createdAt = () =>
  datetime("created_at", { fsp: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  datetime("updated_at", { fsp: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

export const projects = mysqlTable(
  "projects",
  {
    id: varchar("id", { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    titleEn: varchar("title_en", { length: 80 }).notNull(),
    titleId: varchar("title_id", { length: 80 }).notNull(),
    summaryEn: varchar("summary_en", { length: 160 }).notNull(),
    summaryId: varchar("summary_id", { length: 160 }).notNull(),
    liveUrl: varchar("live_url", { length: 300 }).notNull(),
    tags: json("tags")
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    thumbnailPublicId: varchar("thumbnail_public_id", { length: 255 }),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    thumbnailWidth: int("thumbnail_width"),
    thumbnailHeight: int("thumbnail_height"),
    thumbnailAltEn: varchar("thumbnail_alt_en", { length: 140 }),
    thumbnailAltId: varchar("thumbnail_alt_id", { length: 140 }),
    sortOrder: smallint("sort_order").notNull().default(100),
    featured: boolean("featured").notNull().default(false),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("projects_public_order_idx").on(table.published, table.sortOrder, table.createdAt),
  ],
);

export const adminSessions = mysqlTable(
  "admin_sessions",
  {
    id: varchar("id", { length: 26 })
      .primaryKey()
      .$defaultFn(() => ulid()),
    // SHA-256 of the session token; the raw token only lives in the httpOnly cookie.
    tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
    createdAt: createdAt(),
    expiresAt: datetime("expires_at", { fsp: 3, mode: "date" }).notNull(),
    lastSeenAt: datetime("last_seen_at", { fsp: 3, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    userAgent: varchar("user_agent", { length: 255 }),
  },
  (table) => [index("admin_sessions_expires_idx").on(table.expiresAt)],
);

export const loginAttempts = mysqlTable(
  "login_attempts",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    // SHA-256 of IP + RATE_LIMIT_SALT; raw IPs are never stored.
    ipHash: char("ip_hash", { length: 64 }).notNull(),
    success: boolean("success").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("login_attempts_ip_created_idx").on(table.ipHash, table.createdAt)],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
