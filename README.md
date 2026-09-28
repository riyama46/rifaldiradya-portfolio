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
| `npm run format` / `format:check` | Format / cek format dengan Prettier |

Script test dan database ditambahkan di task yang membutuhkannya (SDD bagian 12).

## Struktur folder

```text
app/          Route Next.js (publik di app/[lang], admin di app/admin, API di app/api/admin)
styles/       globals.css: token desain, Tailwind, motion
docs/         PRD, App Flow, SDD, DECISIONS, dan mockup desain
  design/     homepage-mockup.html (referensi visual); archive/ berisi versi lama
AGENTS.md     Aturan untuk coding AI (dibaca di setiap sesi)
```

Folder lain (`components/`, `i18n/`, `lib/`, `drizzle/`, `scripts/`, `tests/`) dibuat saat task yang membutuhkannya dikerjakan, mengikuti SDD bagian 4.

## Dokumen

- [docs/PRD.md](docs/PRD.md): apa yang dibangun dan kenapa, copy, visual, motion
- [docs/APP_FLOW.md](docs/APP_FLOW.md): layar, flow, state, edge case, kontrak API
- [docs/SDD.md](docs/SDD.md): arsitektur, stack, struktur repo, deploy, urutan task
- [docs/DECISIONS.md](docs/DECISIONS.md): log keputusan
