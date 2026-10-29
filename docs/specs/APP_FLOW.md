---
doc: APP_FLOW
app: rifaldiradya.com
tier: full
version: 2.2.0
status: current
last_updated: 2026-10-29
last_change: changes/archive/2026-10-29-v2.2.0-hr-automation
---

# App Flow Document — rifaldiradya.com v2

Sep 27, 2026 · @Pal

> **v2.0.0 (Oct 18, 2026).** A 5-chapter Home with scroll snap, a Work page with a filter and case rows, dark/light theme, an email funnel with 4 kinds + Download CV, the v2 project data model. Visual reference: `docs/design/v2/option-b.html` (public) and `docs/design/v2/admin.html` (admin); if the mockup differs from this document, this document wins. Decisions: D-01..D-30 in `docs/decisions/DECISIONS.md`.

## 1. How to use & global rules

This document is the implementation blueprint: every screen, element, flow, state and data contract that may be built. **If something is not here, do not build it; if it is ambiguous, ask first.** The source of "what & why" is the PRD; the source of "technology & architecture" is the SDD.

**ID conventions:** screen `S-xx`, overlay `O-xx`, flow `UF-xx`, edge case `E-xx`, endpoint `API-xx`, PRD feature `F1–F9` (F3 = case row). v2 edge cases start at E-25.

**G1 — Locale from the URL, not from a guess.**

- The locale is decided only from the path: starts with `/id` → `id`, otherwise → `en`.
- The server never redirects based on `Accept-Language`, IP or cookie. `Accept-Language` is only used to decide whether the suggestion banner (O-02) shows.
- `<html lang>` = the page locale. All UI strings come from the i18n dictionary per locale (section 11).

**G2 — Public layout shell (all of S-01 to S-04)**

1. Skip link "Skip to content" / "Langsung ke konten" (shows on keyboard focus).
2. Sticky bar: name → home, Work, About, EN|ID toggle (O-01), theme toggle (O-04), "Email me" button (mailto `general`); below 768 px it follows the mockup.
3. Thin reading progress bar at the top (CSS `scroll()`).
4. `<main id="content">` page content.
5. Small footer: © year, Privacy, Cookie settings (O-03), "Back to top ↑" (home) / "Back to home ↑" (Work).
6. O-02 language suggestion banner and O-03 cookie consent (conditional).

Every chapter has an `aria-hidden` decorative layer (dots + light) and a `data-zone` attribute for the light color.

**G3 — Admin layout shell (S-10 to S-14):** a simple header ("Rifaldi Radya Pratama Admin" · "View site" link in a new tab · theme toggle O-04 · Logout button), no public footer, no O-01/O-02/O-03, no GA4. Admin UI language: EN only. Every admin page sends `noindex, nofollow`.

**G4 — Allowed cookies**

| Cookie | Content | Lifetime | Set by |
| --- | --- | --- | --- |
| `lang_pref` | `en` \| `id` | 365 days | O-01 click, any O-02 action |
| `consent` | `granted` \| `denied` | 180 days | O-03 |
| `admin_session` | session token (httpOnly, secure, sameSite=lax) | 7 days | API-01 |
| `_ga`, `_ga_*` | GA4 cookies | per GA4 | GA4, only after `consent=granted` |

No other cookies. `localStorage` holds only `rr-theme` (`dark` | `light`, set by O-04): a display preference, not sent anywhere, not important state.

**G5 — Dynamic vs static content:** from the database: every project field (section 9) and `availability_on`. From the i18n dictionary: hero, About, education, certifications, Highlight, Contact, mailto, privacy and every UI label. From the repo (static): the CV PDF in `public/cv/`. Public pages are rendered statically and revalidated when the admin changes data.

## 2. Screen inventory

There are 8 public screens (4 per language), 5 admin screens and 4 overlays. There are no other screens.

| ID | EN route | ID route | Access | Render | Purpose | Feature |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | `/` | `/id` | Public | Static + revalidation | Homepage: role, proof, funnel to email/CV | F1, F3, F5 |
| S-02 | `/work` | `/id/work` | Public | Static + revalidation | All published projects as case rows + group filter | F2, F3, F5 |
| S-03 | `/privacy` | `/id/privacy` | Public | Static | Privacy & cookie policy | F8 |
| S-04 | 404 (unknown path) | 404 under `/id/*` | Public | Static | Not found per language | F9 |
| S-10 | `/admin/login` | — | Public (noindex) | Dynamic | Login form | F6 |
| S-11 | `/admin` | — | Needs session | Dynamic | Project list | F7 |
| S-12 | `/admin/projects/new` | — | Needs session | Dynamic | Create project form | F7 |
| S-13 | `/admin/projects/[id]` | — | Needs session | Dynamic | Edit + delete project form | F7 |
| S-14 | `/admin/profile` | — | Needs session | Dynamic | Hero profile photo + availability switch | F1, F7 |
| O-01 | Language toggle (bar) |  | Public | Client | Go to the matching page | F4 |
| O-02 | Language suggestion banner |  | Public | Client | Offer the ID version to Indonesian-language browsers | F4 |
| O-03 | Cookie consent |  | Public | Client | Ask for analytics permission | F8 |
| O-04 | Theme toggle (public bar + admin header) |  | Public + admin | Client | Switch the dark/light theme | F1 |
| O-05 | Pointer layer (desktop mouse) |  | Public | Client | Labeled cursor, light per chapter, project preview, screenshot tilt | F1, F2 |

Extra route rules:

- `www.rifaldiradya.com/*` → 301 redirect to `https://rifaldiradya.com/*` (same path and query); the non-www version is canonical.
- `/en` and `/en/*` → 301 redirect to the path without the prefix (e.g. `/en/work` → `/work`), so there are no duplicates.
- Trailing slashes are removed with a permanent redirect (`/work/` → `/work`); the Next.js default uses 308.
- Every `/admin/*` except `/admin/login` without a valid session → 302 redirect to `/admin/login?next=<path>`.
- `/admin/login` with a valid session → redirect to `/admin`.
- `/admin/projects/[id]` with an id that does not exist → S-11 with the toast "Project not found".

## 3. Navigation map

The important exits: mailto (4 kinds), Download CV, live site (when present), LinkedIn. A project title in S-01 → S-02 `#case-<slug>`. The admin is never linked from public pages.

&#91;embedded content: v1 navigation map · public and admin kept separate\]

Navigation not drawn so the diagram stays readable:

- The bar & footer (G2) are on every public screen: name → S-01, Work → S-02, About → S-01 `#about`, Privacy → S-03, toggle → matching page in the other locale, email → email app.
- Selected work items in S-01 link to the case row in S-02; live site links in S-01 and S-02 go out to a new tab.
- S-04 has buttons to S-01 and S-02.
- S-12 and S-13 return to S-11 after Save, Cancel or Delete (S-13).
- Admin header: "View site" opens `/` in a new tab; Logout → S-10.

