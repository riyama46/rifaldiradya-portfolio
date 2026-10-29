import {
  bigint,
  boolean,
  char,
  customType,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  varchar,
} from "drizzle-orm/mysql-core";
import { ulid } from "ulid";

// docs/specs/SDD.md section 3. All datetimes are stored as UTC (the pool uses timezone "Z").
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
    // Nullable since v2.0.0 (D-21): internal projects have no URL; required only for case_action site.
    liveUrl: varchar("live_url", { length: 300 }),
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
    // Position 1…n, unique, maintained by lib/projects/mutations.ts (↑/↓ on S-11, new = 1).
    sortOrder: smallint("sort_order").notNull().default(1),
    // Deprecated v2.0.0, not read (D-22). Kept because columns are never dropped; use showOnHome.
    featured: boolean("featured").notNull().default(false),
    // v2.0.0 (CHANGE v2.0.0, Delta SDD section 3). Text fields are null until filled in the admin;
    // the publish rules live in lib/projects/validation.ts.
    group: varchar("group", { length: 12, enum: ["automation", "panasonic", "web", "ai"] })
      .notNull()
      .default("web"),
    metaEn: varchar("meta_en", { length: 40 }),
    metaId: varchar("meta_id", { length: 40 }),
    sideEn: varchar("side_en", { length: 20 }),
    sideId: varchar("side_id", { length: 20 }),
    caseIsEn: varchar("case_is_en", { length: 220 }),
    caseIsId: varchar("case_is_id", { length: 220 }),
    caseDidEn: json("case_did_en").$type<string[]>(),
    caseDidId: json("case_did_id").$type<string[]>(),
    statusEn: varchar("status_en", { length: 40 }),
    statusId: varchar("status_id", { length: 40 }),
    caseAction: varchar("case_action", { length: 12, enum: ["site", "walkthrough", "none"] })
      .notNull()
      .default("site"),
    // v2.2.0 (D-42): optional demo video and code repository links, https only, shown beside the
    // case button. Independent of case_action, so one project can show both.
    demoUrl: varchar("demo_url", { length: 300 }),
    repoUrl: varchar("repo_url", { length: 300 }),
    visualType: varchar("visual_type", { length: 10, enum: ["screenshot", "number"] })
      .notNull()
      .default("screenshot"),
    cardNumber: varchar("card_number", { length: 12 }),
    cardCaptionEn: varchar("card_caption_en", { length: 60 }),
    cardCaptionId: varchar("card_caption_id", { length: 60 }),
    // Selected work on the homepage (D-18): at most 5 rows true, drafts included.
    showOnHome: boolean("show_on_home").notNull().default(false),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("projects_public_order_idx").on(table.published, table.sortOrder, table.createdAt),
    index("projects_home_order_idx").on(table.published, table.showOnHome, table.sortOrder),
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

// Project thumbnails live in MySQL (DECISIONS 2026-09-29): one row per upload, one variant row per
// width. Images are immutable; replacing a thumbnail uploads a new image and deletes the old one.
const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

export const images = mysqlTable("images", {
  id: varchar("id", { length: 26 })
    .primaryKey()
    .$defaultFn(() => ulid()),
  format: varchar("format", { length: 4, enum: ["webp", "jpeg"] }).notNull(),
  // Size of the largest variant; the thumbnail width/height stored on a project.
  width: smallint("width", { unsigned: true }).notNull(),
  height: smallint("height", { unsigned: true }).notNull(),
  createdAt: createdAt(),
});

export const imageVariants = mysqlTable(
  "image_variants",
  {
    imageId: varchar("image_id", { length: 26 })
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    width: smallint("width", { unsigned: true }).notNull(),
    height: smallint("height", { unsigned: true }).notNull(),
    bytes: mediumBlob("bytes").notNull(),
  },
  (table) => [primaryKey({ columns: [table.imageId, table.width] })],
);

// Small key/value settings edited in the admin (S-14): the profile photo image id and, since
// v2.0.0, availability_on ('1' | '0').
export const siteSettings = mysqlTable("site_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: varchar("value", { length: 255 }),
  updatedAt: updatedAt(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type Image = typeof images.$inferSelect;
