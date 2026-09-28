# rifaldiradya.com

Portfolio bilingual (EN/ID) Rifaldi Radya Pratama: landing page yang live dalam hitungan hari. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, di-deploy ke Hostinger Node.js lewat GitHub.

## Mulai

Butuh Node.js 24 (lihat `.nvmrc`).

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Script

| Script                            | Fungsi                              |
| --------------------------------- | ----------------------------------- |
| `npm run dev`                     | Server development                  |
| `npm run build`                   | Build produksi                      |
| `npm run start`                   | Jalankan hasil build                |
| `npm run lint`                    | ESLint                              |
| `npm run typecheck`               | Cek tipe TypeScript                 |
| `npm test` / `test:watch`         | Unit test (Vitest)                  |
| `npm run format` / `format:check` | Format / cek format dengan Prettier |

Script database dan e2e ditambahkan di task yang membutuhkannya (SDD bagian 12).

## Struktur folder

```text
app/          Route Next.js: publik di app/[lang] (en | id), 404 di app/global-not-found.tsx
components/   ui/ (primitif: Button, Badge, StatusDot, ArrowIcon); site/, overlays/, admin/ menyusul
i18n/         Kamus en.json + id.json, helper locale (index.ts), richText (rich.tsx)
lib/          Helper bersama (fonts, cn, header locale); db, auth, projects menyusul
styles/       globals.css: token desain, Tailwind, motion
tests/unit/   Unit test Vitest (i18n, richText, proxy)
docs/         PRD, App Flow, SDD, DECISIONS, dan mockup desain
  design/     homepage-mockup.html (referensi visual); archive/ berisi versi lama
proxy.ts      Routing: www → non-www, /en → /, locale rewrite, guard admin
AGENTS.md     Aturan untuk coding AI (dibaca di setiap sesi)
```

URL: bahasa Inggris tanpa prefix (`/`, `/work`), bahasa Indonesia di `/id` (`/id`, `/id/work`). Folder lain (`drizzle/`, `scripts/`, `tests/e2e/`) dibuat saat task yang membutuhkannya dikerjakan, mengikuti SDD bagian 4.

## Dokumen

- [docs/PRD.md](docs/PRD.md): apa yang dibangun dan kenapa, copy, visual, motion
- [docs/APP_FLOW.md](docs/APP_FLOW.md): layar, flow, state, edge case, kontrak API
- [docs/SDD.md](docs/SDD.md): arsitektur, stack, struktur repo, deploy, urutan task
- [docs/DECISIONS.md](docs/DECISIONS.md): log keputusan
