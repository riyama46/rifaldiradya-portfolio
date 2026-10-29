# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions use SemVer through git tags on `main`: MAJOR = direction, positioning, information architecture, or a compatibility-breaking change; MINOR = a new feature, section or page; PATCH = fixes, copy, small styling.

## [Unreleased]

### Changed

- The code is now MIT-licensed (`LICENSE`); site content (copy, CV, project texts and images) stays all rights reserved.

## [2.2.0] - 2026-10-29

HR automation positioning, demo and code links, HR automation project group. Details: `docs/changes/archive/2026-10-29-v2.2.0-hr-automation/CHANGE.md`, decisions D-40..D-44 in `docs/decisions/DECISIONS.md`.

### Added

- Projects can link a demo video and a code repository (`demo_url`, `repo_url`, optional, https only; migration `0005`): "Watch the demo ↗" and "View the code ↗" in the Work case row, and "Watch the demo ↗" in Selected work. Clicks send `project_link_click` with `link` `site`/`demo`/`code` (#86).
- New project group "HR automation" / "Otomasi HR", first in the Work filter and sub (#86).
- Admin: Demo video URL and Code repository URL fields; four-option group control (#86).

### Changed

- The site presents Pal as an HR automation engineer (n8n + AI) for HR and people-ops clients, with the HRMS work as supporting proof: hero, availability, SEO titles and descriptions, OG images, Highlight meta and Contact copy in EN and ID. JSON-LD `jobTitle` is "HR Automation Engineer" without `worksFor`; Panasonic is named only in About (and the CV) (#86).
- Contact puts "Email about a project" first; the walkthrough and project emails ask about the HR process and tools (#86).
- The "Panasonic" group is labelled "HR systems" / "Sistem HR" (#86).
- The stack line names no AI vendor: n8n · LLM APIs · Google Workspace · C# · ASP.NET · SQL Server (#87).
- `check-deploy.mts` expects the v2.2.0 homepage title.
- Specs (`docs/specs/`) bumped to 2.2.0.
- Docs (`docs/specs/`, CHANGELOG, DECISIONS, AGENTS.md) translated to English for readers of the public repo; content unchanged.
- Highlight copy written for clients instead of recruiters: the HRMS screens are walked through "on a call" (not "in an interview"), and the bridge to contact asks whether the HR team still does this work by hand (#89).

### Fixed

- The "HR automation" filter on Work showed every project: the stylesheet had no hide rule for the `automation` group. Added it, plus a unit test that every project group has its rule (#89).
- Saving a project that has a screenshot failed with "Couldn't save" (HTTP 500) on Hostinger since v2.0.1: the image row lock used `FOR SHARE`, which MariaDB rejects as a syntax error. It now uses `FOR UPDATE`, which MySQL and MariaDB both accept (#88).

## [2.1.1] - 2026-10-23

### Fixed

- The project preview beside the cursor did not show on the Work page after coming from the homepage through the bar (client-side navigation); it only showed after switching language. The pointer layer is now remounted per page, so it uses the active page's `.peek` and zones.
- The Google snippet glued the contact links into one word ("hello@rifaldiradya.comLinkedIn"): links in the contact line are now separated by spaces in the HTML, with no visual change.

## [2.1.0] - 2026-10-22

Pointer layer for desktop, admin preview, dark theme default and visual tidy-ups. Details: `docs/changes/archive/2026-10-22-v2.1.0-pointer-layer/CHANGE.md`, decisions D-31..D-39 in `docs/decisions/DECISIONS.md`.

### Added

- Mouse-only pointer layer: a dot cursor + ring labeled "Read"/"Visit", a light that follows the cursor with a color per chapter, a project preview (screenshot or numbers card) beside the cursor in Selected work and Work, screenshot tilt. Loaded separately, never on touch screens; respects reduced motion and keyboard focus.
- Preview panel in the admin project form (≥ 1024 px): the homepage view and the preview beside the cursor, updating while typing, EN/ID.

### Changed

- The dark theme is the default for every visitor who has not chosen, also without JS; light stays available through the toggle and `?theme=light`.
- The background dots become one field that runs across the whole page with slow parallax.
- v2 "cobalt RR" favicon and app icons.
- Shorter public HTML cache (`s-maxage=60, stale-while-revalidate=60`), so admin changes show within ~2 minutes.
- `check-deploy.mts` expects the GitHub link (since v2.0.2).
- Specs (`docs/specs/`) bumped to 2.1.0.

## [2.0.2] - 2026-10-22

### Added

- GitHub link (public profile) in Contact and the JSON-LD `sameAs` (D-19 met: the repo is now public).

### Changed

- README rewritten for the public repo; the admin email in the spec corrected to hello@rifaldiradya.com.

## [2.0.1] - 2026-10-22

### Fixed

- The login rate limit (E-10) can no longer be bypassed with many simultaneous requests.
- Admin API JSON bodies, login included, are limited to 32 KB also for chunked requests without `Content-Length`.
- Live URLs that are not shown on the page (case button other than "site") no longer appear in the Work page JSON-LD.
- An image deleted in one tab can no longer be saved into a project/profile saved in another tab.

### Changed

- Code cleanup: helpers used only by tests deleted, the build-phase check in one place.

## [2.0.0] - 2026-10-18

The site's direction changes: a full-stack .NET software engineer showcase for recruiters and project clients, with the site as a funnel to email. Details: `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/CHANGE.md`, decisions D-01..D-30 in `docs/decisions/DECISIONS.md`.

### Added

- 5-chapter Home with scroll snap: Hero, Selected work (pinned, max. 5, counter + rail), About (Education, Certifications, Download CV), SSO Highlight, Contact.
- New Work page: group filter (Panasonic, Websites, AI tools), case rows that open (`/work#case-<slug>`), sub computed from data.
- Dark/light theme with a toggle, no flash on load (`rr-theme`).
- Email funnel: mailto with a filled subject and body for 4 kinds (general, role, project, walkthrough), Copy email in Contact, Download CV (web PDF without a phone number).
- v2 project data model (group, meta + side, EN/ID case content, case button, screenshot/numbers card visual, Show in Selected work max. 5); migration `0004`.
- Admin: form per section (What I did per line with multi-line paste, Stack max. 6, case button, visual), list with a group filter, availability switch in Profile.
- GA4 events `case_open`, `cv_download`, `theme_switch`; `contact_email_click` with `kind`.

### Changed

- Positioning, personas, EN/ID copy, SEO meta, JSON-LD `Person` (Software Engineer, `worksFor`, `knowsAbout`), OG images.
- "Option B" visuals: Archivo font, cobalt accent, two-layer tokens; CSS scroll-driven motion with a static fallback.
- `live_url` optional (internal projects without a URL); rolling back to v1 needs a database backup restore (D-21).
- Profile photo at least 640 px (320/640 variants).
- Specs (`docs/specs/`) bumped to 2.0.0.

### Removed

- HeroProofPanel (rotation), service block, the Brief → Build → Live flow, numbered section labels, highlighter, pulsing status dot, final CTA, ProjectCard.
- The `availableForWork` flag (replaced by the availability switch in the admin).

### Fixed

- Pasting several lines into What I did no longer merges them into one line.
- The profile photo and availability are saved in one transaction.

## [1.0.1] - 2026-10-17

### Fixed

- LinkedIn URL changed to `https://www.linkedin.com/in/rifaldiradya` (footer and the JSON-LD Person `sameAs`).

### Changed

- Docs moved to the `docs/specs/` layout (PRD, APP_FLOW, SDD) and `docs/decisions/DECISIONS.md`, with version headers; this CHANGELOG added.
- Workflow: every change goes into `staging` first, then `staging` → `main` (SDD section 10, DECISIONS 2026-10-13).

## [1.0.0] - 2026-10-02

### Added

- Bilingual public site (EN at `/`, ID at `/id`, no language auto-redirect): homepage (hero with a rotating proof panel, services, selected work, about, CTA), `/work`, `/privacy`, 404.
- Admin `/admin`: login with rate limiting, project CRUD with draft/published, ↑/↓ ordering, images compressed in the browser and stored in MySQL (served through `/media`), profile photo.
- SEO: canonical + hreflang, JSON-LD (WebSite + Person), sitemap, robots, OG images; only `rifaldiradya.com` can be indexed.
- GA4 with Consent Mode (nothing loads before Accept); events `contact_email_click`, `project_link_click`, `language_switch`.
- Security: CSP, HSTS, X-Frame-Options, Origin check on admin writes.
- Two environments: `main` → rifaldiradya.com, `staging` → devstaging.rifaldiradya.com, separate databases; CI on both.

[Unreleased]: https://github.com/riyama46/rifaldiradya-portfolio/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/riyama46/rifaldiradya-portfolio/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/riyama46/rifaldiradya-portfolio/releases/tag/v1.0.0
