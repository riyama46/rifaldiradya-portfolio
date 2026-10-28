# AGENTS.md — rifaldiradya.com

## Specs (source of truth)

- Current: docs/specs/ (check `version` and `status: current` in each file's header). Live: v2.1.0 (git tag on `main`).
- Active change: docs/changes/v2.2.0-hr-automation/CHANGE.md (tasks.md alongside)
  → Implement ONLY what the active change describes. Where it conflicts with docs/specs, the change wins.
- docs/changes/archive/ is history only — never use it as requirements.
- Versions: PATCH = fix/tidy (builder directly) · MINOR = something new · MAJOR = direction/structure change. MINOR/MAJOR are planned as a CHANGE.md first (docs/changes/vX.Y.Z-name/CHANGE.md).
- Branch flow: every change → PR to `staging` → check on devstaging → PR `staging` → `main` (SDD section 10). Never PR directly to `main`.
- Release history: docs/CHANGELOG.md. Decision log: docs/decisions/DECISIONS.md.

## Sources of truth

1. docs/specs/APP_FLOW.md — screens, flows, states, edge cases, API contracts. Most binding.
2. docs/specs/SDD.md — architecture, stack, repo structure, security.
3. docs/specs/PRD.md — product reasoning, copy, visuals, Motion table.
4. docs/design/v2/option-b.html (public) and docs/design/v2/admin.html (admin) — visual & interaction reference. If the mockup differs from the docs, the docs win; if the docs are silent, follow the mockup. Ignore docs/design/archive/ (old versions).
   If none of them answers: STOP and ask. Do not make it up.

## Hard rules

- Next.js 16 App Router, TypeScript strict, Tailwind v4 tokens from styles/globals.css; `--calm`/`--faint` are not for text.
- Use proxy.ts, not middleware.ts.
- No new dependency without permission; no native dependencies.
- No language auto-redirect; locale only from the URL.
- No GA4/analytics cookies before consent=granted.
- No images on the server filesystem; project images are stored in MySQL (lib/images) and served through /media.
- No hardcoded UI text; everything comes from i18n/en.json and i18n/id.json.
- DB access only in lib/projects, lib/images and lib/auth.
- Do not add screens, fields, features or libraries beyond the docs.
- Scroll motion is CSS only (`@supports` + static fallback); client JS only for the components in PRD §10 and `PointerLayer` (mouse only, loaded separately; v2.1.0 D-31..D-35); no fade-in on the H1.
- Dictionary strings with markers (<em>, <s>, <strong>) are rendered through richText(), never dangerouslySetInnerHTML.
- New folders are created when the task that needs them is done, following the SDD section 4 structure (no empty placeholder files).
- Docs are written in English.

## How to work per task

1. Read the task (T-xx) and the docs sections it references.
2. Write a short plan: files to change + acceptance criteria met.
3. Implement small and focused.
4. Run: npm run lint, npm run typecheck, npm run format:check, npm test (+ test:e2e when relevant), npm run build.
5. Report: what was built, which ACs pass, what is not done.
6. Decisions that depart from the docs are logged in docs/decisions/DECISIONS.md, then the docs are updated.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