## 4. Public screen specs

Every public screen uses the G2 shell. Text in quotes is EN copy; the ID equivalent is in the i18n dictionary (section 11), referenced by the key `[key]`.

### S-01 Homepage (`/`, `/id`)

The chapter order is fixed; no extra chapters are allowed. Each chapter is one screen (`100svh`) with `y proximity` scroll snap (off under reduced motion); a chapter may be taller when its content is long. No numbered section labels.

| # | Chapter | Elements (in order) | Rules |
| --- | --- | --- | --- |
| 1 | Hero `#top` | round photo (S-14 avatar, no photo → initials "RR") → label `[hero.role]` + `[hero.loc]` → availability line (dot + `[hero.open]`) when `availability_on` → two-line H1 `[hero.l1]` / `[hero.l2]` (one `<em>` accent word) → `[hero.sub]` → Stack line → "Email me" button (`general`) → "Scroll ↓" link to `#work` | The H1 rises in over 900 ms without fade (D-10); no priority image other than the small avatar with explicit `width`/`height`; LCP = H1. |
| 2 | Selected work `#work` | H2 `[work.h]` + "0n / 0N" counter → project items: label `0n / 0N · {meta} · {side}`, H3 title (link to the case, arrow →), description (`summary`), "Open the live site ↗" link when `case_action = site`, "Watch the demo ↗" link when `demo_url` is set (D-42; new tab, `data-link="demo"`), screenshot (linking only to `live_url`) when `visual_type = screenshot` → rail of project names (anchors `#w1..#wN`) → "See all work →" to S-02 | Data: `published AND show_on_home`, ordered by `sort_order`, max. 5. Pinned: each item is one scroll step (sticky + snap); without scroll-driven support or under reduced motion → a plain stacked list. 0 items → E-25. Links and screenshots carry the `data-cursor` attribute (`read`/`visit`); the title also has `data-preview="<slug>"` (O-05). |
| 3 | About `#about` | H2 `[about.h]` → statement `[about.s]` (fills line by line on scroll) → `[about.p1]`, `[about.p2]` → Education (`e1..e3`) → Certifications → Download CV link | Without scroll-driven support the statement shows in full. |
| 4 | Highlight `#highlight` | label `[case.meta]` → statement `[case.t]` (the `<s>` part is struck through on entry) → 3 numbers (5 → 1, ~200, 13; numbers count up via CSS) + labels → note `[case.blur]` → bridge sentence `[bridge.q]` + link `[bridge.go]` to `#contact` | The real numbers are always in the DOM (`sr` text), so screen readers and browsers without support read the final value. |
| 5 | Contact `#contact` | label `[ct.label]` → H2 `[ct.h]` → `[ct.pitch]` → `project` button (primary) + `role` (secondary) (D-44) → reach line: email (mailto `general`) + Copy email, LinkedIn ↗, Download CV, GitHub ↗ (when filled in), `HH:mm GMT+7` clock → footer | Clock: static text "GMT+7" before JS; after mount `HH:mm` in the `Asia/Jakarta` zone, `tabular-nums`, no layout shift. |

### S-02 Work (`/work`, `/id/work`)

1. Label `[wp.label]` → H1 `[nav.work]` + number of published projects (`<sup>`) → sub `[wp.sub]`, built from the number of projects per group (D-30): empty groups are not mentioned, numbers up to ten are words, singular/plural follows the number; with no projects the sub is not rendered.
2. Filter `[wp.filter]` (group `role="group"`): All / HR automation / HR systems / Websites / AI tools buttons with counts (D-43); the active one is marked with `aria-pressed`. Without JS the filter is not rendered and all rows show. An empty group has no button.
3. An `<ol>` list of rows: `<details id="case-<slug>">` with `<summary data-preview="<slug>">` (O-05) holding title · meta · side · +/− icon; content: What it is (`case_is`), What I did (`<ul>` from `case_did`), Stack (`tags` joined with " · "), Status, then the button for `case_action`: `site` → "Open the live site ↗" (`live_url`, new tab); `walkthrough` → "Email to ask for a walkthrough" (mailto `walkthrough` with the project title); `none` → no button. After it, "Watch the demo ↗" (`demo_url`) and "View the code ↗" (`repo_url`) when set, in that order, new tab, `rel="noopener noreferrer"` (D-42). The details column shows when any of stack, status, a case button, demo or code exists.
4. Hash `#case-<slug>` on load or on hash change → open that row, scroll to it, focus the `<summary>`, send `case_open` (`source: hash`). Opening a row by click → `case_open` (`source: row`). A filter that hides the target row is reset to All.
5. Closing Contact chapter `#more` with H2 `[ct.h.more]` "Have a project like *these?*" and two mailto buttons; footer with "Back to home ↑".
6. Data: `published=true`, ordered by `sort_order`, no limit. 0 projects → E-01.

### S-03 Privacy (`/privacy`, `/id/privacy`)

H1 + static text from the i18n dictionary: what is tracked (GA4, anonymous, only with permission), the cookies used (a reader-friendly version of the G4 table), the `rr-theme` storage in the browser, the CV PDF as a static file with no tracking other than the `cv_download` event with consent, how to change the choice (a "Cookie settings" button that opens O-03), contact email. No dynamic data.

### S-04 Not found

HTTP status 404. The locale follows the path prefix (`/id/xyz` → ID version). Content: H1 `[notFound.title]` "This page doesn't exist", one sentence, buttons to S-01 and S-02. The bar and footer still show (v2 style). `noindex`.

## 5. Global overlays

O-01..O-03 appear on every public screen and never in the admin; O-04 is in the public bar and the admin header. O-02/O-03 use the v2 style with their position and logic unchanged. The language banner and GA4 are active only when all their conditions are met.

&#91;embedded content: O-02 and O-03 display logic\]

### O-01 Language toggle

- Display: two text buttons, EN and ID, separated by a thin line; the active one uses the accent style and gets `aria-current`. The group has `aria-label` Language.
- Click on the inactive language: set `lang_pref`, send the `language_switch` event (with consent), navigate to the matching path: `/` ↔ `/id`, `/work` ↔ `/id/work`, `/privacy` ↔ `/id/privacy`; the hash anchor is carried along (`/#work` → `/id#work`). From S-04 → the homepage of the target locale.
- Click on the language that is already active: nothing happens.
- The toggle is a real `<a href>` link (can open in a new tab, can be crawled), not a JS-only button.

### O-02 Language suggestion banner

