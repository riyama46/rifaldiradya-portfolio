---
doc: PRD
app: rifaldiradya.com
tier: full
version: 2.2.0
status: current
last_updated: 2026-10-29
last_change: changes/archive/2026-10-29-v2.2.0-hr-automation
---

# PRD — rifaldiradya.com Portfolio v2

Sep 27, 2026 · @Pal · v2.0.0: Oct 18, 2026 · v2.2.0: Oct 29, 2026

> **v2.0.0 (software engineer showcase).** The site's direction changes from selling landing pages to Upwork clients into a showcase of a full-stack .NET software engineer for recruiters and hiring managers, with project clients as the second audience. Visual and interaction reference: `docs/design/v2/option-b.html` (public) and `docs/design/v2/admin.html` (admin). If the mockup differs from this document, this document wins; if this document is silent, follow the mockup. The v2 decisions (D-01..D-30) are in `docs/decisions/DECISIONS.md`; the change history is in `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/CHANGE.md`.

> **v2.2.0 (HR automation positioning).** The site now presents Pal as an HR automation engineer (n8n + AI) for HR and people-ops clients, with recruiters as the second audience and the HRMS work as the supporting proof. Projects can link a demo video and a code repository. Decisions D-40..D-44; change history in `docs/changes/archive/2026-10-29-v2.2.0-hr-automation/CHANGE.md`.

## 1. Product summary

