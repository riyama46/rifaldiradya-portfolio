---
change: v2.2.0-hr-automation
app: rifaldiradya.com
tier: full
bump: minor
base_version: 2.1.0
status: in-progress
date: 2026-10-28
---

# Change v2.2.0 — HR automation positioning

## Why

Pal is moving their freelance service to HR / people-ops workflow automation (n8n + Google Gemini). The Upwork profile, GitHub bio and profile README already say so (Oct 28, 2026); the site is the last place that still presents Pal as a full-stack .NET engineer for recruiters. Three gaps block the new pitch:

1. The showcase project, HR Onboarding Automation (public repo `https://github.com/riyama46/hr-onboarding-automation`, demo video linked from its README), cannot show its video or its code: a case can only open a live site, ask for a walkthrough, or show nothing.
2. The walkthrough email is written for recruiters (`mail.walk.b` asks for "Role you're hiring for").
3. The hero, SEO meta, JSON-LD and PRD positioning sell a .NET engineer and lead with the employer's name. Pal is still employed there, so the name moves out of the headline copy and stays only as track record.

## Scope

- In:
  - Two optional project links, **demo video** and **code repository**, shown as "Watch the demo ↗" and "View the code ↗" (D-42). EN/ID i18n, validation in `projectInputSchema`, admin fields, migration `0005`, tests.
  - A new project group **HR automation** for the showcase project, first in the filter; the `panasonic` group is relabelled **HR systems** (D-43).
  - Automation-client email templates: walkthrough body and project body (D-44).
  - Repositioning to "HR automation engineer who builds on enterprise HRMS experience": hero, availability text, About, Highlight meta, Contact, SEO titles/descriptions, OG images, JSON-LD, PRD personas and positioning (D-41, D-44). .NET stays as supporting proof (stack line, About, Highlight, JSON-LD `knowsAbout`).
  - Panasonic is named once, as track record in the About chapter (and in the CV); hero, SEO meta, OG images, JSON-LD, group labels, Work sub and the Highlight meta say "a 13-company manufacturing group" or "HRMS" (D-41).