- Evaluated on the client after the page shows, without blocking render and without shifting layout: a 48 px overlay, below the bar from 768 px and stuck to the bottom of the screen on phones (the phone hero is only 24 px from the bar, so a top overlay would cover the byline). On screens < 420 px only the buttons show; the sentence stays as the region label for screen readers.
- Display conditions (see diagram): the path is not `/id*`, the `lang_pref` cookie does not exist, and `navigator.languages` holds an entry that starts with `id`.
- Content: Also available in Indonesian. + a Lihat versi Indonesia button + a close button (cross icon, `aria-label` Dismiss).
- Lihat versi Indonesia → set `lang_pref=id` → open the matching ID page. Close → set `lang_pref=en` → the banner goes away. Both are permanent until the cookie expires.
- On mobile it does not show at the same time as O-03: if O-03 shows, O-02 waits until O-03 is closed.

### O-03 Cookie consent

- Shows when the `consent` cookie does not exist yet. Position: a bar at the bottom of the screen (full width on mobile, a bottom-right card max. 420 px on desktop). It does not cover the hero CTA at 375 × 667.
- Content: 1–2 sentences `[consent.body]` + Privacy link + Accept and Reject buttons with equal visual weight (no dark pattern).
- Accept → `consent=granted` → update Consent Mode (`analytics_storage: granted`) → GA4 sends `page_view` for the current page. Reject → `consent=denied`, GA4 stores no cookie.
- The Cookie settings footer link and the button in S-03 open O-03 again with the current choice marked. Changing from granted to denied also deletes the existing `_ga*` cookies.
- The user ignores the banner: treated as denied, the banner shows again on the next page.

### O-04 Theme toggle

- Icon button with a hidden text label (`aria-label` `[theme.toLight]`/`[theme.toDark]` according to the current theme).
- Click → set `data-theme` on `<html>`, store `rr-theme`, `theme_switch` event (with consent).
- An inline script in `<head>` (before paint) applies the D-23/D-36 order: `?theme=` query → `rr-theme` → `dark`; the device setting is not used; no flash of the wrong theme.
- 300 ms color transition; reduced motion → instant. Without JS the toggle does not show (E-07); `localStorage` blocked → E-31.

### O-05 Pointer layer (public, desktop mouse)

- Active only when `(hover: hover) and (pointer: fine)` matches and the event comes from `pointerType === "mouse"` (D-31); the `PointerLayer` component is loaded separately after idle, never on touch screens. The media query changes → the layer is turned off and every class is cleaned up.
- `aria-hidden` elements: `.spot` (light ~820 px, color and strength per chapter through `data-zone` on `<html>`), `.cur-dot`, `.cur-ring` (with a label), `.peek` (screenshot or numbers card for each published project shown on that page, rendered by the server). While active, the static CSS light per chapter is hidden.
- Triggers: elements with `data-cursor` (`read`|`visit`) give the label `[cur.read]`/`[cur.visit]`; other `a, button` make the ring grow without a label; `data-preview="<slug>"` elements (Selected work title, Work row `<summary>`) show that project's preview (340 px, 16:10); `.shot` gets tilt (max. about 6°, 500 ms). Pressing the mouse → the ring shrinks.
- Light zones: an IntersectionObserver (`rootMargin: -45% 0 -45% 0`) writes `data-zone`; no `scroll` listener (D-33). One `requestAnimationFrame` loop that stops once everything is at the cursor position (difference < 0.4 px); only `transform` and `opacity` (D-32).
- Reduced motion: the dot and ring stay without lag, no tilt, light and preview without transitions (D-34).
- Keyboard focus (`:focus-visible`) → the layer is hidden and the native cursor comes back until the mouse moves again (D-35). Leaving the window → everything is hidden. Edge cases: E-33, E-34.

## 6. Admin screen specs

Every admin screen uses the G3 shell, one column below 768 px, input font ≥ 16 px, and the main action buttons are always visible with no horizontal scroll.

### S-10 Login (`/admin/login`)

| Element | Rule |
| --- | --- |
| Heading | "Sign in" |
| Email | `type=email`, `autocomplete=username`, required |
| Password | `type=password`, `autocomplete=current-password`, required, show/hide button |
| Button | "Sign in"; on submit → disabled + spinner, text "Signing in…" |
| Credential error | Above the form: "Email or password is incorrect." The password field is cleared, focus goes to password. |
| Rate limit error | "Too many attempts. Try again in {n} minutes." The button is disabled until the time is up. |
| Success | Redirect to `next` (when it is a valid `/admin*` path) or `/admin`. |

No "forgot password" and no "sign up" links. Password reset is done manually through a script/ENV (explained in the SDD).

### S-11 Project list (`/admin`)

- Page header: "Projects" + count ("2 projects") + primary button "New project" → S-12.
- List of rows (desktop: table; mobile: stacked cards), ordered by position (`sort_order`) asc. Columns: # position · Visual (64 × 40 thumbnail or card number) · EN title (link to S-13) + small meta · Group · Status (Published/Draft) · Shown (Homepage / Work page only) · Updated (relative) · ↑/↓ · Edit. Group filter above the list (client-only, does not change the order).
- **Order (T-18b):** ↑ / ↓ buttons (44 × 44 px, label "Move {title} up/down") swap the project with its neighbor through API-08 and save right away; ↑ is disabled at #1, ↓ is disabled at the last position. Focus stays on the pressed button, and the new position is announced to screen readers. Positions are always 1…n with no duplicates; there is no order field in the form. No drag-and-drop, inline toggle or bulk action; other changes go through S-13.
- The admin header (G3) has the navigation "Projects" · "Profile" (S-14).
- Info below the header: "{n} projects · {p} published · {d} drafts"; "Selected work on the homepage: {k} of 5. Turn one off before adding another." (yellow when k = 5); "The order here is the order on the site. Use ↑ and ↓ to move a project."
- Empty state (0 projects): "No projects yet. Add your first one to show it on the site." + a "New project" button.
- Success toast from the previous action ("Project created", "Changes saved", "Project deleted") shows for 4 seconds, `role=status`.

### S-12 New project and S-13 Edit project

The same form. S-13 is filled with data and has a delete zone.

