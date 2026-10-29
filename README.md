# rifaldiradya.com

Source code of [rifaldiradya.com](https://rifaldiradya.com), the bilingual (EN/ID) portfolio of Rifaldi Radya Pratama, a full-stack .NET software engineer. The site shows selected work, an About chapter and a CV download. Every call to action leads to email.

The site has a small admin panel where projects, images and profile content are edited without a redeploy.

## Stack

| Area    | Choice                                                                                |
| ------- | ------------------------------------------------------------------------------------- |
| App     | Next.js 16 (App Router), React 19, TypeScript strict                                  |
| Styling | Tailwind CSS v4 with design tokens in `styles/globals.css`; scroll motion is CSS only |
| Data    | MySQL through Drizzle ORM and `mysql2`; Zod 4 for validation; ULID ids                |
| Auth    | Single admin, bcrypt password hash and server-side sessions (`bcryptjs`)              |
| i18n    | `i18n/en.json` and `i18n/id.json`; locale comes from the URL only (`/` and `/id`)     |
| Tests   | Vitest (unit and integration), Playwright (E2E)                                       |
| CI      | GitHub Actions: lint, typecheck, format check, tests, build                           |
| Hosting | Hostinger Node.js, deployed from GitHub                                               |

## Architecture in short

- **Public pages** live in `app/[lang]` and are statically rendered. `proxy.ts` handles routing: `www` to non-www, locale rewrite and the admin guard.
- **Project images** are stored in MySQL (`lib/images`) and served through `/media` with long-lived cache headers. Nothing is written to the server filesystem.
- **Database access** is allowed only in `lib/projects`, `lib/images` and `lib/auth`.
- **Migrations** are SQL files in `drizzle/`, bundled into the code and applied at server start.
- **Analytics** (GA4) loads only after the visitor grants consent.
- **Secrets** come from environment variables only. `.env.example` lists them with empty values.

## How the project is built: docs, change, build

The repo is built spec-first. The docs are the source of truth, and code follows them.

1. **`docs/specs/`** describes the app as it is live right now: `PRD.md` (what and why), `APP_FLOW.md` (screens, flows, states, API contracts) and `SDD.md` (architecture and rules).
2. **`docs/changes/vX.Y.Z-name/CHANGE.md`** describes the next MINOR or MAJOR version as a delta against the specs: what is added, modified and removed, plus acceptance checks. A patch (fix or tidy-up) skips this step.
3. **Build** implements only what the active change describes, one task at a time, with tests.
4. **Release** merges the change into `docs/specs/`, moves it to `docs/changes/archive/`, updates `docs/CHANGELOG.md` and tags the release.

Decisions that depart from the docs are logged in `docs/decisions/DECISIONS.md`.

Branch flow: feature branch, pull request to `staging`, check on the staging site, then pull request from `staging` to `main`.

## Run locally

Needs Node.js 24 (see `.nvmrc`) and Docker Desktop for the local database.

```bash
npm install
cp .env.example .env.local   # fill in the empty values, see the comments in the file
docker compose up -d db
npm run db:migrate
npm run dev
```

Open http://localhost:3000. Admin login stays disabled until `npm run hash-password` output is placed in `.env.local`.

## Scripts

| Script                               | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `npm run dev`                        | Development server                    |
| `npm run build` / `npm start`        | Production build and server           |
| `npm run lint` / `typecheck`         | ESLint and TypeScript                 |
| `npm run format:check`               | Prettier check                        |
| `npm test`                           | Unit tests (Vitest)                   |
| `npm run test:integration`           | Integration tests against local MySQL |
| `npm run test:e2e`                   | Playwright E2E on a production build  |
| `npm run db:generate` / `db:migrate` | Create and apply migrations           |
| `npm run hash-password`              | Generate admin password hash and salt |

## Repository layout

```text
app/          Next.js routes (public in app/[lang], admin in app/admin)
components/   ui, site, overlays and admin components
i18n/         EN and ID dictionaries, locale helpers
lib/          env, db, auth, projects, images
drizzle/      SQL migrations
scripts/      migration, password hash, OG image and deploy-check scripts
styles/       design tokens, Tailwind, motion
tests/        unit, integration, e2e
docs/         specs, changes, decisions, design mockups
```

## License

The code is released under the [MIT License](LICENSE).

The content is not: the copy in `i18n/`, the CV, project texts and screenshots, the OG images and the personal name and likeness stay all rights reserved.