- Out (non-goals):
  - Embedding the video on the site (link only; no iframe, no CSP change).
  - A case study page, services/pricing section, testimonials, a contact form.
  - New routes, navigation or chapter order.
  - Renaming the `panasonic` group key in the database.
  - Replacing the CV PDF (it keeps the employer name, by Pal's choice) and editing production project content (content tasks for Pal, see Impact checklist).

## Decisions

- **D-40 — Lane: MINOR (v2.2.0).** · Context: the repo's rule (AGENTS.md) calls a direction change MAJOR, and the audience order changes here. · Why MINOR still fits: no route, navigation, chapter, layout or data removal; the only migration adds two nullable columns; rollback = revert the merge (old code ignores the new columns and the `automation` group falls back as below). · Alternative rejected: v3.0.0 (same work and checks, only the number differs). · Consequence: if Pal prefers to signal the pivot with a major number, rename this folder to `v3.0.0-hr-automation` before building; nothing else changes.
- **D-41 — The employer is named once, as track record, and never in the headline copy.** About `p1` keeps "13 Panasonic group companies" (and the CV keeps the employer); the hero, SEO titles/descriptions, OG images, Highlight meta, group label, Work sub and admin examples use "a 13-company manufacturing group" / "grup manufaktur 13 perusahaan" or "HRMS"; JSON-LD drops `worksFor`, so search snippets do not lead with it. · Context: Pal is still employed and now sells freelance work, and wants the track record visible but not pushed (owner decision, Oct 28, 2026). · Replaces the PRD owner context "Panasonic may be named" and the D-16 reason text. · Alternatives rejected: keep the name in the hero and meta (too loud for a side business); remove it everywhere (loses real proof the visitor can check). · Consequence: production project texts may keep the name; Pal decides per project.
- **D-42 — Demo and code are two optional URL fields (`demo_url`, `repo_url`), not new `case_action` values.** · Context: the brief asked for new `case_action` values, but `case_action` holds one value, and the showcase project needs both buttons (and a future client project may also have a live site). · Rules: https only (same check as `live_url`), max 300, nullable, never required to publish. Case row: case-action button first, then "Watch the demo ↗", then "View the code ↗". Selected work: "Open the live site ↗" (unchanged) and "Watch the demo ↗" when set; the code link stays in the case row only. · Alternatives rejected: `case_action` values `demo`/`code` reusing `live_url` (one button per project, and the column name would lie); a multi-select `case_action` (breaks the enum column and the radio UI). · Consequence: migration `0005` adds two nullable columns (additive, rollback-safe).
- **D-43 — New group `automation`, and `panasonic` relabelled "HR systems".** Filter and Work sub order: HR automation, HR systems, Websites, AI tools. · Context: the showcase project fits no current group ("AI tools" reads "a set of AI tools I use every day"). The `panasonic` key stays in the DB and code (renaming needs a data migration for a label change). · `group` is `varchar(12)` with a TypeScript-only enum, so no migration. · Alternative rejected: put the project in `ai` and rewrite that phrase (mixes daily-use tools with client work). · Rollback note: a v2.1.0 build would type `automation` rows outside its enum; revert = also set those rows to `ai` (one `UPDATE`), noted in the PR.
- **D-44 — Audience order: automation clients first, recruiters second.** P1 becomes the HR/people-ops client, P2 the recruiter. The Contact chapter's primary button becomes "Email about a project"; "Email about a full-time role" stays as the second button. The walkthrough and project email bodies ask about the HR process and tools. · Alternative rejected: drop the full-time role path (Pal has not decided to stop applying; one button costs nothing). · D-25 (walkthrough subject names the project) stays.

## Delta: PRD

### MODIFIED

- **Intro note + §1 Product summary:** "rifaldiradya.com is a bilingual portfolio that presents Pal as an **HR automation engineer**: n8n and AI workflows for HR and people-ops teams, built on four years building and running the HRMS of a 13-company manufacturing group (C#, ASP.NET, SQL Server). The site is a funnel to email (project, or full-time role) plus Download CV." **Problem:** "HR teams lose hours to manual onboarding and admin, and cannot tell a generic automation freelancer from one who knows HR systems. The site shows a working automation (video + code) and the HRMS track record behind it." **Owner context:** "Pal is still employed; the employer is named once, as track record in About and the CV, never in headline copy or meta (D-41). Visitors come from Upwork and LinkedIn, mostly on a phone." Previously: full-stack .NET software engineer for recruiters; Panasonic may be named. Why: D-41, D-44.
- **§2 Personas:** P1 — Automation client (primary): HR / people-ops lead or founder of a small to mid-size company, from Upwork or LinkedIn; looking for proof the automation works (demo, code), HR understanding, how to start; action: hero → Selected work/Work → Watch the demo → "Email about a project". P2 — Recruiter / hiring manager (secondary): unchanged content, action "Email about a full-time role" / Download CV. P3 unchanged. Previously: P1 recruiter, P2 project client. Why: D-44.
- **§3 Goals:** goal 1 → "An HR or people-ops lead understands what Pal automates, and why Pal's HRMS background matters, from the first screen on a phone." Goal 3 → "Automation work can be judged by its demo and code; internal HRMS work by numbers, case content and a walkthrough." Metrics ADDED: "Project emails (`contact_email_click` kind `project` or `walkthrough`) ≥ 1 within 60 days after v2.2.0"; "`project_link_click` with `link = demo`: baseline for the first 30 days". The full-time interview metric stays.
- **§4 Positioning:** "HR automation engineer: n8n and Google Gemini workflows for onboarding and HR admin, on Google Workspace. Since Nov 2022 has built and run the HRMS of a 13-company manufacturing group (C#, ASP.NET, SQL Server, Azure), which is the supporting proof." Copy table rows replaced (EN / ID):

  | Element | EN | ID |
  | --- | --- | --- |
  | Hero label | HR automation engineer · n8n + AI · Jakarta, Indonesia | HR automation engineer · n8n + AI · Jabodetabek |
  | Availability | Open to HR automation projects | Terbuka untuk proyek otomasi HR |
  | H1 | I automate the HR work / your team does *by hand.* | Otomasi pekerjaan HR / yang masih *manual.* |
  | Sub | Four years building and running the HR system of a 13-company manufacturing group. Now I build HR automations with n8n and AI, starting with new-hire onboarding. | Empat tahun membangun dan menjaga sistem HR grup manufaktur 13 perusahaan. Sekarang saya membangun otomasi HR dengan n8n dan AI, dimulai dari onboarding karyawan baru. |
  | Stack | n8n · Google Gemini · Google Workspace · Power Automate · C# · ASP.NET · SQL Server | same |
  | Highlight meta | Highlight · HRMS · Live since early 2023 | Sorotan · HRMS · Berjalan sejak awal 2023 |
  | Contact H2 | Tell me what you'd like to *automate.* | Ada proses HR yang mau *diotomasi?* |
  | Contact pitch | Need an HR process automated, or a developer on your team? Send a few lines about it and I'll reply by email. | Perlu proses HR diotomasi, atau developer untuk tim Anda? Ceritakan singkat kebutuhannya, saya balas lewat email. |
  | Contact buttons | Email about a project (primary) · Email about a full-time role | Email soal proyek (utama) · Email soal posisi full-time |
  | Case links | Watch the demo ↗ · View the code ↗ | Tonton demonya ↗ · Lihat kodenya ↗ |

  Previously: .NET engineer label, "Building HR software / for *thousands.*", Panasonic in the sub, role button first. Number sources: outside About, the "Panasonic group" wording becomes "a 13-company manufacturing group"; the numbers do not change.
- **§6 F1:** Selected work shows "Watch the demo ↗" when `demo_url` is set (D-42). **F2:** filter All / HR automation / HR systems / Websites / AI tools. **F3:** a case row also shows "Watch the demo ↗" and "View the code ↗" when set; same new-tab + `rel` rules; clicks are `project_link_click` with `link`. **F5:** the walkthrough and project bodies follow App Flow §11. **F7:** admin fields add Demo video URL and Code repository URL (optional, https).
- **§7 Out of scope:** "Non-engineering services" row → "Services outside HR automation and HR systems". ADDED row: "Embedded demo video | A link is enough and needs no CSP change | Demo views matter enough to keep visitors on the page".
- **§9 Meta per page:**

  | Page | Title | Description |
  | --- | --- | --- |
  | `/` | Rifaldi Radya Pratama, HR Automation Engineer (n8n + AI) | I build n8n and AI workflows that automate onboarding and HR admin, backed by four years on the HRMS of a 13-company manufacturing group. Based in Jakarta. |
  | `/work` | Work: HR Automation and HR Systems \| Rifaldi Radya Pratama | HR automations with n8n and AI, an enterprise HRMS, websites and AI tools by Rifaldi Radya Pratama. Open a row for what it is, what I did and the stack. |
  | `/id` | Rifaldi Radya Pratama, HR Automation Engineer (n8n + AI) | Workflow n8n dan AI untuk otomasi onboarding dan administrasi HR, berbekal empat tahun di HRMS grup manufaktur 13 perusahaan. Berbasis di Jabodetabek. |
  | `/id/work` | Karya: Otomasi HR dan Sistem HR \| Rifaldi Radya Pratama | Otomasi HR dengan n8n dan AI, HRMS enterprise, website, dan alat AI karya Rifaldi Radya Pratama. Buka satu baris untuk melihat detailnya. |

  OG alt: "Rifaldi Radya Pratama, HR automation engineer. I automate the HR work your team does by hand." / "Rifaldi Radya Pratama, HR automation engineer. Otomasi pekerjaan HR yang masih manual." **Keyword hypothesis:** "HR automation n8n", "n8n onboarding automation", "HR automation freelancer Indonesia" + personal name. **JSON-LD Person:** `jobTitle` "HR Automation Engineer"; no `worksFor`; `knowsAbout` HR automation, n8n, Google Gemini, Google Workspace, Power Automate, HRMS, C#, ASP.NET, SQL Server. Previously: "Software Engineer", `worksFor` PT Panasonic Manufacturing Indonesia, .NET-only `knowsAbout`.
- **§12 Content dependencies:** ADDED items (Impact checklist, content tasks).
- **§13 Risks:** "Coworkers see 'Open to full-time roles'" → "Coworkers see the freelance pitch" (mitigation: availability switch, employer only in About). Assumption "Panasonic work may be named" → "Panasonic is named once, as track record in About and the CV (D-41)".

## Delta: APP_FLOW

### MODIFIED

- **S-01 step 2 (Selected work):** after "Open the live site ↗" (when `case_action = site`), a "Watch the demo ↗" link when `demo_url` is set; new tab, `rel="noopener noreferrer"`, `data-cursor="visit"`, `project_link_click` with `placement` `home` and `link` `demo`. The screenshot still links only to `live_url`.
- **S-01 step 5 (Contact):** primary button = project mailto, secondary = role mailto (D-44).
- **S-02 step 2:** filter All / HR automation / HR systems / Websites / AI tools.
- **S-02 step 3:** after the `case_action` button: "Watch the demo ↗" (`demo_url`) and "View the code ↗" (`repo_url`) when set, in that order, same link rules. The details column shows when any of stack, status, a case button, demo or code exists.
- **S-12/S-13 table:** row 2 Group → segmented HR automation / HR systems / Websites / AI tools, enum `automation`\|`panasonic`\|`web`\|`ai`, default `web`; row 3 example → "HRMS · 13 companies". ADDED rows in section "Button on the case", after Live URL: "Demo video URL | text (url) | https, max. 300, e.g. YouTube or Google Drive | no" and "Code repository URL | text (url) | https, max. 300, e.g. GitHub | no".
- **UF-01:** becomes "An HR lead evaluates Pal (EN) — main flow": hero → Selected work → "Watch the demo ↗" (video in a new tab) → back → Contact → "Email about a project". The recruiter path moves to UF-01b (previous UF-01 steps, unchanged).
- **§8 Edge cases:** ADDED E-32: `demo_url`/`repo_url` stored but not https (old or edited data) → not rendered, no warning needed. E-33: a project in group `automation` while the filter has no other group → filter shows All + HR automation (existing empty-group rule).
- **§9 Data model, Project:** ADDED `demo_url` (string or null, https, max. 300; Selected work + case row) and `repo_url` (string or null, https, max. 300; case row). `group` enum adds `automation`. Example DTO: "meta": "HRMS · 13 companies", "summary": "The HR system a 13-company manufacturing group runs on." (no employer name in the example).
- **§10 API contract:** ProjectInput adds `"demo_url": "https://... | null"`, `"repo_url": "https://... | null"`, `group` adds `automation`. Errors reuse "URL must start with https:// and be a full address."
- **§11 GA4:** `project_link_click` adds `link`: `site`\|`demo`\|`code` (from `data-link`, default `site`).
- **§11 i18n strings (EN / ID):**

  | Key | EN | ID |
  | --- | --- | --- |
  | `work.demo` | Watch the demo ↗ | Tonton demonya ↗ |
  | `c.code` | View the code ↗ | Lihat kodenya ↗ |
  | `group.automation` / `group.panasonic` | HR automation / HR systems | Otomasi HR / Sistem HR |
  | `wp.sub.automation` | {n} HR automation built with n8n and AI / {n} HR automations built with n8n and AI | {n} otomasi HR dengan n8n dan AI |
  | `wp.sub.panasonic` | {n} project inside an enterprise HR system / {n} projects inside an enterprise HR system | {n} proyek di sistem HR enterprise |
  | `mail.walk.b` | Company and team size:\nThe HR process you want to automate:\nTools you use today:\nA good time to talk:\n | Perusahaan dan jumlah karyawan:\nProses HR yang ingin diotomasi:\nTools yang dipakai sekarang:\nWaktu yang cocok untuk ngobrol:\n |
  | `mail.project.b` | The HR process you want to automate:\nTools you use today (HRIS, Google Workspace, Slack…):\nTimeline:\nBudget range:\n | Proses HR yang ingin diotomasi:\nTools yang dipakai sekarang (HRIS, Google Workspace, Slack…):\nTarget waktu:\nKisaran anggaran:\n |
  | `about.p2` | (unchanged) + " Outside that job I build HR automations with n8n and AI." | (tetap) + " Di luar pekerjaan itu, saya membangun otomasi HR dengan n8n dan AI." |

  Hero, SEO, Highlight meta and Contact keys follow PRD §4/§9 above. `mail.walk.s` stays "Walkthrough: {title}" (D-25).

## Delta: DESIGN_SPEC

No change. There is no separate DESIGN_SPEC (D-28); the new links reuse `.line-link`/`.case-act` and the existing tokens, and the new admin inputs reuse `FormField`. No new component, token, motion or layout.

## Delta: SDD

### MODIFIED

- **§3 Schema:** `projects.demo_url varchar(300) NULL`, `projects.repo_url varchar(300) NULL` (migration `drizzle/0005_*.sql`, generated with `npm run db:generate`, explicit utf8mb4 as before); `group` TypeScript enum adds `automation` (no DB change, `varchar(12)`).
- **§6 Security:** `demo_url` and `repo_url` pass the same `isValidLiveUrl` check on save and the same `httpsUrl` filter in the public DTO; rendered only as `<a target="_blank" rel="noopener noreferrer">`; no embed, so CSP is unchanged.
- **§9 Site config:** `role` "HR Automation Engineer"; `employer` removed (D-41); `stack` and `knowsAbout` per PRD §4/§9; `scripts/og-images.mts` STACK matches `siteConfig.stack`, and `public/og/en.png` / `id.png` are regenerated.
- **§12 Tasks:** ADDED T-41..T-45 (`tasks.md`).

## Impact checklist

- [ ] Screens/routes affected: S-01 (hero, Selected work, About, Highlight, Contact), S-02 (filter, sub, case row), S-12/S-13 (two fields, group labels, preview). No new route.
- [ ] Components reused vs replaced: reused `CaseRow`, `SelectedWork`, `ContactChapter`, `FormField`, `SegmentedControl`, `ProjectPreview`; nothing replaced.
- [ ] URLs/SEO/redirects: no URL change; titles, descriptions, OG images and JSON-LD change.
- [ ] Copy to rewrite: i18n EN/ID keys listed above; admin strings (group labels, two field labels/help, meta example).
- [ ] Data/API/storage: migration `0005` (two nullable columns, additive); API-03/04 accept `demo_url`, `repo_url`, group `automation`.
- [ ] Breaking? No for the public site and API. Rollback after `automation` rows exist: revert + `UPDATE projects SET \`group\` = 'ai' WHERE \`group\` = 'automation'`.
- [ ] Content tasks for Pal (not code, outside this PR):
  - CV PDF (`public/cv/…`) keeps the employer name (D-41); its "Software Engineer (Full-Stack .NET)" title can be refreshed later through a PATCH.
  - Production project texts: optional, Pal decides per project whether a meta line keeps the employer name (D-41).
  - Add the HR Onboarding Automation project in production: group HR automation, demo URL (YouTube Unlisted preferred, the Drive link works), repo URL, screenshot ≥ 1200 px wide, `show_on_home` first.

## Acceptance checks

- **Demo/code links (Given/When/Then):** Given a published project with `demo_url` and `repo_url`, when its Work row opens, then "Watch the demo ↗" and "View the code ↗" show after the case button, open a new tab with `rel="noopener noreferrer"`, and send `project_link_click` with `link` `demo`/`code` (consent granted). Given only `demo_url` and `show_on_home`, when the homepage renders, then Selected work shows "Watch the demo ↗". Given neither, nothing new renders. (unit: DTO + validation; e2e: work, selected-work)
- **Validation:** `http://`, a URL with credentials, or > 300 chars in either field → 422 with the https message on that field; empty → stored as null; publishing never requires them. (unit: project-validation; integration: projects)
- **Admin:** the two fields save and reload on S-13, show their error inline, and the group control offers four options. (unit: project-form; e2e: admin)
- **Group:** with one automation project and others, the filter order is All, HR automation, HR systems, Websites, AI tools, and the Work sub starts with "One HR automation built with n8n and AI". (unit: projects)
- **Emails:** the walkthrough mailto body is the automation template in EN and ID; the subject still names the project. (unit: mailto)
- **Positioning:** "Panasonic" appears in the dictionaries only in `about.p1` (a unit test checks every other key and `lib/site-config.ts`); JSON-LD has `jobTitle` "HR Automation Engineer" and no `worksFor`; titles/descriptions match PRD §9; the first screen at 390 × 844 and 375 × 667 still holds the label, H1 and "Email me". (unit: seo, i18n, site-config; e2e: home)
- **Gates:** `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` pass; `test:integration` and `test:e2e` run when the local MySQL is available.