| # | Section | Field | UI type | Validation | Required to publish |
| --- | --- | --- | --- | --- | --- |
| 1 | Basics | Title EN / ID | text + counter | 1–80 | yes |
| 2 | Basics | Group | segmented: HR automation / HR systems / Websites / AI tools | enum `automation`\|`panasonic`\|`web`\|`ai` | yes (default `web`) |
| 3 | Basics | Meta line EN / ID | text + counter | 1–40, e.g. "HRMS · 13 companies" | yes |
| 4 | Basics | Side EN / ID | text + counter | 0–20, e.g. "2022–now", "WordPress"; help: "Right column on the Work page, and the end of the homepage label." | no |
| 5 | Homepage | Short description EN / ID | textarea + counter | 1–160 (`summary` column) | yes |
| 6 | Homepage | Show in Selected work | switch | max. 5 projects with the switch on (drafts included); the 6th → E-26 | no |
| 7 | Case | What it is EN / ID | textarea + counter | 1–220 | yes |
| 8 | Case | What I did EN / ID | list of lines (+ Add a line, × remove, fixed order; pasting several lines fills one line per field) | 1–8 lines per language, each line 1–160; empty lines are dropped on save | yes (≥ 1 line per language) |
| 9 | Case | Stack | chips (Enter/comma) | 0–6 items, 1–24 characters, unique (`tags` column) | no |
| 10 | Case | Status EN / ID | text | 1–40, e.g. "Live, 2022–now" | yes |
| 11 | Button on the case | Case action | radio: Open the live site / Email to ask for a walkthrough / No button | enum `site`\|`walkthrough`\|`none` | yes (default `site`) |
| 12 | Button on the case | Live URL | url, "optional" | empty or a valid `https://` max. 300; **required when case action = site** | conditional |
| 12a | Button on the case | Demo video URL | url, "optional" | empty or a valid `https://` max. 300, e.g. YouTube or Google Drive | no |
| 12b | Button on the case | Code repository URL | url, "optional" | empty or a valid `https://` max. 300, e.g. GitHub | no |
| 13 | Visual | Visual type | segmented: Screenshot / Number card | enum `screenshot`\|`number` | yes (default `screenshot`) |
| 14 | Visual | Screenshot + alt EN/ID | ImageUploader (16:10) + text | JPG/PNG/WebP, ≤ 5 MB, min 1200 px wide, cropped 16:10; alt 1–140; required when type = screenshot | conditional |
| 15 | Visual | Number + Caption EN/ID | text + counter | number 1–12 (e.g. "13", "5 → 1"); caption 1–60; required when type = number | conditional |
| 16 | Publishing | Published | switch | Publish needs every "yes" field + valid conditionals | — |

- Help for the Visual section: "Used for the homepage picture and the preview next to the cursor on the Work page." Screenshot and number data may be stored at the same time; the one used follows `visual_type`.
- When Live URL is empty and case action = site → error "Add a live URL, or choose another button."
- Preview panel at ≥ 1024 px (sticky beside the form, hidden below that): "Preview on the homepage" (meta · side label, title, description) and "Preview next to the cursor" (screenshot or numbers card; an incomplete visual → hint text, the same as E-33). It updates while typing without saving; EN with a button to switch to ID.
- Layout: the form is split by section (table above); EN and ID fields sit side by side at ≥ 1024 px and stack (EN first) below that. No language tabs, so both versions are visible at the same time.
- Bottom buttons (sticky on mobile): primary "Save" + secondary "Cancel". Save is disabled while an upload runs.
- Client validation on blur + server validation on submit; the error message sits below the field and says how to fix it (section 11). When submit fails, focus moves to the first error field and an error summary appears above the form.
- Cancel with unsaved changes → "Discard changes?" dialog (Discard / Keep editing). Leaving through browser navigation also triggers a `beforeunload` warning.
- ImageUploader: pick a file → type & size validation on the client → compress in the browser (16:10 crop, 4 WebP widths) → direct upload (API-06) with a progress bar → preview → "Replace" and "Remove" buttons. The old image in storage is deleted only after the project is saved with the new image.
- **Delete zone (S-13 only):** at the very bottom, separated by a line, a red "Delete project" button → ConfirmDialog "Delete {title EN}? This removes it from the site and deletes its image. This can't be undone." (Delete / Cancel). Initial focus on Cancel.

### S-14 Profile (`/admin/profile`)

- Heading "Profile".
- Photo: ImageUploader in avatar mode, JPG/PNG/WebP ≤ 5 MB, at least 640 × 640 px, center-cropped square, compressed in the browser to 320 and 640 px; round preview; Replace / Remove. Help: "Shown as a small circle next to your role in the hero. Upload at least 640 × 640 px so it stays sharp." An old 320 px photo keeps showing until it is replaced (E-32). No photo → initials "RR".
- Availability: one "Show availability" switch + help "Hide it when you are not taking new work, or when you'd rather people at work didn't see it." No text field (D-16).
- "Save" button (disabled during an upload or when nothing changed) → API-09 (photo and availability saved in one transaction) → revalidate every public page → toast "Profile saved" (yellow if revalidation fails, E-19).

## 7. User flows

The 10 flows below are every path that must work. Each step names the screen and the expected result.

### UF-01 An HR lead evaluates Pal (EN) — main flow

1. An HR or people-ops lead opens a link from Upwork or LinkedIn on a phone → S-01; O-03 shows.
2. Reads the role label, H1, sub, stack.
3. Scrolls to Selected work; on "HR Onboarding Automation" taps "Watch the demo ↗" when set (`project_link_click` placement `home`, link `demo`), or the title → S-02 `#case-hr-onboarding-automation` → "View the code ↗" (link `code`).
4. Back to home → Contact → "Email about a project" (kind `project`), with the automation body (section 11).

### UF-01b A recruiter evaluates Pal (EN)

1. The recruiter opens a link from LinkedIn on a phone → S-01; O-03 shows.
2. Reads the role label, H1, sub, stack.
3. Scrolls to Selected work; taps the "HR System" title → S-02 `#case-hr-system` opens (`case_open` source `home_title`).
4. Reads the case; taps "Email to ask for a walkthrough" → mail app with the subject "Walkthrough: HR System" and a filled body (`contact_email_click` kind `walkthrough`, location `case`).
5. Alternative: back to home → About → Download CV (`cv_download` location `about`), or Contact → "Email about a full-time role" (kind `role`).

### UF-02 A local visitor moves to the Indonesian version

1. A visitor with an Indonesian-language browser opens `/` → S-01 EN + O-02 appears (if O-03 is not showing on mobile).
2. Clicks "Lihat versi Indonesia" → `lang_pref=id` → `/id`.
3. Next visit to `/`: O-02 does not appear again (the cookie exists); the visitor can still use the toggle.
4. Alternative: clicks close on O-02 → `lang_pref=en`, stays on EN.

### UF-03 Contact via email

1. Click an email button (bar, hero, Contact, S-02 closing Contact, or the walkthrough button in a case) → `contact_email_click` event with `kind` and `location` → the browser opens `mailto:hello@rifaldiradya.com` with the subject and body for that kind and locale (section 11).
2. If there is no mail client, the visitor uses the "Copy email" button in Contact → the address is copied → the label changes to "Copied" for 2 seconds (`aria-live=polite`).
3. If the Clipboard API fails (E-09) → the address text is selected automatically so it can be copied by hand.