rifaldiradya.com is a bilingual portfolio (EN default, ID secondary) that presents Pal as an **HR automation engineer**: n8n and AI workflows for HR and people-ops teams, built on four years building and running the HRMS of a 13-company manufacturing group (C#, ASP.NET, SQL Server). The site is a **funnel to email** (project, or full-time role) plus Download CV; a single-user admin stays for managing projects.

**Problem.** HR teams lose hours to manual onboarding and admin, and cannot tell a generic automation freelancer from one who knows HR systems. The site shows a working automation (demo and code) and the HRMS track record behind it; the internal HRMS work, which cannot be clicked, is explained with real numbers, case content, a CV and a walkthrough offer.

**Owner context.** Pal is still employed and sells freelance HR automation; visitors come from Upwork and LinkedIn, mostly on a phone. Panasonic is named once, as track record in About and the CV, never in headline copy or meta (D-41): the site also serves recruiters, while freelance profiles stay anonymized. The HRMS screens are internal and are not shown.

## 2. Target users & personas

| Persona | Who | Looking for | Language | Expected action |
| --- | --- | --- | --- | --- |
| P1 — Automation client (primary) | HR / people-ops lead or founder of a small to mid-size company, from Upwork or LinkedIn, mostly on a phone | Proof the automation works (demo, code), understanding of HR, how to start | EN or ID | Hero → Selected work/Work → "View the code ↗" or "Watch the demo ↗" → "Email about a project" |
| P2 — Recruiter / hiring manager (secondary) | Comes from LinkedIn, mostly on a phone | Role, stack, system scale, proof, how to get in touch | EN or ID | Read hero → Selected work/Work → Download CV or "Email about a full-time role" |
| P3 — Admin (Pal) | Site owner, the only admin user | Add/edit a project in < 5 minutes, from a laptop or a phone | EN admin UI | Login → project CRUD |

## 3. Goals, non-goals & success metrics

**Goals**

1. An HR or people-ops lead understands what Pal automates, and why Pal's HRMS background matters, from the first screen on a phone.
2. Every chapter leads to email or the CV.
3. Automation work can be judged by its demo and code; internal HRMS work by real numbers, case content and a walkthrough.
4. Pal can add and arrange projects, including projects without a URL, without touching code.
5. SEO in both languages does not drop.

**Non-goals**

- A contact form and storage of visitor data.
- A case study page per project.
- Blog, testimonials.
- Multi-user admin or a role system.

**Success metrics**

| Metric | Target | How measured |
| --- | --- | --- |
| Lighthouse Performance (mobile) | ≥ 90 | PageSpeed Insights |
| Core Web Vitals | LCP < 2.5 s · INP < 200 ms · CLS < 0.1 | PageSpeed Insights / Search Console |
| Lighthouse Accessibility & SEO | ≥ 95 | Lighthouse |
| Indexed pages | 4 public pages (/, /work, /id, /id/work) | Google Search Console |
| Time to add 1 project via admin | < 5 minutes | Manual test |
| Full-time role emails that lead to an interview | ≥ 1 within 60 days after the v2.0.0 release | Logged manually by Pal |
| Project emails (`contact_email_click` kind `project` or `walkthrough`) | ≥ 1 within 60 days after the v2.2.0 release | GA4 + Pal's inbox |
| `project_link_click` with `link = demo` or `code` | Baseline for the first 30 days after v2.2.0 | GA4 |
| `contact_email_click` per `kind` | Baseline for the first 30 days | GA4 |
| `cv_download` | Baseline for the first 30 days (early signal of recruiter interest) | GA4 |

## 4. Positioning, promise & copy

**Positioning:** HR automation engineer: n8n and AI (LLM) workflows for onboarding and HR admin, on Google Workspace. Since Nov 2022 has built and run the HRMS of a 13-company manufacturing group (C#, ASP.NET, SQL Server, Azure), which is the supporting proof. The site is a showcase for automation clients and recruiters, and a funnel to email. No AI vendor is named in the copy: the model changes per client.

The source of the final EN/ID copy = the `T` object in `option-b.html`, moved into `i18n/en.json` and `i18n/id.json` (keys in App Flow §11). Exceptions to `T`: the availability text stays in i18n (D-16), the Copy email label (D-17), the walkthrough subject (D-25), the Work page sub computed from data (D-30), and new copy that is not in the mockup: Download CV, Copy email, SEO meta (§9).

Copy rules: no em dash, no "Not X. Y." pattern, no cliché words, buttons say exactly what happens, EN and ID are written separately (transcreation), no invented numbers or testimonials, projected numbers are always written "projected"/"perkiraan".

| Element | EN | ID |
| --- | --- | --- |
| Bar | Rifaldi Radya Pratama · Work · About · EN/ID · theme · Email me | … · Karya · Tentang · … · Kirim email |
| Hero label | HR automation engineer · n8n + AI · Jakarta, Indonesia | … · Jabodetabek |
| Availability (only when the switch is on) | Open to HR automation projects | Terbuka untuk proyek otomasi HR |
| H1 | I automate the HR work / done *by hand.* | Otomasi pekerjaan HR / yang *manual.* |
| Sub | Four years building and running the HR system of a 13-company manufacturing group. Now I build HR automations with n8n and AI. | Empat tahun membangun dan menjaga sistem HR grup manufaktur 13 perusahaan. Sekarang saya membangun otomasi HR dengan n8n dan AI. |
| Stack | n8n · LLM APIs · Google Workspace · C# · ASP.NET · SQL Server (six short items so the hero fits 375 × 667 with the cookie banner) | same |
| Highlight | Highlight · HRMS · Live since early 2023 · One login instead of ~~five passwords.~~ · 5 → 1 · ~200 · 13 | Sorotan · HRMS · Berjalan sejak awal 2023 · ~~Lima password~~ jadi satu login. · ±200 |
| Highlight note | Screens of the HRMS are internal; I can walk you through them on a call. | … lewat video call. |
| Bridge | Does your HR team still do this kind of work by hand? | Tim HR Anda masih mengerjakan hal seperti ini secara manual? |
| Contact H2 | Tell me what you'd like to *automate.* | Ada proses HR yang mau *diotomasi?* |
| Contact pitch | Need an HR process automated, or a developer on your team? Send a few lines about it and I'll reply by email. | Perlu proses HR diotomasi, atau developer untuk tim Anda? Ceritakan singkat kebutuhannya, saya balas lewat email. |
| Contact buttons | Email about a project (primary) · Email about a full-time role | Email soal proyek (utama) · Email soal posisi full-time |
| Case links | Open the live site ↗ · Watch the demo ↗ · View the code ↗ | Buka situsnya ↗ · Tonton demonya ↗ · Lihat kodenya ↗ |
| Download CV | Download CV (PDF) | Unduh CV (PDF) |
| Copy email | Copy email → Copied | Salin email → Tersalin |

Outside About, the employer appears as "a 13-company manufacturing group" / "grup manufaktur 13 perusahaan" (D-41). Numbers and their sources (CV v1.0, Drive `01_Personal Docs/Current/Career`, rechecked Oct 17, 2026): 13 group companies, Pal handles 6; hundreds of HR/admin staff, thousands of employee records, ~2,000 at the main site; SSO 4–5 passwords → 1 for ~200 staff, live since early 2023; Teams approval ~57 → 4 minutes **projected** (proposal stage); team of 3.

## 5. Information architecture & site map

Public URLs: `/`, `/work`, `/privacy`, `/id`, `/id/work`, `/id/privacy`; admin `/admin/*`. EN lives at the root, ID under the `/id` prefix.

Every EN page pairs with its ID version through hreflang and the language toggle. The admin is not bilingual, is not in the sitemap and is blocked from indexing (`noindex`).

**Home:** bar → Hero `#top` → Selected work `#work` → About `#about` → Highlight `#highlight` → Contact `#contact` → footer.

**Work:** bar → title + filter + case rows (`#case-<slug>`) → closing Contact `#more` → footer.

No numbered section labels.

## 6. Features

| ID | Feature | Persona | Priority |
| --- | --- | --- | --- |
| F1 | Homepage (Hero, Selected work, About, Highlight, Contact) | P1, P2 | P0 |
| F2 | Work page (group filter + case rows) | P1, P2 | P0 |
| F3 | Case row (replaces the v1 project card) | P1, P2 | P0 |
| F4 | Bilingual EN/ID routing + toggle + language suggestion banner | P1, P2 | P0 |
| F5 | Contact: 4 kinds of mailto, Copy email, Download CV | P1, P2 | P0 |
| F6 | Single-user admin login | P3 | P0 |
| F7 | Admin project CRUD (EN+ID case fields, group, case button, visual, Show in Selected work, publish) | P3 | P0 |
| F8 | GA4 + cookie consent banner | P3 (insight), P1 (privacy) | P0 |
| F9 | SEO foundation (meta, hreflang, sitemap, robots, Person schema) | All | P0 |

### F1 — Homepage

**Story:** As a recruiter, I want to understand Rifaldi's role, stack and scale of work from the first screen on my phone, then get in touch or download the CV.

- [ ] Chapter order follows section 5; each chapter is one screen (`100svh`) with `y proximity` scroll snap; reduced motion → snap is turned off.
- [ ] The first screen at 390 × 844 and 375 × 667 holds the role label, the H1 and the "Email me" button, including while the consent banner shows.
- [ ] The availability line shows only when `availability_on` (S-14) is on.
- [ ] Selected work shows `published AND show_on_home` projects, ordered by `sort_order`, max. 5, with a "0n / 0N" counter and a rail of project names; the project title links to `/work#case-<slug>` (active locale).
- [ ] A project with `case_action = site` shows an "Open the live site ↗" link, and a project with `demo_url` a "Watch the demo ↗" link (D-42); a project with a screenshot visual shows the screenshot linking to `live_url` when present, otherwise to the case.
- [ ] About: statement, two paragraphs, Education, Certifications, Download CV link.
- [ ] SSO Highlight: statement with "five passwords" struck through, three numbers (5 → 1, ~200, 13), an internal-HRMS note, a bridge sentence to Contact.
- [ ] Contact: two mailto buttons (project first, then role; D-44), the email as a link + a Copy email button, LinkedIn, Download CV, GMT+7 clock; GitHub only when filled in (D-19).

### F2 — Work page

**Story:** As a recruiter, I want to see all projects and open the details of one project without leaving the page.

- [ ] H1 "Work" with the number of published projects; the sub is computed from the number of projects per group (D-30).
- [ ] Filter All / HR automation / HR systems / Websites / AI tools (with a count per group; D-43); the filter is client-only, and without JS all rows show.
- [ ] All published projects as rows (title · meta · side), ordered by `sort_order`.
- [ ] A row opens to show What it is, What I did (1–8 points), Stack, Status, the button for its `case_action`, then "Watch the demo ↗" and "View the code ↗" when `demo_url` / `repo_url` are set (D-42).
- [ ] `/work#case-<slug>` opens and scrolls to that row.
- [ ] Closing Contact chapter "Have a project like *these?*".
- [ ] Empty state when there are 0 projects: a short message + email CTA (never an empty page).

### F3 — Case row

The v1 card is replaced by the case row (F2) and the Selected work item (F1); the tech stack tags become "Stack" (max. 6).

- [ ] Outbound links (live site, demo, code) open a new tab with `rel="noopener noreferrer"`; `live_url`, `demo_url` and `repo_url` are rendered only when they are `https:`.
- [ ] All row text follows the active page language; screenshot alt text is per language too.
- [ ] A click on a site, demo or code link is logged as `project_link_click` (placement `home` or `case`, `link` `site`/`demo`/`code`), opening a row is logged as `case_open`, only when analytics consent is given.

### F4 — Bilingual EN/ID

**Story:** As a local client, I want to read the site in Indonesian without losing my place.

- [ ] EN at `/` and `/work`; ID at `/id` and `/id/work`. Both versions can always be opened directly with no forced redirect.
- [ ] "EN | ID" toggle in the navbar, the active language is marked; a click goes to the matching page (`/work` ↔ `/id/work`), not to the homepage.
- [ ] The language choice is stored in the `lang_pref` cookie (365 days).
- [ ] Suggestion banner: shows only when the user is on the EN version, the `Accept-Language` header contains `id` and the `lang_pref` cookie is not set yet. Content: "Also available in Indonesian" + a "Lihat versi Indonesia" button + a close button. Any click stores `lang_pref`, and the banner does not show again.
- [ ] No auto-redirect based on IP or `Accept-Language`; crawlers always get the content that matches the URL.
- [ ] The `<html lang>` attribute = `en` or `id` according to the page.

### F5 — Contact

**Story:** As an interested recruiter or client, I want to contact Rifaldi in one click or download his CV.

- [ ] Every email button is `mailto:hello@rifaldiradya.com` with the subject and body filled per kind: `general` (bar, hero), `role`, `project` (Contact), `walkthrough` (a case with `case_action = walkthrough`, the subject names the project title), in the page language (App Flow §11).
- [ ] Copy email only in Contact (D-17).
- [ ] Download CV in About and Contact.
- [ ] Events `contact_email_click` with `kind`, `cv_download` (with consent).
- [ ] No form and no visitor data on the server.

### F6 — Admin login

**Story:** As Pal, I want an admin area that only I can open.

- [ ] Only one admin account; no public register or password reset page.
- [ ] Login with email + password; session via an `httpOnly`, `secure`, `sameSite=lax` cookie that expires in 7 days.
- [ ] Every `/admin/*` route (except `/admin/login`) and every write API rejects a request without a valid session (redirect to login / 401 response).
- [ ] Login rate limit: at most 5 failed attempts per 15 minutes per IP.
- [ ] Generic login error message: "Email or password is incorrect" (does not reveal which one is wrong).
- [ ] The logout button deletes the session.

### F7 — Admin project CRUD

**Story:** As Pal, I want to add a new project in under 5 minutes so the portfolio is always up to date.

- [ ] Fields and publish rules follow App Flow S-12/S-13: title, group (HR automation / HR systems / Websites / AI tools), meta + side, short description, Show in Selected work, What it is, What I did, Stack, Status, case button (site / walkthrough / no button) + Live URL, Demo video URL and Code repository URL (optional, https), visual (screenshot + alt or numbers card), Published.
- [ ] "Show in Selected work" max. 5 (the UI disables the 6th switch, the API rejects it with 422); ↑/↓ ordering stays.
- [ ] Live URL is required only when the case button = site; it must be `https://`.
- [ ] Image upload: JPG/PNG/WebP, compressed in the browser, stored in MySQL (not the server filesystem).
- [ ] Error messages say how to fix the problem.
- [ ] Delete needs a confirmation dialog; related images are deleted too.
- [ ] After save/delete, the public pages update within 60 seconds without a redeploy.
- [ ] The admin form is comfortable on a phone (inputs ≥ 16 px, one column below 768 px).

### F8 — GA4 + cookie consent

**Story:** As Pal, I want to know whether the portfolio works, without breaking the privacy of EU visitors.

- [ ] The consent banner shows on the first visit with two equal choices: "Accept" and "Reject" (+ a short privacy policy link).
- [ ] Google Consent Mode v2 with the default `analytics_storage = denied`; GA4 stores no cookie before Accept.
- [ ] The choice is stored in the `consent` cookie (180 days); a "Cookie settings" link in the footer changes the choice.
- [ ] Tracked events: `page_view`, `contact_email_click` (with `kind`), `project_link_click`, `case_open`, `theme_switch`, `cv_download`, `language_switch`. Key events: `contact_email_click` and `cv_download`.
- [ ] The admin is not tracked.
- [ ] A short privacy policy page per language (`/privacy`, `/id/privacy`); `noindex` is not needed.

### F9 — SEO foundation

Full detail in section 9. Short acceptance:

- [ ] Title and meta description unique per page per language.
- [ ] hreflang `en`, `id` and `x-default` (→ EN) on every public page.
- [ ] `sitemap.xml` and `robots.txt` are generated automatically; the admin is not in the sitemap.
- [ ] `Person` + `WebSite` JSON-LD on the homepage.
- [ ] Open Graph + Twitter card per page (OG image 1200 × 630).

## 7. Out of scope (later roadmap)

Every item below is deliberately deferred. Trigger = the condition that makes the item worth doing.

| Item | Why deferred | Trigger to do it |
| --- | --- | --- |
| Case study page per URL | The case row on the Work page is enough | A project has a story that does not fit in one row |
| Contact form with data storage | Email is enough; a form adds personal data + spam handling | Inquiry volume grows or a structured brief is needed |
| Blurred HRMS screenshots | Internal screens | Pal gets permission and wants to replace the numbers card |
| Upwork/Fiverr profile links | Not decided yet | The profiles are active and should be linked |
| Testimonials | No written testimonials yet | A written testimonial exists that may be used |
| Blog/articles | Heavy content load, not a funnel need | The portfolio is stable and there is time for regular content |
| Services outside HR automation and HR systems | Outside the positioning | Not planned |
| Embedded demo video | A link is enough and needs no CSP change | Demo views matter enough to keep visitors on the page |

## 8. UI/UX direction & visual identity

**"Option B"** direction (D-02): warm black/white with lots of space, one scene per screen, a cobalt accent only on one italic word per heading, primary buttons, accent lines/hover and chapter light. Dark mode is always the default (it does not follow the device setting) and light comes through a remembered toggle, with no flash on load (D-23, D-36). Value reference: the `:root` block in `option-b.html`, moved as is into the token layer (SDD §8):

| Token | Dark (default) | Light |
| --- | --- | --- |
| `--bg` | `#0b0b0b` | `#f6f6f3` |
| `--ink` | `#f1f1ef` | `#111111` |
| `--soft` | `rgba(241,241,239,.62)` | `rgba(17,17,17,.64)` |
| `--faint` | `rgba(241,241,239,.16)` | `rgba(17,17,17,.14)` |
| `--accent` | `#7b93ff` | `#2f4fe0` |
| `--accent-ink` | `#0b0b0b` | `#ffffff` |
| `--calm` | `#d2bf9f` | `#8a7152` |
| `--k` (light strength) | `1` | `0.6` |

Contrast (WCAG, computed Oct 17, 2026): ink on bg 17.4 / 17.4; soft on bg 6.98 / 5.55; accent as text 6.99 / 5.85; label on the accent button 6.99 / 6.33 (all pass AA). **Rule:** `--calm` is only for light color, never for text (light is only 4.25:1); `--faint` is only for decorative lines, never the only border of an input (1.35–1.49:1); admin inputs must have a border ≥ 3:1 (use `--soft`).

**Typography:** Archivo (400, 500, 600, italic 500/600), self-hosted through `next/font`.

**Motion** (D-08, D-10): one dot field for the whole page with slow parallax (D-37), light per chapter, blur/fade focus per chapter, the About statement filling line by line, "five passwords" struck through and then the numbers counting, a progress bar, pinned Selected work steps, accent line hover on titles. All CSS scroll-driven (`view()`/`scroll()`) inside `@supports`, with a static stack fallback for old browsers and reduced motion. The H1 has a 900 ms rise-in animation **without fade** (`opacity` 1 from the first frame, LCP = the H1 text). No JavaScript scroll listener, animation library, or JS rotation/timer. The full motion table follows the mockup.

**Pointer layer (mouse only, D-31..D-35):** a dot cursor + a ring that trails slightly, grows over links/buttons and is labeled "Read"/"Visit" according to `data-cursor`; a light that follows the cursor with a color and strength per chapter; a project preview (screenshot or numbers card) beside the cursor while hovering a Selected work title and a Work row; screenshot tilt in Selected work (max. about 6°). Active only when `(hover: hover) and (pointer: fine)` and `pointerType === "mouse"`; it does not show on touch screens and is not loaded there.

**Components:** SDD §4.

**Mobile-first (required):** designed from 375 px first. Touch targets ≥ 44 × 44 px with spacing ≥ 8 px. No horizontal scroll at any width.

## 9. SEO & bilingual (i18n) requirements

SEO = **standard** level: a correct technical foundation for 2 languages, on-page per page, personal-brand structured data and readiness for AI search. Link building and blog content are out of scope.

**URL & language structure**

- Subfolder, not subdomain or query param: EN at the root, ID at `/id`. Slugs stay the same in both languages (`/work`, `/id/work`) so the page mapping stays simple.
- Every public page: `<link rel="canonical">` to itself (not to the EN version).
- Two-way hreflang + `x-default` → EN version, in `<head>` and in the sitemap.
- No automatic redirect based on language/location (see F4); crawlers and people see the same content for the same URL.

**Meta per page**

| Page | Title | Description |
| --- | --- | --- |
| `/` | Rifaldi Radya Pratama, HR Automation Engineer (n8n + AI) | I build n8n and AI workflows that automate onboarding and HR admin, backed by four years on the HRMS of a 13-company manufacturing group. Based in Jakarta. |
| `/work` | Work: HR Automation and HR Systems \| Rifaldi Radya Pratama | HR automations with n8n and AI, an enterprise HRMS, websites and AI tools by Rifaldi Radya Pratama. Open a row for what it is, what I did and the stack. |
| `/id` | Rifaldi Radya Pratama, HR Automation Engineer (n8n + AI) | Workflow n8n dan AI untuk otomasi onboarding dan administrasi HR, berbekal empat tahun di HRMS grup manufaktur 13 perusahaan. Berbasis di Jabodetabek. |
| `/id/work` | Karya: Otomasi HR dan Sistem HR \| Rifaldi Radya Pratama | Otomasi HR dengan n8n dan AI, HRMS enterprise, website, dan alat AI karya Rifaldi Radya Pratama. Buka satu baris untuk melihat detailnya. |

Meta does not mention availability (D-26).

**Keyword hypothesis:** "HR automation n8n", "n8n onboarding automation", "HR automation freelancer Indonesia" + personal name. Realistic target: ranking for **his own name** (branded search).

**On-page**

- One H1 per page (the hero headline on the homepage), H2/H3 hierarchy in order.
- All images via `next/image`: WebP/AVIF, responsive sizes, explicit `width`/`height` (anti-CLS), lazy-load except images above the fold, alt text per language.
- Semantic HTML: `header`, `nav`, `main`, `section`, `footer`; outbound links to live projects use descriptive anchor text.
- Open Graph + Twitter card per page per language, `og:locale` = `en_US` / `id_ID` with `og:locale:alternate`.

**Structured data (JSON-LD)**

- Homepage: `Person` (name, url, `jobTitle` "HR Automation Engineer", email, no `worksFor` (D-41), `knowsAbout` HR automation, n8n, LLM integration, Google Workspace, Power Automate, HRMS, C#, ASP.NET, SQL Server; `sameAs` `https://www.linkedin.com/in/rifaldiradya` + GitHub when filled in) + `WebSite` (name, url, inLanguage).
- Work page: `CollectionPage` with an `ItemList` of projects (name, `live_url` when present, otherwise the case URL `…/work#case-<slug>`).
- Schema content must match the content visible on the page.

**Crawl & index technical**

- Rendering: public pages are rendered statically (SSG) with on-demand revalidation when the admin saves, so full HTML is available to crawlers.
- Automatic `sitemap.xml`: 4 public pages + 2 privacy pages, each with `xhtml:link` alternate hreflang and `lastmod` from the last project update.
- `robots.txt`: allow all, disallow `/admin` and `/api`, list the sitemap URL. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are allowed so the profile can be quoted in AI search.
- Admin: `noindex, nofollow` via meta and header.
- Custom 404 page per language with links back to the homepage and Work.
- HTTPS required. Canonical version: `https://rifaldiradya.com` (non-www); `www.rifaldiradya.com` and `http://` redirect 301 to the canonical version with the same path.

**Ready for AI search (basic GEO):** the About paragraph is written factually and easy to quote: who, role, company, stack, how to get in touch, in full sentences, not only icons.

**After launch:** verify the domain in Google Search Console, submit the sitemap, check coverage for both languages and the hreflang report; check the Rich Results Test for the schema.

## 10. Non-functional requirements

| Area | Requirement | How verified |
| --- | --- | --- |
| Performance | Lighthouse mobile ≥ 90; LCP < 2.5 s, INP < 200 ms, CLS < 0.1; LCP = the H1 text; client JS on public pages (outside the Next.js runtime and GA4) is only: theme toggle, Work filter + hash, Copy email, GMT+7 clock, consent, language banner, combined target ≤ 6 KB gzip; scroll animation is CSS only, no `scroll` listener. Pointer layer (D-31..D-35): ≤ 3 KB gzip, loaded separately and only on mouse devices; no long task > 50 ms from it while moving the mouse on the Work page; INP stays < 200 ms | PageSpeed Insights on 4 public pages in both themes + DevTools Performance panel |
| Accessibility | WCAG 2.2 AA: contrast, visible focus ring (`:focus-visible`), full keyboard navigation, native elements (`button`, `a`), touch targets ≥ 44 px, `prefers-reduced-motion` respected, skip link to content | Lighthouse ≥ 95 + manual keyboard test + axe DevTools |
| Responsive | Correct layout at 360, 375, 768, 1024, 1440 px; no horizontal scroll | Manual test in DevTools + 1 real Android/iOS phone |
| Browsers | Last 2 versions of Chrome, Safari (including iOS), Firefox, Edge | Manual test |
| Security | HTTPS; admin password hashed (bcrypt/argon2); httpOnly + secure session cookie; login rate limit; server-side input validation; uploads limited by type & size; secrets only in environment variables, never in the repo; security headers (CSP, X-Frame-Options, Referrer-Policy) | Code review + header check via securityheaders.com |
| Privacy | No visitor personal data stored on the server; GA4 is active only after consent; `localStorage` `rr-theme` is only a display preference and is not sent anywhere; the privacy policy in each language mentions it | Test: reject consent → no `_ga` cookie |
| Availability | The public site still shows while the database/storage has an outage (serves the last static pages) | Simulation: cut the DB connection on staging |
| Maintainability | Project content only through the admin; static copy in separate translation files per language (not hardcoded in components) | Repo structure review |
| Cost | Rp 0 extra per month beyond Hostinger Business hosting + domain (all third-party services on free tiers) | Check each service's dashboard |

## 11. Technical & hosting constraints

| Constraint | Decision | Status |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript | Final |
| Hosting | Hostinger **Business Web Hosting** → Node.js Web Apps feature (the Business plan is among the supported ones; Node 18/20/22/24 runtime) | Final, needs a check in hPanel |
| Deploy | Push to GitHub → Hostinger GitHub integration builds automatically (install → build → start) on every push to the `main` branch | Final |
| Domain | rifaldiradya.com (already owned); demo projects at `staging0.` and `staging1.rifaldiradya.com` | Final |
| Email | hello@rifaldiradya.com | Final |
| Image storage | Not the server filesystem, so it is safe from redeploys. Locked: Hostinger MySQL, compressed in the admin browser (16:10, WebP, 4 widths) | Final (Sep 29, 2026, no third-party vendor) |
| Database | A small managed database for project data + the admin account (candidates compared in the SDD: Hostinger's built-in MySQL vs managed Postgres such as Supabase/Neon) | Decided in the SDD |
| Analytics | Google Analytics 4 + Consent Mode v2 | Final |
| Font | Archivo, self-hosted via `next/font` | Final |
| Working time | 5–10 hours/week outside a full-time job | Final |
| Sensitive data | Only admin credentials (hashed) and API secrets; no payment data; no visitor personal data other than consent-based analytics cookies | Final |

**Important note from the Hostinger docs:** the Node.js deploy flow creates a new website slot for the domain. If rifaldiradya.com is already registered as a website (e.g. WordPress) in the hosting plan, that website must be deleted first before deploying the Node.js app on the same domain ([Hostinger docs](https://docs.hostinger.com/node.js/creating-an-app)). First check whether the `staging0`/`staging1` subdomains are affected before deleting anything.

GitHub → automatic build flow and supported plans: [Hostinger GitHub integration](https://docs.hostinger.com/node.js/github), [Hostinger's official Next.js deploy guide](https://github.com/hostinger/deploy-nextjs).

## 12. Content dependencies (v2)

- [ ] Fill in 7 projects in the **production** admin after the release (EN/ID text from `T` in the mockup: `w*`, `r*`, `c*`, `peek.*`), set `show_on_home` and the order (D-18, D-29).
- [x] Web version of the CV PDF: Software Engineer variant without a phone number, cleaned of generator metadata, `public/cv/rifaldi-radya-pratama-cv.pdf`.
- [ ] Profile photo ≥ 640 × 640 px re-uploaded in S-14.
- [ ] Final confirmation of the hero and About text.
- [x] v2.2.0: HR Onboarding Automation project (group HR automation, repo link, workflow screenshot) filled in on devstaging (Oct 29, 2026); production follows after the release.
- [ ] v2.2.0 optional: a demo video link (the repo README says "available on request" for now); the CV title "Software Engineer (Full-Stack .NET)" can be refreshed later through a PATCH.
- [ ] Optional: blurred HRMS screenshots.

## 13. Risks, assumptions & open questions

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Coworkers see the freelance pitch | Awkward situation at the office | Availability switch in S-14 (D-16); meta without availability (D-26); employer named only in About (D-41) |
| Scroll-driven animation behaves differently in Safari/Firefox | Chapters are unreadable | Static stack fallback + required QA |
| Rollback after projects without a URL exist | v1 code breaks | Revert the merge **and** restore the pre-release DB backup (D-21) |
| Blur/filters and fonts lower the mobile score | Lighthouse < 90 | Lighthouse gate tested on staging before release |
| Scope creep (admin, bilingual, GA4) slows the launch | The 6-month transition plan slips | v1 scope is locked in this document; new items go into the section 7 table |
| The Node.js deploy on Hostinger clashes with the old WordPress website on the same domain | Downtime or the demo subdomains are disrupted | Check the website list in hPanel first; back up; test on a temporary subdomain before moving to the main domain |
| The Hostinger build fails because of the Node version/configuration | Deploy is delayed | Pin the Node version in `package.json` (`engines`), test the build locally before pushing |
| Content (About, descriptions, screenshots) is not ready when the code is done | Launch is delayed | Work on content in parallel from the first week (section 12) |
| Machine-translated copy feels stiff | Trust drops, especially in EN | Manual revision required; ask 1 fluent EN speaker to read it before launch |
| Free services (storage/DB) change their quotas | Upload/admin fails | Pick vendors with a free tier far above the need; public pages stay static |

**Assumptions**

- The Hostinger Business plan shows the Node.js Apps menu in Pal's hPanel account.
- Pal manages his own GitHub account and the repo can be private.
- Panasonic is named once, as track record in About and the CV (D-41); internal screens are not shown.
- Early traffic is small (< 1,000 visits/month), so the free tier of every service is enough.

**Open questions**

- [x] Is rifaldiradya.com currently still installed as a WordPress website on Hostinger? **Yes, still WordPress**, and **none of its content is needed** (confirmed Sep 28, 2026). WordPress is still backed up as a safety net, then replaced in Phase 4 after the test version passes QA (SDD section 10).
- [ ] The demo subdomains stay `staging0/1` for v1 (decided). Renaming later only needs an edit of the project URL in the admin.
- [x] Canonical version: **`rifaldiradya.com` (non-www)**, approved Sep 28, 2026.
- [x] Social link in the footer: **LinkedIn** `https://www.linkedin.com/in/rifaldiradya` (decided Sep 28, 2026). GitHub follows if wanted.
- [x] Time zone in the About facts block: **GMT+7 (WIB)**, confirmed Sep 28, 2026.

## 14. Release plan & milestones

Target: v1 live about **4 weeks** after the planning documents are done, assuming 5–10 hours/week (roughly 20–40 hours in total). This is an estimate, not a commitment; the gates below matter more than the dates.

&#91;embedded content: v1 release plan · 4 phases, 2 gates, 1 parallel content track\]

The deploy pipeline is tested in the first week with an empty page, so Hostinger problems show up before features are built. Launch only when every acceptance criterion in section 6 is checked and the section 3 metrics are met.

**Planning document order:** PRD (this document) → App Flow Document (screens, navigation, step-by-step flows, states, edge cases, data/API contracts) → SDD (architecture, final DB/storage choice, repo structure, rules for working with AI coding). Code execution happens separately with the vibe-coding-builder setup.

**v2.0.0:** assembled on `staging` (tasks T-23..T-33, SDD §12), released through a `staging` → `main` PR; v2.1.0 (pointer layer, admin preview, dark theme default, dot field, v2 icons, shorter HTML cache) released as a MINOR (tasks T-34..T-40); v2.2.0 (HR automation positioning, demo and code links, HR automation group) released as a MINOR (tasks T-41..T-45, D-40).
