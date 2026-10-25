---
doc: SDD
app: rifaldiradya.com
tier: full
version: 2.1.0
status: current
last_updated: 2026-10-22
last_change: changes/archive/2026-10-22-v2.1.0-pointer-layer
---

# SDD — rifaldiradya.com v2

Sep 27, 2026 · @Pal

> **v2.0.0 (Oct 18, 2026).** Updated: Archivo font (section 2), v2 project schema + migration `0004` and the 640 avatar (3), v2 components (4), `<em>`/`<s>` rich text and Selected work rendering (5), mailto + https `live_url` (6), v2 SEO/analytics (7), two-layer tokens + theme + scroll-driven motion (8), v2 `site-config` (9), v2 release & rollback with DB restore (10), v2 testing (11), tasks T-23..T-33 (12), AGENTS.md (13). Architecture, database, auth and deploy do not change. Decisions D-01..D-30 in `docs/decisions/DECISIONS.md`.

## 1. Architecture summary

v1 is **one Next.js app** running on Hostinger Business (Node.js web app), using **Hostinger's built-in MySQL** for data and images (DECISIONS 2026-09-29: images moved from the Cloudinary plan to MySQL). Public pages are rendered statically and only rebuilt when the admin saves, so the site stays fast and still shows while the database has problems.

&#91;embedded content: v1 architecture · 1 Node.js app, 1 database, 2 external services\]

Project images are served from `/media/…` with a 1-year cache (`immutable`), so after the first request they are served by the Hostinger CDN and the browser, not MySQL. GA4 loads in the visitor's browser after consent.

**Key decisions**

| # | Decision | Short reason |
| --- | --- | --- |
| K1 | One repo, one Next.js app (public + admin + API) | The fewest moving parts for 1 person with 5–10 hours/week |
| K2 | Hostinger MySQL, not external Postgres | Already in the plan, local connection, Hostinger backups, no extra vendor that can pause |
| K3 | Images stored in MySQL (compressed in the admin browser: 16:10, 4 WebP widths), served through `/media` with a long cache | Safe from redeploys (not the filesystem), no third-party vendor, ~300–500 KB per project (approved by Pal, Sep 29, 2026) |
| K4 | Static public pages + on-demand revalidation | Maximum performance and resilient to DB outages |
| K5 | Minimal home-made auth (1 admin, session in the DB) | No third-party auth service needed for 1 user |
| K6 | No native dependencies (bcryptjs, not native argon2/bcrypt; images compressed in the admin browser, not sharp on the server) | Lowers the risk of a failed build on Hostinger |

## 2. Final tech stack

The stack was picked with one main criterion: **few moving parts, no native builds, and runs on Hostinger Node.js without tricks**. Versions are pinned in `package.json`; minor upgrades only through a separate PR.

| Layer | Choice | Version | Reason |
| --- | --- | --- | --- |
| Runtime | Node.js | 24 LTS (`engines: ">=24 <25"`) | Supported by Hostinger (18/20/22/24); longest LTS line |
| Framework | Next.js App Router | 16.3.x, latest patch | Current stable release; a 16.3.7 security release is scheduled for Sep 30, 2026, adopt it as soon as it ships. Production build `next build --webpack` (Turbopack fails to process CSS on the Hostinger build server, see DECISIONS); `next dev` stays on Turbopack. |
| UI | React | 19.x (follows Next.js) | — |
| Language | TypeScript strict | 5.x | Stable; TypeScript 7 not used in v1 |
| Styling | Tailwind CSS v4 + CSS variables | 4.x | The PRD section 8 theme tokens become CSS variables (two layers, section 8) |
| Font | `next/font/google` (self-hosted at build): Archivo (`subsets: ['latin','latin-ext']`, `display: 'swap'`, `variable: '--font-archivo'`, normal + italic variable files) | — | woff2, no runtime request to Google; one family (D-03) |
| Database | Hostinger MySQL | version from hPanel | See section 3 |
| ORM & migrations | Drizzle ORM + `mysql2` + drizzle-kit | latest stable | Light, typed, migrations are SQL files that can be run by hand in phpMyAdmin if needed |
| Validation | Zod | stable 3.x/4.x | One schema used by client and server |
| Password | `bcryptjs` | latest | Pure JS, needs no native compilation during the Hostinger build |
| Images | Canvas API in the admin browser (resize + WebP) + MySQL table + custom `next/image` loader to `/media` | — | No extra dependency; no `sharp` on the server |
| i18n | JSON dictionaries + own helpers (no i18n library) | — | Only 2 languages & few strings; avoids library middleware that auto-redirects by language (forbidden by App Flow G1) |
| Analytics | GA4 via `next/script` + Consent Mode v2 | — | Default denied before consent |
| Tests | Vitest (unit) + Playwright (e2e smoke) | latest | Enough for validation, utils and the main flows |
| Code quality | ESLint (Next.js config) + Prettier | — | — |
| Package manager | npm + `package-lock.json` | — | The default the Hostinger pipeline recognizes |

Not used: headless CMS, NextAuth/Auth.js, Prisma, state management libraries, heavy UI kits, animation libraries.

## 3. Database & image storage

**Decision: Hostinger's built-in MySQL for data and images.** (Original plan: Cloudinary for images; replaced Sep 29, 2026, see DECISIONS.)

| Database option | Pros | Cons | Result |
| --- | --- | --- | --- |
| Hostinger MySQL | Included in the Business plan; local connection from an app in the same account without Remote MySQL; Hostinger backups; no new vendor | MySQL only; access from a laptop during dev needs Remote MySQL or a local DB | **Chosen** |
| Supabase (Postgres) | One-click integration in Hostinger, has auth & storage | Extra vendor; free tier projects can be paused when inactive, and a portfolio site rarely writes data | No |
| Neon/other Postgres | Serverless Postgres | Extra vendor, cold start, no real gain for 1 small table | No |