### UF-04 Switch language with the toggle

1. On any page, click the inactive language in O-01.
2. `lang_pref` is set → move to the matching path (including the hash) → the target page shows in the new locale; O-02 does not appear.

### UF-05 Manage consent

1. First visit → O-03 shows.
2. Accept → GA4 is active from this page. Reject → no GA4.
3. Any time: footer "Cookie settings" → O-03 with the current choice → change → applies right away without a reload.

### UF-06 Admin login

1. Pal opens `/admin` → no session → redirect `/admin/login?next=/admin`.
2. Fill in email + password → Sign in → API-01.
3. Success → session cookie → redirect to `next`. Failure → error message (S-10), stays on the page.

### UF-07 Add a new project

&#91;embedded content: UF-07 add project · 6 steps, 1 server validation\]

1. In S-11 click "New project" → empty S-12, Published off, Show in Selected work off. Once saved, the new project goes to position #1 automatically and the others move down one.
2. Fill in Basics, Homepage, Case (EN and ID), the case button (+ Live URL for a site).
3. Visual: upload a screenshot → API-06 → the preview shows, fill in the EN and ID alt; or fill in the numbers card.
4. Turn on Published (and Show in Selected work if needed) → Save → API-03.
5. The server rejects it (422) → errors per field, every input stays, focus on the first error; fix it and Save again.
6. The server accepts it → save → revalidate `/`, `/work`, `/id`, `/id/work` → redirect S-11 + toast "Project created".
7. Open the public site: the project shows in S-02 (and in Selected work in S-01 when Show in Selected work is on) within ≤ 60 seconds.

### UF-08 Edit or unpublish a project

1. S-11 → click title/Edit → filled S-13.
2. Change fields (e.g. turn off Published to hide it) → Save → API-04 → revalidate 4 pages → S-11 + toast "Changes saved".
3. The unpublished project disappears from the public site within ≤ 60 seconds and stays in S-11 with a Draft badge.

### UF-09 Delete a project

1. S-13 → "Delete project" → ConfirmDialog.
2. Delete → API-05 → data and image are deleted → revalidate → S-11 + toast "Project deleted". Cancel → the dialog closes, nothing changes.

### UF-10 Logout & expired session

1. Click Logout → API-02 → the session cookie is deleted → S-10.
2. The session expires while filling a form → Save returns 401 → the form is not cleared, and the message "Your session expired. Sign in again in a new tab, then save." appears with a `target=_blank` login link (E-11).

## 8. States & edge cases

Every edge case below must be handled exactly as in the "Behavior" column; there must be no empty screen, raw error or stack trace visible to visitors.

| ID | Screen | Condition | Behavior |
| --- | --- | --- | --- |
| E-01 | S-01, S-02 | 0 published projects | S-01: the Selected work chapter is not rendered (E-25). S-02: text `[work.empty]` "New work is on the way. Meanwhile, here's how to reach me." + a button to `#contact`. |
| E-02 | S-01, S-02 | The database cannot be reached during revalidation | The last static page is still served; the error is written to the server log. A first build without a DB → render E-01, not a failed build. |
| E-03 | S-01 | `show_on_home` > 5 (old data) | Selected work: the top 5 by order. The rest still show in S-02. |
| E-05 | S-01 | Screenshot fails to load | The screenshot space stays reserved; the title, description and link still work. |
| E-06 | S-01, S-02 | The live site is down | Outside the site's control; no automatic check. Pal changes the case action or turns off Published by hand if needed. |
| E-07 | All public | JavaScript off | All content, links, the language toggle (plain links) and mailto still work; the theme is always dark (D-36) and the theme toggle does not show; case rows can still be opened, the filter does not show, the clock is static "GMT+7"; O-02, O-03, GA4, Copy email do not appear. |
| E-09 | Contact | Clipboard API unavailable/denied | The email address is selected automatically + tooltip "Press Ctrl/Cmd+C to copy". |
| E-10 | S-10 | 5 failed logins within 15 minutes from one IP, or 20 from all IPs | 429 + rate limit message; the button is disabled until the time is up. |
| E-11 | S-12, S-13 | Session expires on submit | 401, input kept, message + login link in a new tab (UF-10). |
| E-12 | S-12, S-13 | Upload fails (network, broken file, > 5 MB, wrong type) | A specific message below the uploader (section 11), a Retry button; other fields are not affected; Save is disabled while the upload runs. |
| E-13 | S-12, S-13 | Save fails because of a server error (500) | Red toast "Couldn't save. Your changes are still here — try again.", input kept. |
| E-14 | S-13 | The project was already deleted in another tab | Save/Delete returns 404 → redirect S-11 + toast "This project no longer exists." |
| E-15 | S-13 | Two tabs edit the same project | v1: last write wins (only 1 admin). No locking. |
| E-16 | S-12, S-13 | Published is on but the publish-required fields are not complete | Validation rejects it with a message on the related field; suggestion "Turn off Published to save as draft." |
| E-17 | S-12, S-13 | A draft is saved without a visual | Allowed; in S-11 the Visual column shows empty. |
| E-18 | All public | Unknown path | S-04 with status 404 in the locale of the prefix. |
| E-19 | Revalidation | Revalidation fails after save | The data stays saved; yellow toast "Saved, but the site may take a few minutes to update."; pages can still revalidate on a time basis (max. 1 hour) as a safety net. |
| E-20 | All | ID text is much longer than EN | The layout must not break: buttons may wrap, no text is cut off; a one-screen chapter may be taller than one screen when its content is long. |
| E-25 | S-01 | Selected work has 0 projects (`show_on_home` empty) | The Selected work chapter is not rendered; Hero "Scroll ↓" goes to `#about`; S-02 still shows every project. |
| E-26 | S-12, S-13, API-03/04 | The 6th Show in Selected work switch | The switch is disabled in the UI with help text; the server rejects it with 422 if it is sent anyway. |
| E-27 | S-02 | A published v1 project without v2 fields | The row shows with title + summary; empty case parts are hidden; no button when `live_url` is empty; it stays valid until edited, and on Save the publish fields must be completed. |
| E-28 | S-01, S-02 | `case_action = site` but `live_url` is empty (old/broken data) | Treat it as `none`, write a warning to the server log. |
| E-29 | S-02 | `#case-<slug>` does not exist or the project is a draft | The Work page opens at the top, with no error. |
| E-30 | S-01 | Browser without `animation-timeline` (Firefox today) or reduced motion | Every chapter shows as a static stack in its final state (full statement, final numbers, "five passwords" already struck through), Selected work as a plain list, scroll snap off under reduced motion. |
| E-31 | All | `localStorage` unavailable (private mode, blocked) | Dark theme; the toggle still switches the theme for that session without errors. |
| E-32 | S-01, S-14 | Avatar not replaced yet (320 px) | Still shows; no public warning; S-14 shows "Current file is 320 px. A larger one is recommended." |
| E-33 | O-05 | A project without a valid visual (missing screenshot or empty numbers card) | No preview is shown for that project; the cursor label stays. |
| E-34 | O-05 | The page is opened with a mouse and then switches to touch | The layer is turned off on the first `pointerType` that is not a mouse, and turned on again on the next mouse `pointermove`. |
| E-35 | S-01, S-02 | `demo_url` / `repo_url` stored but not `https:` (old or edited data) | The link is not rendered; no warning needed. |
| E-36 | S-02 | Only projects in group `automation` (or one group) are published | The filter shows All + that group (existing empty-group rule). |

