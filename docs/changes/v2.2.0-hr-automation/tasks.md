# Tasks — v2.2.0 HR automation positioning

Build on `feat/v2.2.0-hr-automation`, PR into `staging`. Each task ends with lint, typecheck, format:check and the tests it touches.

- [ ] **T-41** Data: migration `0005` (`demo_url`, `repo_url`), schema, `projectInputSchema` + `fieldLabels`, group `automation` (D-42, D-43). Unit tests: project-validation, migrations.
- [ ] **T-42** Admin S-12/S-13: Demo video URL and Code repository URL fields in "Button on the case", four-option group control with the new labels, meta example, preview shows the demo link. Unit test: project-form; e2e: admin.
- [ ] **T-43** Public: DTO `demoUrl`/`repoUrl`, case row and Selected work links, `project_link_click` `link`, group order and Work sub, i18n keys. Unit tests: projects, analytics; e2e: work, selected-work.
- [ ] **T-44** Positioning: i18n EN/ID (hero, availability, SEO, About, Highlight meta, Contact, email bodies), Contact button order, `siteConfig` (role, stack, knowsAbout, no employer), JSON-LD, OG script stack + regenerated images. Unit tests: seo, i18n, site-config (no employer name).
- [ ] **T-45** Release (after the devstaging check): merge the deltas into `docs/specs/`, DECISIONS D-40..D-44, CHANGELOG 2.2.0, archive this folder, AGENTS.md "Active change: none", `package.json` 2.2.0. Tag on `main` is Pal's step.