Hostinger states that it only offers MySQL on shared/managed plans, and a Node.js app in the same account connects locally. Use host `127.0.0.1`, not `localhost`, because Node.js may resolve `localhost` to IPv6 `::1`, which the database user rejects ([Hostinger docs](https://docs.hostinger.com/websites/databases), [MySQL + Node.js guide](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)).

**Local development:** local MySQL 8.4 via Docker (`docker compose up -d db`, config in `docker-compose.yml`, port bound to `127.0.0.1` only) with the same schema. The production database is never used for development. Migrations also run in CI against a MySQL 8.4 service (T-05), so they stay tested even when the local machine has no Docker yet.

### Schema

| Table | Columns | Notes |
| --- | --- | --- |
| `projects` | `id` varchar(26) PK (cuid2/ulid) · `slug` varchar(100) unique · `title_en`, `title_id` varchar(80) · `group` varchar(12) default `'web'` · `meta_en`, `meta_id` varchar(40) null · `side_en`, `side_id` varchar(20) null · `summary_en`, `summary_id` varchar(160) · `show_on_home` boolean default false · `case_is_en`, `case_is_id` varchar(220) null · `case_did_en`, `case_did_id` JSON null · `tags` JSON (string array, max. 6) · `status_en`, `status_id` varchar(40) null · `case_action` varchar(12) default `'site'` · `live_url` varchar(300) **null** (D-21) · `visual_type` varchar(10) default `'screenshot'` · `thumbnail_public_id` varchar(255) null · `thumbnail_url` varchar(500) null · `thumbnail_width`, `thumbnail_height` int null · `thumbnail_alt_en`, `thumbnail_alt_id` varchar(140) null · `card_number` varchar(12) null · `card_caption_en`, `card_caption_id` varchar(60) null · `sort_order` smallint default 1 (position 1…n, unique, kept by `lib/projects/mutations.ts`) · `featured` boolean (**deprecated in v2.0.0, not read/written**, D-22) · `published` boolean default false · `created_at`, `updated_at` datetime(3) UTC | Indexes: (`published`, `sort_order`, `created_at`) and (`published`, `show_on_home`, `sort_order`). Charset `utf8mb4`, collation `utf8mb4_unicode_ci`. |
| `admin_sessions` | `id` varchar(26) PK · `token_hash` char(64) unique (SHA-256 of the token) · `created_at` · `expires_at` · `last_seen_at` · `user_agent` varchar(255) | The real token only lives in the cookie; the DB stores the hash. Expired sessions are cleaned up at login. |
| `site_settings` | `key` varchar(50) PK · `value` varchar(255) null · `updated_at` | Small settings from the admin (key-value table, no migration per key): `profile_photo` = image id (S-14), `availability_on` = `'1'`/`'0'` (default on when missing). Both are saved in one transaction by API-09 (`saveProfileSettings()`). |
| `images` / `image_variants` | see "Images (MySQL)" below | Project images (16:10) and the profile photo (1:1). |
| `login_attempts` | `id` bigint PK auto · `ip_hash` char(64) · `success` boolean · `created_at` | For the 5 failures / 15 minutes / IP rate limit. Rows > 7 days old are deleted at login. The IP is stored as a hash, not raw. |

Admin credentials are **not** stored in a table: `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` are Hostinger environment variables (section 9). Changing the password = generate a new hash with the `npm run hash-password` script, then update the env and restart the app.

Migrations: drizzle-kit generates SQL files in `/drizzle` (`npm run db:generate`, works without a DB connection). `0000_init.sql` creates 3 tables; `0001_utf8mb4.sql` (custom migration) forces `utf8mb4_unicode_ci` on all three tables whatever the server default is. `npm run db:generate` also copies the contents of `/drizzle` into `lib/db/migrations.generated.ts` (`scripts/embed-migrations.mts`; after editing a custom migration by hand run `npm run db:embed`), because the Hostinger server only carries the build output without the `/drizzle` folder. The hashes and order are identical to Drizzle's `readMigrationFiles()` (guarded by a unit test), and CI fails if that file is out of sync. They are applied through one function, `runMigrations()` in `lib/db/migrate.ts`, idempotent and protected by a MySQL named lock (`GET_LOCK`) so several processes starting at the same time do not clash:

- **Production: automatic in `instrumentation.ts` on every server start**, whatever start command the host uses. Hostinger turned out to run Next.js directly, not `npm start` (seen in the runtime log on Sep 28, 2026), so a migration in the start command never ran. If the DB cannot be reached (`ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `EHOSTUNREACH`) or the migration fails, the error is written to the runtime log (`[migrate] …`) and the server keeps serving static pages (Availability NFR); the migration is retried on the next start. `SKIP_MIGRATIONS=1` turns it off (emergencies only).
- `npm run db:migrate` (`scripts/migrate.mts --strict`, run by `node` directly; Node 24 strips TypeScript types) for CI, local development and manual use: any failure → exit 1.
- CI tests two parallel migration processes on an empty database, then checks that the migration history records each file exactly once.
- Last resort: run the SQL in `/drizzle` by hand through phpMyAdmin (then fill `__drizzle_migrations` to match), only if every way above fails.

**Migration `0004_v2_showcase.sql` (v2.0.0):** one `ALTER TABLE projects` that adds the v2 columns and makes `live_url` NULL-able (the only exception to the "migrations only add" rule, D-21), the `projects_home_order_idx` index, and the starting value `UPDATE projects SET show_on_home = featured WHERE published = 1` (Pal tidies it up in the admin). Tested in CI on a v1 dump and run twice (idempotent, AC-14).

There is no seed; the first project is filled in through the admin.

### Images (MySQL)

- **Compression in the admin browser** (`lib/images/compress.ts`): JPG/PNG/WebP file ≤ 5 MB, width ≥ 1200 px → 16:10 crop (tall images are cut from the top, wide images from the center) → standard widths below the crop result (640/960/1280) + the crop result itself (max. 1600) → WebP quality 0.8 (JPEG 0.82 if the browser cannot encode WebP). Redrawing through canvas also strips EXIF/GPS.
- **Upload (API-06)**: multipart with one `variant` part per width. The server trusts nothing from the client: format and size are read from the file bytes (`lib/images/inspect.ts`, WebP/JPEG only), the width set must exactly match the compression output, 16:10 shape, each variant ≤ 1 MB, the largest ≥ 1200 px. Stored in `images` (1 row per upload) + `image_variants` (1 row per width, `MEDIUMBLOB`) in one transaction.
- **Avatar (S-14)**: square, at least 640 × 640, variants 320 and 640 (v1: 160/320). An old 320 avatar is still served with a srcset holding only the widths that really exist (E-32).
- **Delivery**: `/media/<id>.<ext>` (largest) and `/media/<id>-<width>.<ext>`; the `next/image` loader picks the smallest stored width that is big enough. Images never change (new thumbnail = new id), so `Cache-Control: public, max-age=31536000, immutable`.
- **A project only picks a `public_id`**: API-03/04 take the url, width and height from the `images` table, not from the request.
- **Delete**: the old thumbnail is deleted after the project is saved with the new image; API-05 (T-17) deletes the project's image. Delete and save lock the image row against each other (`for update` / `for share`), so an image being picked by a project/profile save cannot be deleted halfway; if it was deleted first, the save answers "image no longer available". Uploads that were never saved are deleted through API-07 (Remove/Replace/Cancel) or automatically after 24 hours (cleaned up on the next upload). A failed delete does not cancel the main operation, it is only logged. Copies in the CDN cache may survive, but nothing links to them anymore.

## 4. Repo structure & code conventions

Public GitHub repo, one production branch `main`. The structure below must be followed; new files outside this pattern need a reason.

```text
/
├─ app/
│  ├─ [lang]/                  # public root layout (G2); lang = en | id
│  │  ├─ layout.tsx            # <html lang={lang} data-theme>, ThemeScript, ScrollProgress, overlays
│  │  ├─ page.tsx              # S-01
│  │  ├─ work/page.tsx         # S-02
│  │  └─ privacy/page.tsx      # S-03
│  ├─ global-not-found.tsx     # S-04 for every unknown path; locale from the x-locale header (proxy)
│  ├─ admin/                   # admin root layout (G3), separate
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx        # S-10 (outside the group, no session)
│  │  └─ (panel)/              # route group: layout.tsx = requireAdmin() + G3 header
│  │     ├─ page.tsx           # S-11 (/admin)
│  │     ├─ profile/page.tsx   # S-14 (profile photo + availability)
│  │     └─ projects/
│  │        ├─ new/page.tsx    # S-12
│  │        └─ [id]/page.tsx   # S-13
│  ├─ api/admin/               # API-01..09 (route handlers)
│  ├─ sitemap.ts
│  └─ robots.ts
├─ components/
│  ├─ site/                    # SiteBar, ThemeScript, ThemeToggle (client), ScrollProgress, ChapterDepth, DotField,
│  │                           # Pointer (client, loads PointerLayer dynamically), PointerLayer (client), PointerPeek,
│  │                           # Hero, SelectedWork, AboutChapter, HighlightChapter, ContactChapter,
│  │                           # MailtoLink, CopyEmailButton (client), CvLink, LocalClock (client),
│  │                           # WorkFilter (client), CaseRow, EmptyState, Footer, ...
│  ├─ overlays/                # LanguageToggle, LanguageSuggestBanner, CookieConsent
│  ├─ admin/                   # LoginForm, ProjectList, ProjectForm (per section), LinesInput, StackInput,
│  │                           # SegmentedControl, CaseActionField, VisualField, ImageUploader, ProfileForm, ConfirmDialog,
│  │                           # ProjectPreview (client, S-12/S-13 preview panel ≥ 1024 px)
│  └─ ui/                      # Button, Toggle, Toast, Container, ArrowIcon (primitives)
├─ i18n/
│  ├─ en.json
│  ├─ id.json
│  ├─ index.ts                 # getDictionary(lang), localePath(path, lang), altPath(), interpolate()
│  ├─ server.ts                # resolveLocale(params) for page/layout (notFound if not en/id)
│  └─ rich.tsx                 # richText(str): <em>/<s>/<strong> → React elements
├─ lib/
│  ├─ db/ (client.ts, schema.ts)
│  ├─ projects/ (queries.ts, mutations.ts, validation.ts, slug.ts, public.ts, admin.ts, errors.ts)
│  ├─ auth/ (session.ts, password.ts, rate-limit.ts, guard.ts)
│  ├─ images/ (rules.ts, compress.ts, inspect.ts, upload.ts, store.ts, loader.ts)
│  ├─ seo/ (metadata.ts, jsonld.ts)
│  ├─ analytics/ (events.ts)
│  ├─ mailto.ts                # mailtoHref(dict, kind, title): 4 mailto kinds, encoded subject/body
│  ├─ theme.ts                 # resolveTheme(query, stored) (D-23, D-36), inline script, applyTheme
│  ├─ revalidate.ts
│  ├─ locale-header.ts         # x-locale header name (used by proxy.ts and global-not-found)
│  ├─ cn.ts, fonts.ts          # class helper + next/font
│  └─ site-config.ts           # non-secret config (section 9)
├─ styles/globals.css          # tokens (CSS variables) + Tailwind + keyframes & motion
├─ drizzle/                    # SQL migration files
├─ public/cv/rifaldi-radya-pratama-cv.pdf   # static web CV without a phone number (D-14)
├─ scripts/ (hash-password.mts, migrate.mts, embed-migrations.mts, og-images.mts, icons.mts (v2 icons from the dark tokens, D-38), check-deploy.mts)
├─ instrumentation.ts          # validates every env when the production server starts
├─ drizzle.config.ts, docker-compose.yml
├─ tests/ (unit/, integration/, e2e/)  # Vitest (vitest.config.ts, vitest.integration.config.ts), Playwright
├─ docs/ (specs/, changes/, decisions/, design/v2/, CHANGELOG.md)
├─ proxy.ts                    # Next.js 16 (replaces middleware): locale rewrite, 301, /admin guard, x-locale header
├─ AGENTS.md                   # rules for AI coding (section 13)
├─ .env.example
└─ package.json
```

**Conventions**

- TypeScript strict; no `any` except with a comment giving the reason.
- Server Components by default; `"use client"` only for interactive components: overlays, theme toggle, Work filter + hash, Copy email, GMT+7 clock, admin forms. All motion is pure CSS, with no client components. Replaced v1 components are deleted, not left as dead code.
- Database access only in `lib/projects/*`, `lib/images/*` and `lib/auth/*`; components never import `lib/db` directly.
- Every UI string goes through `getDictionary(locale)`; no hardcoded text in public components.
- Component file names in PascalCase, utils in camelCase/kebab-case as in the example above.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`), one feature/fix per commit.

## 5. Routing, i18n, rendering & revalidation

Public URLs stay as in the App Flow (`/`, `/work`, `/id`, `/id/work`), but inside the app every public page lives in `app/[lang]`. `proxy.ts` (the replacement of `middleware.ts` in Next.js 16, running on the Node.js runtime) bridges the two ([Next.js 16](https://nextjs.org/blog/next-16)).

### proxy.ts — full rules (in order)

Matcher: every path except `/_next/static` and `/_next/image`.

1. Host `www.rifaldiradya.com` → 301 to `https://rifaldiradya.com` with the same path and query. Applies to every path that passes the matcher, including static files and `/api/*`. (Hostinger already redirects www at the server level; this rule is a safety net.)
2. Skip `/api/*` and static files (paths ending in an extension: `favicon.ico`, `robots.txt`, `sitemap.xml`, `*.png`, `/cv/*.pdf`, etc.).
3. A path ending in `/` (except the root) → permanent redirect to the version without the slash. Handled by Next.js itself **before** the proxy runs, with status 308 (not 301); both are permanent and Google treats them the same.
4. `/en` or `/en/*` → 301 to the path without `/en`.
5. `/admin/*` except `/admin/login`: no `admin_session` cookie → 302 to `/admin/login?next=<path>`. (This is only a quick filter; the real session check stays in the admin server layout and each API.)
6. `/admin*` → continue without a rewrite, add the `X-Robots-Tag: noindex, nofollow` header.
7. `/id` or `/id/*` → continue as is (matches `app/[lang]` with `lang=id`).
8. Everything else → **rewrite** (not redirect) to `/en<path>`. The URL in the browser stays without the prefix.

There is no logic in the proxy that reads `Accept-Language`, IP or `lang_pref` (App Flow G1).

### i18n

- `i18n/en.json` and `i18n/id.json` hold every key from App Flow section 11 + the PRD section 4 copy. A unit test checks that both files have identical keys.
- `getDictionary(lang)` is called in Server Components; client components receive strings through props (the dictionary is not sent whole to the browser).
- `richText(str)` in `i18n/rich.tsx` turns markers in dictionary strings into React elements without `dangerouslySetInnerHTML`: `<em>` → `<em class="ac">` (italic accent word), `<s>` → `<s>`, `<strong>` → `<strong>`. A simple parser (no nesting); other tags (including the v1 `<hl>`, `<dim>`, `<mark>`) are rendered as plain text. A unit test checks that every key used by `richText` only holds allowed tags and that its tags are balanced in both `en.json` and `id.json`.
- `interpolate(template, values)` fills `{key}`; the Work page sub is built by `workSub()` from the count per group (D-30).
- `localePath('/work', 'id')` → `/id/work`; `localePath('/work', 'en')` → `/work`. Every internal link must go through this helper.
- `altPath(currentPath)` produces the matching path for O-01, hreflang and O-02.
- `app/[lang]/layout.tsx`: `generateStaticParams` → `[{lang:'en'},{lang:'id'}]`; a lang other than `en`/`id` → 404 through `resolveLocale()` → `notFound()`. **Do not** use `dynamicParams = false`: together with on-demand revalidation it turns every public page into a 404 (see DECISIONS T-15).

### Rendering & cache

| Route | Mode | Detail |
| --- | --- | --- |
| `/[lang]`, `/[lang]/work` | Static (ISR) | The homepage calls `getPublishedProjects()` and `getSiteSettings()` (photo, availability) once, then derives Selected work (`show_on_home`, max. 5) in memory; Work uses the full list. `export const revalidate = 60` + `expireTime: 120` in `next.config.ts` (header `s-maxage=60, stale-while-revalidate=60`, D-39) as a safety net + on-demand revalidation when the admin saves (API-03/04/05/08/09). The Hostinger CDN is not purged by `revalidatePath`, so a stale copy lasts at most ~2 minutes |
| `/[lang]/privacy`, not-found | Fully static | No data |
| `sitemap.ts`, `robots.ts` | Static (ISR 300 s) | `lastmod` from `max(updated_at)` |
| `/admin/*` | Dynamic | Always reads the session and the latest data; never cached |
| `/api/admin/*` | Dynamic | Route handlers, Node.js runtime |

- After API-03/04/05/08/09 succeeds: `revalidatePath('/[lang]', 'layout')` (covers the 4 public pages) + `revalidatePath('/sitemap.xml')`. The result is wrapped in try/catch → the `revalidated` field in the response (E-19).
- Public queries are wrapped in try/catch: DB failure → log the error, return `[]` only during the build; during a runtime revalidation, throw the error so Next.js keeps the old static page (E-02).
- **Build risk:** the Hostinger build server may not reach MySQL at `127.0.0.1`. So the build must not fail without a DB, and pages are filled on the first revalidation (≤ 5 minutes after deploy or when the admin saves). Tested in Phase 1.
- Note: App Flow E-19 mentions time-based revalidation of max. 1 hour; the SDD tightens it to 5 minutes, other behavior is the same.

## 6. Admin auth & security

One admin, sessions stored in the database, and every check runs on the server. `proxy.ts` is only a quick filter; the source of truth is `requireAdmin()`.

### Login flow (API-01)

0. Check the `Origin` header = `SITE_URL` (403). Admin env not valid → `503 ADMIN_NOT_CONFIGURED` (the public site keeps running, see section 9).
1. Validate the body with Zod (email 1–254, password 1–200 characters) → `400`.
2. Rate limit: count failed `login_attempts` rows in the last 15 minutes, **per IP** (`sha256(ip + "|" + RATE_LIMIT_SALT)`, ≥ 5) **and globally** (all IPs, ≥ 20). Either exceeded → `429` + `retryAfterSeconds` + `Retry-After` header; the wait = until enough failures leave the window. The IP is taken from `x-real-ip`, then the **last** entry of `x-forwarded-for` (added by the proxy in front of the app), fallback `"unknown"`. The first `x-forwarded-for` entry is not used because the client can fake it; the global limit keeps brute force impossible even if the IP header turns out to be fakeable.
3. Compare the email (case-insensitive, trimmed) with `ADMIN_EMAIL` and the password with `ADMIN_PASSWORD_HASH` via `bcryptjs.compare` (cost 12). The bcrypt comparison still runs against a dummy hash when the email is wrong, so the response time does not leak information.
4. Record the attempt (success true/false). The 5th failure is answered with `429` right away (form locked), not `401`.
5. Success: create a random 32-byte token (`crypto.randomBytes`), store `sha256(token)` in `admin_sessions` with `expires_at = now + 7 days`, set the cookie `admin_session` = token (`httpOnly`, `secure`, `sameSite=lax`, `path=/`, `maxAge` 7 days). Delete expired sessions and attempts.

### requireAdmin()

- Called in `app/admin/layout.tsx` (except the login page) and at the start of every `/api/admin/*` handler other than login.
- Read the cookie → hash → find an unexpired session → update `last_seen_at` (at most once per 5 minutes).
- Not valid: page → `redirect('/admin/login?next=...')`; API → `401 UNAUTHENTICATED`.
- Logout (API-02): delete the session row + delete the cookie.

### Other security controls

| Threat | Control |
| --- | --- |
| CSRF | `sameSite=lax` cookie + check that the `Origin` header = `SITE_URL` on every write request (`403 FORBIDDEN_ORIGIN`) |
| XSS | React escaping; no `dangerouslySetInnerHTML` except JSON-LD built from an object (`JSON.stringify` + `<` escaped) and the inline theme script built from our own code; admin input is stored as plain text; mailto is built with `encodeURIComponent` for subject/body (the project title in the walkthrough subject is encoded too) |
| Malicious upload | Client: JPG/PNG/WebP type, max. 5 MB, width ≥ 1200 px, redrawn through canvas. Server: format + dimensions from magic bytes (WebP/JPEG only; SVG/HTML/PNG rejected), the width set and the 16:10 ratio must match, max. 1 MB per variant; file name and MIME from the client are ignored; served with the `Content-Type` from the DB + `X-Content-Type-Options: nosniff` |
| Malicious URL | `live_url` is validated as `https:` on the server and only rendered (JSON-LD included) when it is `https:` and the case button = `site`; rendered with `rel="noopener noreferrer"` |
| Brute force | Login rate limit + bcrypt cost 12. An attempt is recorded as failed *before* the password check, so parallel requests are counted too; attempts rejected with 429 are not counted (DECISIONS 2026-10-22) |
| Large request body | Admin API JSON bodies, login included, max. 32 KB (`readJsonBody`, counted while reading, so a chunked body without `Content-Length` is cut off too); anything larger is treated like a broken body (`400`/`422`) |
| Secret leaks | Every secret in the Hostinger env; `.env*` in `.gitignore`; `.env.example` without values; no secret with the `NEXT_PUBLIC_` prefix |
| Clickjacking & headers | `lib/security-headers.ts` through `next.config.ts` `headers()` on every response: `Content-Security-Policy` (default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com, + 'unsafe-eval' only in dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: + GA hosts; font-src 'self'; connect-src 'self' + GA hosts; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment, USB, topics turned off), `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` (production) |
| Vulnerable dependencies | Turn on Hostinger's automatic vulnerability scan + Dependabot on GitHub; follow Next.js security releases |
| Admin enumeration | Generic login message; `/admin/*` noindex + disallowed in robots |

The CSP stays the same for v2 (self-hosted font, no new hosts; the inline theme script is covered by `'unsafe-inline'`). The CSP deliberately has no nonce: a per-request nonce forces every page to render dynamically, which conflicts with the static performance target. The `'unsafe-inline'` risk is low because the site shows no user-generated HTML. The CSP is tested in Phase 4; if it blocks something, fix the allowlist, do not turn off the CSP.

## 7. SEO, analytics & consent

### SEO (implementation of PRD section 9)

- `lib/seo/metadata.ts` → `buildMetadata({ lang, path, page, dict })` (v2 meta in the `seo.*` dictionary, PRD section 9) used by every `generateMetadata`. It produces: `title`, `description`, `alternates.canonical` (absolute URL of the page itself), `alternates.languages` (`en`, `id`, `x-default` → EN), `openGraph` (title, description, url, `locale` en\_US/id\_ID, `alternateLocale`, an OG image per language 1200 × 630 in `/public/og/`), `twitter` (summary\_large\_image).
- `metadataBase = new URL(SITE_URL)`; `SITE_URL` = `https://rifaldiradya.com` (canonical non-www, approved Sep 28, 2026). The www → non-www redirect is handled by `proxy.ts` rule 1 (section 5); DNS still needs a `www` record pointing to the same app so www requests reach the proxy. Every canonical, hreflang, sitemap, OG `url` and JSON-LD uses the non-www version.
- `lib/seo/jsonld.ts` → `homeJsonLd(lang, origin)` (Person: `jobTitle` Software Engineer, `worksFor`, `knowsAbout`, `sameAs` LinkedIn + GitHub when filled in; WebSite) and `workJsonLd(...)` (CollectionPage + ItemList; projects without `live_url` use the case URL `…/work#case-<slug>`); rendered as `<script type="application/ld+json">` in a Server Component (not added via client JS), so it is visible in the initial HTML.
- `app/sitemap.ts`: 6 URLs (home, work, privacy × 2 languages), each with `alternates.languages`, `lastModified`.
- `app/robots.ts`: allow `/`, disallow `/admin` and `/api`, `sitemap: SITE_URL/sitemap.xml`. No special block for AI crawlers (allowed). **Only when `SITE_URL` = `https://rifaldiradya.com`**; other deployments (devstaging, local) get `Disallow: /` and every page `noindex` (`isIndexable()` in `lib/seo/metadata.ts`).
- Static pages, the sitemap and robots use `SITE_URL` **at build time** (then updated by revalidation within ≤ 5 minutes). That is why the Phase 4 step "change `SITE_URL`, then redeploy" is required: the redeploy rebuilds with the main domain.
- Admin: `metadata.robots = { index: false, follow: false }` + the header from the proxy.
- OG images are regenerated with `scripts/og-images.mts` using the v2 tokens (dark theme) and Archivo → `public/og/{en,id}.png`.
- Images: `next/image` + the `/media` loader. No priority images in S-01 and S-02 (no thumbnail above the fold; LCP = the H1 text); Selected work screenshots use `loading="lazy"`, `sizes="(min-width: 768px) 55vw, 100vw"`.

### Analytics & consent (implementation of F8)

- The `<Analytics />` component (client) in the public layout and the 404 (not in the admin). **Basic mode (DECISIONS T-19):** `gtag.js` is only requested after `consent=granted`, both when the page opens with that cookie and right after Accept. The order: `gtag('consent','default', all denied)` → `gtag('consent','update',{ analytics_storage:'granted' })` → `gtag('config', ID)` (sends `page_view` for the current page) → the `gtag/js?id=…` script is inserted. Without consent there is no script, no cookie and no cookieless ping to Google. Ads are not used, so every `ad_*` stays denied forever.
- Client navigation (Link) is counted by the GA4 Enhanced measurement "Page changes based on browser history events" (leave it on in the stream settings).
- `<CookieConsent />` (client): reads/writes the `consent` cookie (180 days, `sameSite=lax`, `secure`), calls `gtag('consent','update', ...)`. Reject after an earlier grant → delete the `_ga`, `_ga_<ID>` cookies on the `.rifaldiradya.com` domain and path `/`.
- `lib/analytics/events.ts` → `track(name, params)` with strict types for the App Flow section 11 events (`contact_email_click` with `kind`, `cv_download`, `case_open`, `project_link_click` placement `home`|`case`, `theme_switch`, `language_switch`); the function does nothing when the ID is empty, `window.gtag` does not exist, or consent is not granted. Server-rendered links mark events through attributes (`data-track`, `data-kind`, `data-location`, `data-method`, `data-slug`, `data-placement`, `data-source`) and one click listener in `<Analytics />` turns them into `track()`, so links stay Server Components. `language_switch` is called directly by O-01/O-02, `theme_switch` by O-04. A title click on home leaves a one-time `sessionStorage` marker `rr-case-from-home` so the Work page does not count it again as `source: hash`.
- In GA4: mark `contact_email_click` and `cv_download` as key events; set data retention to 14 months; Google Signals is not needed.
- Search Console: verify via a DNS TXT record in hPanel; submit the sitemap after launch.

Consent Mode v2 and the banner obligation for EEA/UK visitors follow Google's official guidance; the banner text and privacy page are written simply and honestly, not as a legal template. This is not legal advice.

## 8. Design system in code

The PRD section 8 tokens become one source in `styles/globals.css`; components may only use tokens, never raw color values. Two layers:

1. **Theme tokens** in `:root, :root[data-theme="dark"]` and `:root[data-theme="light"]`; `:root` without `data-theme` (without JS, E-07) uses the dark tokens (D-36), with values exactly as in PRD section 8: `--bg`, `--ink`, `--soft`, `--faint`, `--accent`, `--accent-ink`, `--calm`, `--k`, `--dot`, `--avatar-ring`, and for the admin only `--panel`, `--field`, `--ok`, `--warn`, `--danger`.
2. **Tailwind `@theme` mapping:** `--color-bg: var(--bg)`, `--color-text: var(--ink)`, `--color-text-muted: var(--soft)`, `--color-border: var(--faint)`, `--color-accent: var(--accent)`, `--color-on-accent: var(--accent-ink)`, `--color-success`/`--color-danger` for the admin only; `--font-sans: var(--font-archivo)`.

- Sizes, spacing, radius and easing follow the mockup: `--gutter: clamp(20px, 2.8vw, 40px)`, `--ease: cubic-bezier(0.23, 1, 0.32, 1)`, `--win: 100svh`.
- The v1 tokens (`--color-accent-soft`, `--font-display`, `--shadow-card*`, `--slide-ms`, `--ease-pulse`, highlighter) are deleted; the `tokens.test.ts` test keeps the grep clean.
- Focus ring: 2 px `--accent`, 2 px offset, both themes.
- `--calm` is only a light color, `--faint` is only for decorative lines; neither is ever used for text. Admin inputs have a border ≥ 3:1 (`--soft`).
- Contrast is checked automatically (axe in Playwright, both themes) and whenever tokens change.
- `ui/*` components have every state: default, hover, focus-visible, active, disabled, loading.

### Motion in code

All motion follows D-08 and D-10. Keyframes and motion rules live in `styles/globals.css` (not per component) so they are easy to audit.

- All scroll motion is wrapped in `@supports (animation-timeline: view())` + `@media (prefers-reduced-motion: no-preference)`: one `position: fixed` dot layer for the whole page (`DotField`, `aria-hidden`, slightly taller than the screen, slow `translateY` with `animation-timeline: scroll(root)`; without support or under reduced motion → still, D-37), light per chapter (`ChapterDepth` per `data-zone`, without dots), blur/fade focus per chapter, the About statement filling line by line, the Highlight strike-through + number count (`@property` integer counter), the `scroll(root)` progress bar, pinned Selected work steps (range per step from `selectedWorkRanges()`), accent line hover on titles.
- Scroll snap `y proximity` on `html`, off under reduced motion.
- H1: a 900 ms `transform: translateY` animation with `--ease`, **without opacity** (D-10).
- Theme transition 300 ms on `background-color`/`color`.
- Without support (Firefox today) or under reduced motion: every chapter shows static in its final state (E-30); no JavaScript/IntersectionObserver fallback.
- **Pointer layer (O-05, D-31..D-35):** `Pointer` loads `PointerLayer` with a dynamic import after idle, only when `(hover: hover) and (pointer: fine)` matches; the chunk is never requested on touch screens. One `requestAnimationFrame` loop (the only one on the site) that stops when the dot, ring and light are at the cursor position (difference < 0.4 px) and starts again on `pointermove`; only `transform` and `opacity`. Light zones through an IntersectionObserver (`rootMargin: -45% 0 -45% 0`). Preview data is rendered by the server in `.peek` (`PointerPeek`), not fetched. Reduced motion: no lag, no tilt, no transitions. `:focus-visible` anywhere → the layer is hidden.
- **Forbidden**: `scroll` listeners, animation libraries, JS rotation/timers, fade-in on the H1/sub, `requestAnimationFrame` outside `PointerLayer`.

## 9. Environment variables & configuration

Every variable is validated by `lib/env.ts` (Zod) in 4 groups: site, database, admin, analytics (images in MySQL need no extra env). Each group is checked on first use (`databaseEnv()`, `adminEnv()`, etc.), so `next build` in CI and local development still run without every secret. On the production server, `instrumentation.ts` calls `assertServerEnv()` at start for the groups in `REQUIRED_AT_START`: a missing required variable makes the app fail to start with a clear message that names every problem variable per group (without showing its value), not a random runtime error. `REQUIRED_AT_START` only holds groups whose features are already built: `site`, `database`, `analytics` (optional, but a badly formatted ID is rejected). The admin-only group (`CHECKED_AT_START`: `admin`) is checked at start but **only logged** (`[env] admin login disabled until fixed: …`): a mistake in the admin secrets disables admin login (`503 ADMIN_NOT_CONFIGURED`), not the whole public site (Availability NFR). A deploy also never needs fake values for features that do not exist yet. `SKIP_ENV_VALIDATION=1` is only for trying a production build locally; never set it on Hostinger.

| Variable | Example / format | Required | Public? | Notes |
| --- | --- | --- | --- | --- |
| `SITE_URL` | `https://rifaldiradya.com` | yes | no | Base for canonical, sitemap, Origin check |
| `DATABASE_HOST` | `127.0.0.1` | yes | no | Not `localhost` |
| `DATABASE_PORT` | `3306` | yes | no | — |
| `DATABASE_NAME` / `DATABASE_USER` / `DATABASE_PASSWORD` | from hPanel → Databases | yes | no | App-only user, with access to 1 database only |
| `ADMIN_EMAIL` | `hello@rifaldiradya.com` | yes | no | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash cost 12, **base64-encoded** (no `$`) | yes (admin) | no | Created with `npm run hash-password` in your own terminal (hidden input). Base64 because the `$` in a raw hash is read as a variable reference in an `.env` file (dotenv-expand) and can break the hash; a raw `$2b$…` hash is still accepted |
| `RATE_LIMIT_SALT` | random string of 32+ characters | yes | no | For the IP hash |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | no | yes | Empty → the analytics component & consent banner are not rendered (useful in dev) |
| `NODE_ENV` | `production` | automatic | — | Set by the platform |

- On Hostinger: fill them in through the Node.js app environment variable settings, then **restart the app** (env is not reloaded automatically). `NEXT_PUBLIC_*` variables are read at **build** time, so changing one needs a redeploy, not just a restart.
- Local: `.env.local` (not committed). `.env.example` holds every variable name without values.
- Non-secret config in `lib/site-config.ts` (committed, not env): `role: 'Software Engineer'`, `employer`, `knowsAbout` (JSON-LD), `contactEmail: 'hello@rifaldiradya.com'`, `cvPath: '/cv/rifaldi-radya-pratama-cv.pdf'`, `timezoneLabel: 'GMT+7'` + `timezone: 'Asia/Jakarta'` (Contact clock), `stack` (hero Stack line), `social: { linkedin: 'https://www.linkedin.com/in/rifaldiradya', github: '' }` (empty GitHub = not rendered, D-19). The v1 `availableForWork` flag is deleted, replaced by `availability_on` in the admin (D-16). Changing it = commit + deploy. No new env in v2.
- `next.config.ts`: `images.loader: 'custom'`, `images.loaderFile: './lib/images/loader.ts'`, `deviceSizes` = stored widths, security `headers()` (section 6), `poweredByHeader: false`, `reactStrictMode: true`.
- `package.json` (`"type": "module"`) scripts: `dev`, `build`, `start` (`next start`; migrations run automatically in `instrumentation.ts`; Next.js reads `PORT` from the Hostinger env), `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `hash-password`.

## 10. Deploy to Hostinger via GitHub

The flow: code on GitHub → Hostinger pulls the repo → install, build, start automatically on every push to `main` ([Hostinger GitHub integration](https://docs.hostinger.com/node.js/github)). The first deploy goes to a test subdomain first; the main domain is moved only after everything is green.

### One-time setup

- [x] **Check the main domain in hPanel → Websites.** If rifaldiradya.com is still installed as a website (e.g. WordPress), do not delete it yet. Back up the WordPress files + database through hPanel, and make sure the `staging0`/`staging1` subdomains are registered as separate websites that will not be deleted with it.
- [x] Create a private GitHub repo, push a Next.js skeleton that already passes `npm run build` locally.
- [x] hPanel → Databases: create a MySQL database + an app-only user; note the name, user, password.
- [x] Create a GA4 property, note the Measurement ID.
- [x] Generate `ADMIN_PASSWORD_HASH` locally.

### First deploy (Phase 1, on a test subdomain)

1. hPanel → Websites → Add Website → Node.js web app → Import Git repository → Connect with GitHub → pick the repo, branch `main`.
2. Check the auto-detected settings: Next.js framework, Node 24, build `npm run build`, start `npm run start`, root directory `/`.
3. Use the test subdomain: **`devstaging.rifaldiradya.com`** (picked Sep 28, 2026), with `SITE_URL=https://devstaging.rifaldiradya.com`.
4. Fill in the environment variables of the groups that are already required (`REQUIRED_AT_START`, section 9), then Deploy. Output directory `.next`, package manager npm.
5. Watch the build log. If it fails: check the Node version, the `package.json` scripts and native dependencies (the App Flow forbids native ones). `TurbopackInternalError … node process exited` = the build ran with Turbopack; make sure the `build` script is still `next build --webpack`.
6. Verify (step by step for the features that exist): public pages show, the migration creates the tables; `/admin/login` can log in (T-13), image upload + display from `/media` (T-16), revalidation works (T-15).

### Move to the main domain (Phase 4)

Done on Sep 30, 2026 (DECISIONS T-22):

1. Clear the old website on rifaldiradya.com (WordPress, its content is not needed) after the test version passes QA. Do not use the "Connect domain" dialog that offers an email reset; a new Node.js website on the same domain still gets free email, and the MX records do not change.
2. hPanel → Databases: create a new database + user for production. On Hostinger every database pairs with its own user, so `DATABASE_NAME` and `DATABASE_USER` must be exactly the same pair (wrong database name = login 500 and `/media` 503, runtime log: `Access denied … to database`). Copy the devstaging database contents through phpMyAdmin (Export → Import).
3. Add Website → Node.js web app on rifaldiradya.com, branch `main`, production env: `SITE_URL=https://rifaldiradya.com`, `DATABASE_HOST=127.0.0.1`, the new database, GA4 filled in. Make sure SSL is active for `rifaldiradya.com` and `www`.
4. The old devstaging website moves to the `staging` branch and keeps its old database; clear GA4, then redeploy.
5. Check automatically from outside: `node scripts/check-deploy.mts https://rifaldiradya.com --production` (24 checks) and without `--production` for devstaging (23). Also check: login with wrong credentials → 401 (not 500/403), `/media/<missing-id>.webp` → 404 (not 503), the MX/SPF/DKIM/DMARC records are the same as before the move.

### Two environments after launch (Pal's decision, T-22)

| | Production | Staging |
| --- | --- | --- |
| Domain | `rifaldiradya.com` (+ `www` → 301) | `devstaging.rifaldiradya.com` |
| Hostinger website | New Node.js website on the main domain | The Node.js website used since Phase 1 |
| Deploy branch | `main` | `staging` |
| Database | New database, a one-time copy from devstaging (phpMyAdmin export/import) | The old devstaging database |
| `SITE_URL` | `https://rifaldiradya.com` (indexed) | `https://devstaging.rifaldiradya.com` (automatically noindex) |
| GA4 | ID filled in | Empty (no banner, does not pollute the data) |

The two environments **must not** use the same database: the staging admin would change the real site's content, and migrations from the staging branch would run on the real data.

### Daily workflow

- **Every change goes through `staging` first** (DECISIONS 2026-10-13), small fixes included: branch (`fix/...`, `feat/...`, `docs/...`) → PR to `staging` → CI green → merge → check on devstaging → PR `staging` → `main` → CI green → merge → production deploys automatically.
- CI runs on PRs and on pushes to both `main` and `staging`.
- Do not push directly to `main`; `main` only accepts PRs from `staging`. The only exception is an emergency hotfix while production is broken, followed right away by a merge of `main` → `staging`.
- Database migrations: generate locally, commit the SQL file, it runs automatically at start. Back up the database in hPanel before merging a schema change.

### Versions & releases (DECISIONS 2026-10-02)

- Versions use SemVer and are marked with a **git tag** on `main` (`v1.0.0` = first release, Oct 2, 2026) plus a GitHub Release with a summary and the QA results. There are no permanent version branches (`v1`, `v2`); old version code is opened through its tag.
- From the next release on, `version` in `package.json` is bumped in the release PR so it matches the tag (when `v1.0.0` was created the value was still `0.1.0`).
- Major versions (redesign, e.g. v2): `main` stays the live version; v2 is assembled on `staging` (branch `feat/v2-...` → PR to `staging`, viewed on devstaging). While a major version is being assembled on `staging`, fixes for the live version are made from `main` (`fix/...`), then PR'd to `staging` and checked on devstaging first; if `staging` holds major version work that is not ready to release, that fix is taken to `main` with a separate PR from the same branch after it passes the devstaging check.
- Release: PR `staging` → `main` → CI green → merge → tag `vX.Y.Z` + GitHub Release → check `node scripts/check-deploy.mts https://rifaldiradya.com --production`.
- Rolling back a major release: revert the release merge commit on `main`; for v2.0.0 you **must also restore the pre-release database backup** (the v1 code does not handle a null `live_url` or projects without a thumbnail). Emergency: create a `release/v1` branch from the `v1.0.0` tag and temporarily point the production deploy branch in hPanel to that branch.
- **v2.0.0 release:** all work in `feat/v2-<task>` → PR to `staging`. Before the `staging` → `main` release PR: back up the production database in hPanel (required, D-21). Migration `0004` runs automatically at start. Tag `v2.0.0` + GitHub Release; `package.json` `version` 2.0.0; `check-deploy.mts` checks the v2 pages, `/cv/…pdf` 200 and the new meta. Final content is filled in the production admin after deploy (D-29).

### Rollback

- Code: `git revert` the bad commit → push to `main` → automatic redeploy.
- Data: restore a database backup in hPanel.
- Migrations may only add (new columns/tables), never delete, so a code rollback stays compatible with the schema. The only exception: the nullable `live_url` in `0004` (D-21) → rolling back v2 = revert **and** restore the DB backup.

## 11. Testing & QA

Automated tests focus on the parts that break silently most easily: validation, language routing, auth and the main flows. The rest is checked by hand with a checklist before launch.

| Level | Tool | Required coverage | When it runs |
| --- | --- | --- | --- |
| Unit | Vitest | The v2 project Zod schema (every conditional rule: site ↔ live_url, screenshot ↔ thumbnail+alt, number ↔ number+caption, `case_did` limits, max. 6 stack), the 5 `show_on_home` limit, the mailto builder (4 kinds × 2 languages, encoding), `workSub`, multi-line What I did paste, `slugify` + clashes, `localePath`/`altPath`, `proxy.ts` rules, `en.json` vs `id.json` key equality, `richText` (`<em>`/`<s>`/`<strong>` tags, old tags become text), theme resolution order, rate-limit window, metadata builder | Every PR (CI) |
| Integration | Vitest + MySQL Docker | Migration `0004` on a v1 dump (old rows valid, defaults filled, idempotent); public queries only `published=true` in the right order; API-03/04 conditional rules + E-26; API-09 availability + atomic save; login/expired/logout sessions | Every PR (CI, MySQL service) |
| E2E | Playwright (Edge desktop 1280 + mobile 375) | UF-01 v2, UF-02, UF-04, UF-05 (v2 events, Google requests intercepted), UF-06, UF-07/UF-08 v2 (multi-line paste included), UF-09; Work filter + hash; theme without flash (first frame) in both themes, including a `colorScheme: light` device with no choice → dark; pointer layer (AC-1..AC-5, E-34, JS budget); admin preview panel (AC-7); without JS (E-07); reduced motion + no scroll-driven support (E-30); axe in both themes | Every feature PR + before release |
| Build | `next build` | Build succeeds without a DB connection | Every PR (CI) |

### Manual QA checklist before launch (v1)

- [x] Every PRD F1–F9 acceptance criterion checked one by one (per task through the Definition of Done, section 12, and automated tests: 271 unit, 18 integration, 40 E2E).
- [x] Every App Flow edge case E-01 to E-20 tried (those that can be simulated), per task + E2E.
- [x] PageSpeed Insights mobile ≥ 90 and Core Web Vitals pass on `/`, `/work`, `/id`, `/id/work`. Production Sep 30, 2026: `/` 99/100/100/100 (LCP 1.2 s, CLS 0), `/work` 100/100/100/100 (LCP 1.1 s); `/id` and `/id/work` use the same template (passed on devstaging, T-21). No CrUX field data yet (new site).
- [x] Lighthouse Accessibility & SEO ≥ 95 (100/100 in production); full keyboard navigation (E2E); screen reader checked by Pal.
- [x] Display on a real phone (checked by Pal), 360–1440 px screens with no horizontal scroll (T-21).
- [x] Visuals compared with `docs/design/homepage-mockup.html` at 375 px and 1280 px (hero, SectionHeader, ProcessSteps, About, final CTA).
- [x] Motion: scroll animations run in Chrome/Safari, the page stays intact in Firefox; `prefers-reduced-motion` turns off every animation and the panel rotation; the DevTools Performance panel shows no long task or layout shift from animations. Checked in production on Oct 1, 2026 (Playwright + Edge): `reduce` → 0 animated elements, the hero panel stays on slide 01 after 8 s; without `reduce` → 24 animated elements and the panel moves to slide 02. CLS 0 in PageSpeed. Visuals vs mockup checked by Pal.
- [x] Reject consent → no `_ga` cookie; accept → gtag loads and the `_ga` cookie is created (checked in production on Sep 30, 2026; rejecting through Cookie settings deletes `_ga`).
- [x] View source: canonical, hreflang, JSON-LD correct on all four pages (`check-deploy`); `WebSite` + `Person` JSON-LD valid with no errors/warnings in the Schema Markup Validator (the Rich Results Test needs a Google login).
- [x] `robots.txt` and `sitemap.xml` correct; `/admin` sends `noindex` (`check-deploy` 24/24).
- [x] securityheaders.com at least grade A: **A+** in production (Sep 30, 2026).
- [x] Mailto opens with the right subject in EN and ID (checked on all four production pages); Copy button (E2E).
- [x] EN copy reread by a fluent English speaker (confirmed by Pal).

## 12. Build order

v1: 22 tasks in 4 phases (T-01..T-22). v2.0.0: 11 tasks (T-23..T-33), below. One task = one AI coding session = one small PR.

### Phase 1 — Foundation (gate: the deploy pipeline works)

- [x] **T-01** Init Next.js 16.3 + TypeScript strict + Tailwind v4 + ESLint/Prettier; `engines` Node 24; commit `docs/` (PRD, App Flow, SDD, `design/homepage-mockup.html`) and `AGENTS.md`.
- [x] **T-02** `styles/globals.css` tokens + keyframes/motion (section 8) + font via `next/font` + basic `ui/*` components (Button, Badge, StatusDot, ArrowIcon) with every state.
- [x] **T-03** `app/[lang]` structure + `proxy.ts` (rewrite, 301, admin guard) + `i18n/` (dictionaries, `localePath`, `altPath`) + routing unit tests.
- [x] **T-04** `lib/env.ts` + Drizzle connection to MySQL + 3-table schema + migrations + `scripts/migrate`; Docker MySQL for local.
- [x] **T-05** GitHub Actions CI (lint, typecheck, unit, build without a DB).
- [x] **T-06** First deploy to the Hostinger test subdomain (section 10); record the results in `docs/DECISIONS.md`, including whether the build can reach the DB.

### Phase 2 — Public pages

- [x] **T-07** Public layout: Navbar (responsive), Footer (email CTA + Copy), skip link.
- [x] **T-08** S-01 Hero left column (BylineBadge with an initials fallback, H1 with `richText`, MetaRow + `site-config`) + grid texture + SectionHeader + two-tier ServiceTile + ProcessSteps + About (lead, `<mark>`, AboutFacts) + FooterCta, copy from the dictionary.
- [x] **T-09** `getPublishedProjects()` + derived `selectHomepageProjects()` (featured max. 3, grid max. 6 + total) + ProjectCard + Selected work + EmptyState + HeroProofPanel (rotation, controls, E-21 to E-24, staged image loading); Cloudinary loader (replaced by the `/media` loader in T-16).
- [x] **T-10** S-02 Work, S-03 Privacy, S-04 not-found per locale.
- [x] **T-11** O-01 toggle (client, still `<a href>`; stores `lang_pref`, carries `#hash`) + O-02 language suggestion banner (`lib/lang-pref.ts`) + the `lang_pref` cookie; e2e UF-02/UF-04. The `language_switch` event and O-02/O-03 coordination on mobile were added in T-19.
- [x] **T-12** SEO: `buildMetadata` (canonical, hreflang + x-default, OG/Twitter), JSON-LD (Person + WebSite, CollectionPage + ItemList), `sitemap.ts`, `robots.ts`, OG images (`scripts/og-images.mts` → `public/og/{en,id}.png`); only `SITE_URL=https://rifaldiradya.com` may be indexed.

### Phase 3 — Admin

- [x] **T-13** Auth: API-01/02, `requireAdmin`, rate limit (per IP + global), `scripts/hash-password`, S-10; the `admin` env group is checked at start as a warning (`CHECKED_AT_START`), not a start requirement; login validates `next` to `/admin*` only.
- [x] **T-14** S-11 project list (table ≥ 768 px, cards on mobile) + G3 admin layout, featured/grid info + E-08 warning, Toast (`?notice=`), admin error boundary.
- [x] **T-15** Shared Zod schema (`lib/projects/validation.ts`) + API-03/04 + `revalidate.ts`; revalidation verified on `next start` (4 pages changed on the first visit after a save).
- [x] **T-16** Image storage in MySQL (`images` + `image_variants` tables, migration 0002), browser compression, API-06/07, `/media` route, loader; ImageUploader (wired into the T-17 form); the Cloudinary env group deleted.
- [x] **T-17** Full S-12/S-13 ProjectForm (validation, discard dialog, `beforeunload`) + API-05 delete + ConfirmDialog; Toggle, ImageUploader wired in, `danger` Button variant.
- [x] **T-18b** (extra, Pal's request) Project order with ↑/↓ buttons in S-11 (API-08, positions 1…n with no duplicates, new project at #1, the Sort order field removed from the form) + hero profile photo through the S-14 admin (API-09, `site_settings`, `kind=avatar` upload); migration 0003 renumbers the old order.
- [x] **T-18** Integration tests (`npm run test:integration`, also in the CI `database` job) + e2e UF-06, UF-07, UF-09 (`npm run test:e2e`, Playwright on the installed Edge, desktop + 375 px).

### Phase 4 — Launch (gate: Lighthouse ≥ 90, every AC passes)

- [x] **T-19** GA4 + Consent Mode v2 + O-03 + `track()` 4 events + S-03 Cookie settings button (gtag.js only loads after Accept; events through `data-track` attributes; O-02 waits for O-03 on phones; e2e UF-05 with Google requests intercepted). The consent banner on mobile is max. ~130 px tall: at 375 × 667 the hero button "See the Work" ends at y = 537 px and must stay visible while the banner shows (PRD F1).
- [x] **T-20** Security headers + CSP (`lib/security-headers.ts`); e2e records CSP violations (0 on public pages, 404, GA after Accept, admin + upload). securityheaders.com test on devstaging after deploy.
- [x] **T-21** Real content filled in through the admin (Pal, on devstaging), final EN/ID copy; automated QA on devstaging: PageSpeed mobile homepage 98/100/100 (SEO 61 because staging is deliberately noindex), 6 pages × 5 widths (360–1440) with no sideways scroll/broken images, 1 H1 per page. Fixes: CSP also through `<meta>` (the Hostinger CDN overrides the CSP header), the active language in the toggle is not a link, favicon + app icons. Manual leftovers before launch: real Android/iPhone + screen reader, securityheaders.com and Rich Results Test after the main domain.
- [x] **T-22** Move to the main domain, Search Console, submit the sitemap, paste the link into the Upwork profile. Sep 30, 2026: production live at rifaldiradya.com (branch `main`, its own database, check-deploy 24/24, login 401, `/media` 404, email DNS intact), devstaging on the `staging` branch (23/23). Oct 2, 2026: Search Console Domain property `rifaldiradya.com` verified through a DNS TXT record (the `google-site-verification` record in hPanel, do not delete it), sitemap submitted, indexing requested for `/` and `/id`; GA4 event data retention 14 months; `contact_email_click` already shows in Realtime, it only needs the star (key event) in Admin → Events once it appears in the list (≤ 24 hours). **Deferred:** the link in the Upwork profile (Pal has not created the profile yet).

### v2.0.0 QA (T-33, Oct 17–18, 2026)

- [x] Automated tests: 335+ unit, 29 integration (migration `0004` twice = AC-14), 116 E2E desktop + 375 px (axe in both themes, theme without flash, without JS, reduced motion).
- [x] Code review of the whole v2 diff: 2 bugs fixed (multi-line What I did paste; atomic profile save), 2 small findings noted without changes (the `case_open` marker can be left behind after a ctrl-click; the E-28 warning is logged per render).
- [x] design-taste UI gate: no contrast, overflow or sideways scroll issues; the other findings are mockup choices already defended (scrim, dots + light D-08, link underlines, counter D-04).
- [x] PageSpeed mobile on devstaging, both themes: `/` 100/100/100, `/work` 100/100/100, `/id` 94–97/100/100, `/id/work` 99–100/100/100; CLS ≤ 0.001 (SEO < 95 because devstaging is deliberately noindex).
- [x] AC-2..AC-6 verified on devstaging with 7 projects; AC-7/AC-8 through admin E2E; AC-9 tested by Pal in S-14.
- [x] `check-deploy` devstaging 29/29.

### v2 Phases A–D — Preparation, foundation, admin, public site

- [x] **T-23** Store the change & references: v2 mockup, `homepage-mockup.html` to `docs/design/archive/`, CHANGE v2.0.0 + tasks, CHANGE v2.1.0 (`proposed`), AGENTS.md pointing at the active change.
- [x] **T-24** Two-layer theme tokens + Archivo + `ThemeScript`/`ThemeToggle` (O-04, D-23); reskin of `ui/*`; v1 tokens/font and `<hl>`/`<dim>`/`<mark>` deleted.
- [x] **T-25** Migration `0004` + schema + conditional validation + the 5 `show_on_home` limit + v2 DTO + `availability_on` + 640 avatar (AC-14).
- [x] **T-26** Admin S-11 (columns, group filter), S-12/S-13 per section (`LinesInput`, `SegmentedControl`, `CaseActionField`, `VisualField`, Stack max. 6), S-14 640 photo + availability; API-03/04/09 (AC-7, AC-8).
- [x] **T-27** Content (Pal): web CV PDF without a phone number; final content filled in production after the release (D-29).
- [x] **T-28** Public shell: `SiteBar`, `ScrollProgress`, `ChapterDepth`, v2 footer, skip link; restyle of O-02/O-03 and S-04; `Navbar`, `FooterCta` deleted.
- [x] **T-29** Home Hero, About, Highlight, Contact: `MailtoLink` 4 kinds, `CopyEmailButton` in Contact, `CvLink`, `LocalClock`, availability from `site_settings`, CSS motion D-08 + H1 without fade (D-10); v1 components deleted.
- [x] **T-30** Pinned Selected work + snap, counter, rail, title → `/work#case-<slug>`, lazy screenshots, `data-cursor`, E-25.
- [x] **T-31** Work page: H1 + count, `WorkFilter`, `CaseRow` (`<details>`), 3 kinds of case button, hash open/filter reset, closing Contact; `ProjectGrid`, `ProjectCard`, `.reveal` deleted. Sub computed from data (D-30, PR #58).

### v2 Phases E–F — SEO, analytics, release

- [x] **T-32** v2 meta, JSON-LD (Person, ItemList with case URLs), new OG, v2 `events.ts` + `data-track`, EN/ID Privacy (`rr-theme`, CV, `rr-case-from-home`), new LinkedIn in `site-config` + empty GitHub, updated `check-deploy.mts`.
- [x] **T-33** v2.0.0 QA (above) + release: QA fixes (#59, #60), production DB backup, `version` 2.0.0, CHANGELOG `[2.0.0]`, CHANGE merged into `docs/specs/` and archived, D-01..D-30 into DECISIONS, PR `staging` → `main`, tag `v2.0.0` + GitHub Release, `check-deploy --production`.
- [x] **Post-release (D-29):** Pal fills in 7 projects in the production admin, `show_on_home` + order, photo ≥ 640; then verify AC-2 and PageSpeed in production. Production Oct 18, 2026: AC-2 passes on `/` and `/id` (HR System, Single Sign-On, rifaldiradya.com, SwiftPay, Bloom Studio; counter 01–05 / 05; AI not on home per D-18); `/work` and `/id/work` 7 rows, filter 7/3/3/1. PageSpeed mobile both themes: `/` 98–99, `/work` 97–99, `/id` 97–98, `/id/work` 96–99; Accessibility, Best Practices, SEO 100; CLS ≤ 0.001; lab LCP 1.7–3.1 s (varies between runs, no CrUX data yet). Profile photo 640 × 640.

### v2.1.0 — Pointer layer, admin preview, dark theme default (T-34..T-40)

- [x] **T-34** Change v2.1.0 `in-progress`, base 2.0.2 (PR #71).
- [x] **T-35** Dark theme default on public and admin, with and without JS (D-36, PR #72).
- [x] **T-36** Public HTML cache `revalidate = 60` + `expireTime: 120` (D-39, PR #73).
- [x] **T-37** One dot field for the whole page (D-37, PR #75).
- [x] **T-38** v2 "cobalt RR" icons (D-38, PR #76).
- [x] **T-39** O-05 pointer layer (D-31..D-35, PR #77).
- [x] **T-40** S-12/S-13 admin preview panel (PR #78).

## 13. Rules for working with AI coding

AI coding is only as good as the context and limits it gets. These three documents live in the repo under `docs/`, and `AGENTS.md` at the root is the entry point the AI reads in every session.

### `AGENTS.md` content (copy into the repo)

```markdown
# AGENTS.md — rifaldiradya.com

## Specs (source of truth)
- Current: docs/specs/ (check `version` and `status: current` in each file's header).
- Active change: none (or docs/changes/vX.Y.Z-name/CHANGE.md).
- docs/changes/archive/ is history only — never use it as requirements.

## Sources of truth
1. docs/specs/APP_FLOW.md — screens, flows, states, edge cases, API contracts. Most binding.
2. docs/specs/SDD.md — architecture, stack, repo structure, security.
3. docs/specs/PRD.md — product reasoning, copy, visuals, motion.
4. docs/design/v2/option-b.html (public) and docs/design/v2/admin.html (admin) — visual & interaction reference. If the mockup differs from the docs, the docs win; if the docs are silent, follow the mockup. Ignore docs/design/archive/.
If none of them answers: STOP and ask. Do not make it up.

## Hard rules
- Next.js 16 App Router, TypeScript strict, Tailwind v4 tokens from styles/globals.css; `--calm`/`--faint` are not for text.
- Use proxy.ts, not middleware.ts.
- No new dependency without permission; no native dependencies.
- No language auto-redirect; locale only from the URL.
- No GA4/analytics cookies before consent=granted.
- No images on the server filesystem; project images in MySQL (lib/images), served through /media.
- No hardcoded UI text; everything from i18n/en.json and i18n/id.json.
- DB access only in lib/projects, lib/images and lib/auth.
- Do not add screens, fields, features or libraries beyond the docs.
- Scroll motion is CSS only (`@supports` + static fallback); client JS only for the components in PRD §10 and `PointerLayer` (mouse only, loaded separately); no fade-in on the H1.
- Dictionary strings with markers (<em>, <s>, <strong>) are rendered through richText(), not dangerouslySetInnerHTML.
```

### Prompt pattern per task

> Do **T-30** from docs/specs/SDD.md section 12. References: App Flow S-01 (Selected work), E-25, E-30; SDD section 8 (motion). Write a plan first, wait for approval, then implement. Do not change files outside `components/site`, `lib/projects`, `app/[lang]/page.tsx`, `styles/globals.css`.

### Definition of done (per task)

- [ ] The related PRD/App Flow acceptance criteria are met and named one by one.
- [ ] Lint, typecheck, unit tests green; build succeeds.
- [ ] Checked at 375 px and 1280 px; everything new is reachable by keyboard.
- [ ] No hardcoded strings, `any` without a reason, or leftover `console.log`.
- [ ] Small PR with a clear description; reviewed by Pal before merge.

### Habits that keep the AI "on track"

- One AI session = one task. Start a new session for the next task so the context is clean.
- Every decision that departs from the docs is recorded in `docs/DECISIONS.md` (date, what, why), then the docs are updated.
- Do not accept code you do not understand; ask the AI to explain the auth, validation and revalidation parts first.
- Review the diff before committing, especially `proxy.ts`, `lib/auth/*`, `next.config.ts`.

Code execution, testing and pushing to Git are done in a separate setup (vibe-coding-builder), not in this planning project.

## 14. Open decisions & sources

Four things needed an answer or a test before/during Phase 1; the rest is already locked.

- [x] Status of rifaldiradya.com in hPanel: WordPress (its content is not needed) was cleared by Pal and replaced by a new Node.js website on Sep 30, 2026 (section 10, "Move to the main domain").
- [ ] Whether the Hostinger build server can reach MySQL during `next build` (tested in T-06; the design is already safe for both cases).
- [x] Migrations in the `start` command: **not reliable**, because Hostinger runs Next.js directly. Solution: migrations in `instrumentation.ts` (section 3). Before that: run them by hand via phpMyAdmin on every schema change.
- [x] Social link in the footer: LinkedIn (stored in `lib/site-config.ts`, section 9).

**Sources (opened Sep 27, 2026)**

- [Next.js 16 release notes — proxy.ts replaces middleware.ts](https://nextjs.org/blog/next-16)
- [Next.js blog — the 16.3 release and the security release schedule](https://nextjs.org/blog)
- [Hostinger — creating a Node.js app (supported plans, Node versions, existing domain)](https://docs.hostinger.com/node.js/creating-an-app)
- [Hostinger — GitHub integration and automatic builds](https://docs.hostinger.com/node.js/github)
- [Hostinger — MySQL databases and host 127.0.0.1](https://docs.hostinger.com/websites/databases)
- [Hostinger — connecting MySQL to a Node.js app](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