## 9. Data model

One business entity: **Project**, plus site settings. Admin credentials and sessions are technical data; their storage mechanism (table vs environment variable) is decided in the SDD, but their behavior is locked here.

### Project

| Field | Type | Required | Rule | Used in |
| --- | --- | --- | --- | --- |
| `id` | string (UUID/cuid) | yes | created by the server, cannot be changed | S-13 route, API |
| `slug` | string | yes | created automatically from `title_en` (kebab-case, unique, `-2` added on a clash); not shown in the v1 UI | analytics events, schema, future (case study) |
| `title_en` / `title_id` | string | yes | 1–80 characters, trimmed | Selected work, case row, admin, schema |
| `group` | enum `automation`\|`panasonic`\|`web`\|`ai` (labels HR automation / HR systems / Websites / AI tools; D-43) | yes | default `web` | S-02 filter, S-11 |
| `meta_en` / `meta_id` | string or null | publish | 1–40 | case row, Selected work label |
| `side_en` / `side_id` | string or null | no | 0–20 | right column of the case row, end of the Selected work label |
| `summary_en` / `summary_id` | string | yes | 1–160 characters, trimmed, plain text (no HTML/markdown) | short description in Selected work; stands in for `case_is` when empty (E-27) |
| `case_is_en` / `case_is_id` | string or null | publish | 1–220 | case row |
| `case_did_en` / `case_did_id` | string\[\] or null | publish | 1–8 items, each 1–160 | case row |
| `tags` | string\[\] | no | 0–6 items, each item 1–24 characters, unique (case-insensitive) | "Stack" in the case row |
| `status_en` / `status_id` | string or null | publish | 1–40 | case row |
| `case_action` | enum `site`\|`walkthrough`\|`none` | yes | default `site` | case row button, Selected work link |
| `live_url` | string or null | when `case_action = site` | valid URL, `https` scheme, max. 300 | site link, schema |
| `demo_url` | string or null | no | valid URL, `https` scheme, max. 300 | "Watch the demo ↗" in Selected work and the case row (D-42) |
| `repo_url` | string or null | no | valid URL, `https` scheme, max. 300 | "View the code ↗" in the case row (D-42) |
| `visual_type` | enum `screenshot`\|`number` | yes | default `screenshot` | Selected work, S-11 |
| `thumbnail` | object or null | when `visual_type = screenshot` and published | `{ public_id, url, width, height }` from image storage | Selected work, admin |
| `thumbnail_alt_en` / `thumbnail_alt_id` | string or null | required when there is a thumbnail | 1–140 characters | image alt |
| `card_number` | string or null | when `visual_type = number` | 1–12 | numbers card (preview beside the cursor, O-05) |
| `card_caption_en` / `card_caption_id` | string or null | when `visual_type = number` | 1–60 | numbers card |
| `show_on_home` | boolean | yes | default false; max. 5 set to true (drafts included) | Selected work |
| `sort_order` | integer | yes | position 1…n, unique, managed by the server: new project = 1 (others +1), ↑/↓ swaps two neighbors (API-08), delete closes the gap; `updated_at` does not change from a position shift | order of every list |
| `featured` | boolean | — | **deprecated**, not read/written (D-22) | — |
| `published` | boolean | yes | default false | public filter |
| `created_at` / `updated_at` | datetime (UTC) | yes | filled by the server | secondary order, sitemap `lastmod`, S-11 |

**Derived rules**

- The public only sees `published = true`. Drafts never leak into HTML, the sitemap, schema or a public API.
- Standard order: `sort_order` (position) asc; `created_at` desc only as a fallback when positions are equal (does not happen after migration 0003).
- Deleting a project also deletes `thumbnail.public_id` in storage. Replacing a thumbnail deletes the old image after the save succeeds.
- Sitemap `lastmod` = `max(updated_at)` of published projects.
- Selected work = `published AND show_on_home` ordered by `sort_order`, max. 5.
- Published v1 projects whose v2 fields are not filled in yet stay valid and show in S-02 with the empty case parts hidden (E-27), until edited.

**Public DTO (the data shape public components receive, per locale)**

```json
{
  "id": "clx123",
  "slug": "hr-system",
  "group": "panasonic",
  "title": "HR System",
  "meta": "HRMS · 13 companies",
  "side": "2022–now",
  "summary": "The HR system a 13-company manufacturing group runs on.",
  "caseIs": "A legacy HRMS that a 13-company manufacturing group in Indonesia runs on.",
  "caseDid": ["One of three developers on the system since November 2022."],
  "stack": ["ASP.NET Web Forms", "C#", "SQL Server", "Azure"],
  "status": "Live, 2022–now",
  "caseAction": "walkthrough",
  "liveUrl": null,
  "demoUrl": null,
  "repoUrl": null,
  "visual": { "type": "number", "number": "13", "caption": "group companies on one HR system" },
  "showOnHome": true
}
```

`visual` = `{ type: "screenshot", url, width, height, alt }` | `{ type: "number", number, caption }` | `null`.

The example above only illustrates the shape; the real project content is filled in by Pal through the admin.

### Site settings

- `availability_on` boolean, default true when never saved (S-14).
- `profile_photo` avatar image id or null (S-14).

### Admin credentials & session (behavior)

- Exactly one admin. Email + password hash (bcrypt/argon2) stored on the server side, never in the repo or the client.
- Session: a random token or a signed token in the `admin_session` cookie (G4), valid for 7 days, revoked on logout.
- Login rate limit: 5 failures / 15 minutes / IP.

## 10. Admin API contract

Only the admin writes data; public pages read directly on the server during render, so there is no public API. The contract below holds whether the SDD implements it as a Route Handler or a Server Action: input, output and error codes must be the same.

**General rules**

- Every endpoint is under `/api/admin/*`; all except API-01 need a valid `admin_session` cookie → otherwise: `401 UNAUTHENTICATED`.
- Write requests must be same-origin (`Origin` header = the site domain) → otherwise: `403 FORBIDDEN_ORIGIN`.
- JSON body except API-06 (multipart). Server validation uses the same rules as sections 6 and 9.
- The error shape is always:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Some fields need attention.", "fields": { "live_url": "URL must start with https://" } } }
```

| ID | Method & path | Request | Success | Error |
| --- | --- | --- | --- | --- |
| API-01 | `POST /api/admin/login` | `{ email, password }` | `200 { ok: true }` + session Set-Cookie | `400 VALIDATION_FAILED` · `401 INVALID_CREDENTIALS` · `403 FORBIDDEN_ORIGIN` · `429 RATE_LIMITED` + `retryAfterSeconds` (+ `Retry-After` header) · `503 ADMIN_NOT_CONFIGURED` (admin env not valid) · `500 SERVER_ERROR` |
| API-02 | `POST /api/admin/logout` | — | `204` + cookie deleted | — (always succeeds) |
| API-03 | `POST /api/admin/projects` | `ProjectInput` | `201 { project, revalidated: boolean }` | `401` · `422 VALIDATION_FAILED` + `fields` (including `fields.show_on_home` "Selected work already has 5 projects. Turn one off first.", E-26) · `500 SERVER_ERROR` |
| API-04 | `PATCH /api/admin/projects/:id` | partial `ProjectInput` | `200 { project, revalidated }` | `401` · `404 NOT_FOUND` · `422` (including E-26) · `500` |
| API-05 | `DELETE /api/admin/projects/:id` | — | `200 { revalidated }` (the image is deleted too) | `401` · `404` · `500` |
| API-06 | `POST /api/admin/uploads` | multipart: 1–4 `variant` parts (widths from the browser compression of one image); `kind=avatar` at least 640 × 640 | `201 { public_id, url, width, height }` | `401` · `413 FILE_TOO_LARGE` · `415 UNSUPPORTED_TYPE` · `422 IMAGE_TOO_SMALL` / `VALIDATION_FAILED` · `502 UPLOAD_FAILED` |
| API-07 | `DELETE /api/admin/uploads/:public_id` | — | `204` | `401` · `404` (treated as success by the UI) · `409 IMAGE_IN_USE` (the image is used by a saved project or the profile photo; not deleted) |
| API-08 | `POST /api/admin/projects/:id/move` | `{ direction: "up" | "down" }` | `200 { position, revalidated }` (the position stays when already at the end) | `401` · `404` · `422 VALIDATION_FAILED` · `500` |
| API-09 | `PUT /api/admin/profile` | `{ photo_public_id?: string \| null, availability_on?: boolean }` (fields not sent do not change; the photo comes from API-06 `kind=avatar`, square) | `200 { photo, availability_on, revalidated }`; both are saved in one transaction; the old photo is deleted; avatar variants 320/640 | `401` · `422` + `fields.photo` / `fields.availability_on` · `500` |

**`ProjectInput`**

```json
{
  "title_en": "string", "title_id": "string",
  "group": "automation | panasonic | web | ai",
  "meta_en": "string", "meta_id": "string",
  "side_en": "string", "side_id": "string",
  "summary_en": "string", "summary_id": "string",
  "show_on_home": false,
  "case_is_en": "string", "case_is_id": "string",
  "case_did_en": ["string"], "case_did_id": ["string"],
  "tags": ["string"],
  "status_en": "string", "status_id": "string",
  "case_action": "site | walkthrough | none",
  "live_url": "https://... | null",
  "demo_url": "https://... | null",
  "repo_url": "https://... | null",
  "visual_type": "screenshot | number",
  "thumbnail": { "public_id": "string", "url": "string", "width": 1600, "height": 1000 },
  "thumbnail_alt_en": "string", "thumbnail_alt_id": "string",
  "card_number": "string", "card_caption_en": "string", "card_caption_id": "string",
  "published": true
}
```

- `featured` is ignored when sent; `tags` max. 6; `live_url` may be `null` except when `case_action = site`; `demo_url` and `repo_url` are always optional and follow the `live_url` URL rules (same error message).
- `thumbnail` may be `null` when `published = false`. The server only uses `thumbnail.public_id`; `url`, `width`, `height` are taken from image storage. A `public_id` that no longer exists → `422` with a message on the `thumbnail` field.
- `revalidated: false` → the UI shows E-19.
- API-07 is called when the user clicks Remove/Replace on an image that was never saved, or Cancels a form with a new upload. Saved images are only deleted through API-04/05.
- The S-11 project list and the S-13 data are read directly on the server (not through a public endpoint), still protected by the session.

**Revalidation (side effect of API-03/04/05):** `/`, `/work`, `/id`, `/id/work` and `sitemap.xml`.

## 11. Analytics contract & i18n strings

### GA4 events

Only these events are sent, all of them only after `consent=granted`. Event names use the `object_action` format, lowercase.

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | Automatic GA4 on each public page | `page_location`, `language` (`en`/`id`) |
| `contact_email_click` | Click on mailto or Copy email | `kind`: `general`\|`role`\|`project`\|`walkthrough`; `location`: `bar`\|`hero`\|`contact`\|`work_contact`\|`case`; `method`: `mailto`\|`copy`; `language`; `project_slug` (kind walkthrough only) |
| `cv_download` | Click on Download CV | `location`: `about`\|`contact`; `language` |
| `case_open` | A case row is opened | `project_slug`; `source`: `home_title`\|`row`\|`hash`; `language` |
| `project_link_click` | Click on a live site, demo or code link | `project_slug`; `page`: `home`\|`work`; `placement`: `home`\|`case`; `link`: `site`\|`demo`\|`code` (from `data-link`, default `site`; D-42); `language` |
| `theme_switch` | Click on O-04 | `to`: `dark`\|`light` |
| `language_switch` | Click on O-01 or an O-02 action | `from`, `to`, `source`: `toggle` \| `banner` |

Key events (conversions) in GA4: `contact_email_click` and `cv_download`. The admin does not load GA4 at all. The `sessionStorage` `rr-case-from-home` is a one-time marker so a title click on home is not counted twice as `case_open`.

### i18n strings

Every UI label lives in two dictionary files (`i18n/en.json`, `i18n/id.json`) with the same keys. The v2 dictionary = the `T` keys in `option-b.html` (`skip`, `nav.*`, `cta`, `hero.*`, `work.*`, `w.*`, `about.*`, `e1..e3*`, `case.*`, `st*`, `bridge.*`, `ct.*`, `wp.*`, `c.*`, `mail.*`, `ft.*`), with these additions and changes:

| Key | EN | ID |
| --- | --- | --- |
| `ct.h.more` | Have a project like *these?* | Punya proyek seperti *ini?* |
| `cv.download` | Download CV (PDF) | Unduh CV (PDF) |
| `email.copy` / `email.copied` | Copy email / Copied | Salin email / Tersalin |
| `mail.walk.s` | Walkthrough: {title} | Walkthrough: {title} |
| `work.empty` | New work is on the way. Meanwhile, here's how to reach me. | Karya baru sedang disiapkan. Sementara itu, ini cara menghubungi saya. |
| `theme.toDark` / `theme.toLight` | Switch to dark mode / Switch to light mode | Ganti ke mode gelap / Ganti ke mode terang |
| `group.automation` / `group.panasonic` / `group.web` / `group.ai` | HR automation / HR systems / Websites / AI tools | Otomasi HR / Sistem HR / Website / Alat AI |
| `work.demo` / `c.code` | Watch the demo ↗ / View the code ↗ | Tonton demonya ↗ / Lihat kodenya ↗ |
| `mail.walk.b` | Company and team size: · The HR process you want to automate: · Tools you use today: · A good time to talk: (one per line) | Perusahaan dan jumlah karyawan: · Proses HR yang ingin diotomasi: · Tools yang dipakai sekarang: · Waktu yang cocok untuk ngobrol: |
| `mail.project.b` | The HR process you want to automate: · Tools you use today (HRIS, Google Workspace, Slack…): · Timeline: · Budget range: (one per line) | Proses HR yang ingin diotomasi: · Tools yang dipakai sekarang (HRIS, Google Workspace, Slack…): · Target waktu: · Kisaran anggaran: |
| `wp.sub.*` | Pieces per group (`one`/`other`), connector, closer, number words 1–10 (D-30); `automation`: "{n} HR automation(s) built with n8n and AI", `panasonic`: "{n} project(s) inside an enterprise HR system" | `automation`: "{n} otomasi HR dengan n8n dan AI", `panasonic`: "{n} proyek di sistem HR enterprise" |
| `langBanner.text` | Also available in Indonesian. | (not used, the banner is EN only) |
| `consent.body` | I use Google Analytics to see which pages are useful. It only runs if you allow it. | Saya memakai Google Analytics untuk melihat halaman mana yang berguna. Hanya aktif jika kamu izinkan. |
| `notFound.title` | This page doesn't exist | Halaman ini tidak ada |

The keys `cur.read` ("Read" / "Baca") and `cur.visit` ("Visit" / "Kunjungi") are used for the O-05 cursor label. Numbers card data comes from the database, not the `peek.*` keys. The admin preview panel labels follow the admin UI text (EN only, G3). Project text (`w1..w5`, `r*`, `c*`, `peek.*` in the mockup) is **not** dictionary keys: it is the starting content for the admin (database content).

The `<em>` (italic accent word), `<s>` (struck-through text) and `<strong>` tags in dictionary values are rich-text markers that the `richText()` helper renders into predefined elements (SDD section 5), not raw HTML. Other tags are not allowed. Arrow icons (↗, →) are not part of the string; they are rendered by the component so they can be animated.

**Admin error messages (EN only)**

| Condition | Message |
| --- | --- |
| Required field empty | {Field} is required. |
| Too long | Keep it under {n} characters ({current} now). |
| Invalid URL | URL must start with https:// and be a full address. |
| Stack > 6 | Use up to 6 items. |
| What I did > 8 | Use up to 8 lines. |
| Site without Live URL | Add a live URL, or choose another button. |
| Selected work full | Selected work already has 5 projects. Turn one off first. |
| File > 5 MB | This image is {size} MB. Upload one under 5 MB. |
| Wrong type | Use a JPG, PNG, or WebP image. |
| Width < 1200 px | This image is {w} px wide. Use one at least 1200 px wide. |
| Upload failed | Upload failed. Check your connection and try again. |
| Publish incomplete | Add a screenshot and alt text to publish, or turn off Published to save as draft. |

The ID copy in these tables is an early draft and Pal may revise it while writing content; the keys must not change.

## 12. Traceability & limits for AI coding

Every PRD feature has screens, flows and edge cases that can be tested. A feature counts as done only when all its PRD acceptance criteria pass and its related flows work end to end.

| PRD feature | Screen / overlay | Flow | Edge case | API / contract |
| --- | --- | --- | --- | --- |
| F1 Homepage | S-01, O-04, O-05 | UF-01 | E-01, E-03, E-05, E-07, E-20, E-25, E-30, E-31, E-32, E-33, E-34 | Public DTO |
| F2 Work | S-02, O-05 | UF-01 | E-01, E-27, E-29, E-33, E-36 | Public DTO |
| F3 Case row | S-01, S-02 | UF-01 | E-06, E-27, E-28, E-35 | `case_open`, `project_link_click` |
| F4 Bilingual | O-01, O-02, all public | UF-02, UF-04 | E-07, E-18, E-20 | G1, G4, `language_switch` |
| F5 Contact | Bar, S-01, S-02 | UF-03 | E-09 | `contact_email_click`, `cv_download` |
| F6 Admin login | S-10, G3 | UF-06, UF-10 | E-10, E-11 | API-01, API-02 |
| F7 Admin CRUD | S-11, S-12, S-13, S-14 | UF-07, UF-08, UF-09 | E-11 to E-17, E-19, E-26 | API-03 to API-09 |
| F8 GA4 + consent | O-03, S-03 | UF-05 | E-07 | GA4 events, G4 |
| F9 SEO | All public, S-04 | — | E-18 | PRD section 9 |

**Not to be guessed or added by AI coding**

- Do not add screens, sections, fields, filters, search, pagination or a contact form.
- Motion is only D-08 + D-10 + D-37 (PRD section 8), CSS only, plus the O-05 pointer layer (D-31..D-35); client JS on public pages is only for the list in PRD section 10. Do not build a carousel, an animation library, JS rotation/timers, JavaScript-based parallax, or a fade-in on the H1/sub.
- Do not turn on the pointer layer on touch screens or use `requestAnimationFrame` outside `PointerLayer`.
- Do not render the GitHub link when it is empty.
- Do not use `--calm` or `--faint` for text.
- Do not read/write the `featured` column.
- Do not auto-redirect based on browser language, IP or cookie.
- Do not load GA4 or analytics cookies before `consent=granted`.
- Do not store images on the server filesystem or in the repo.
- Do not hardcode project data in components; do not show `published=false` projects anywhere on the public side.
- Do not auto-translate at runtime; all text comes from the i18n dictionary or per-language database fields.
- Do not create a second admin account, a register page or a public password reset.
- Do not change fonts, colors or copy locked in the PRD without approval.
- If this document, the PRD and the SDD do not answer an implementation question: stop and ask, do not make it up.

**Document order:** PRD (what & why) → this document (screens, flows, states, contracts) → SDD (architecture, libraries, repo structure, deploy to Hostinger via GitHub, rules for working with AI coding).
