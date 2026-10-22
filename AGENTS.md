# AGENTS.md — rifaldiradya.com

## Specs (source of truth)

- Current: docs/specs/ (cek `version` dan `status: current` di header tiap file). Live: v2.0.0 (tag git di `main`).
- Active change: docs/changes/v2.1.0-pointer-layer/CHANGE.md (status `approved`, belum mulai build)
  → Implement ONLY what the active change describes. Where it conflicts with docs/specs, the change wins.
- docs/changes/archive/ is history only — never use it as requirements.
- Versions: PATCH = fix/tidy (builder directly) · MINOR = something new · MAJOR = direction/structure change. MINOR/MAJOR are planned as a CHANGE.md first (docs/changes/vX.Y.Z-name/CHANGE.md).
- Alur branch: semua perubahan → PR ke `staging` → cek di devstaging → PR `staging` → `main` (SDD bagian 10). Jangan PR langsung ke `main`.
- Riwayat rilis: docs/CHANGELOG.md. Log keputusan: docs/decisions/DECISIONS.md.

## Sumber kebenaran

1. docs/specs/APP_FLOW.md — layar, flow, state, edge case, kontrak API. Paling mengikat.
2. docs/specs/SDD.md — arsitektur, stack, struktur repo, keamanan.
3. docs/specs/PRD.md — alasan produk, copy, visual, tabel Motion.
4. docs/design/v2/option-b.html (publik) dan docs/design/v2/admin.html (admin) — referensi visual & interaksi. Kalau mockup berbeda dengan docs, docs yang menang; kalau docs diam, ikuti mockup. Abaikan docs/design/archive/ (versi lama).
   Kalau semuanya tidak menjawab: BERHENTI dan tanya. Jangan mengarang.

## Aturan keras

- Next.js 16 App Router, TypeScript strict, Tailwind v4 token dari styles/globals.css; `--calm`/`--faint` bukan untuk teks.
- Pakai proxy.ts, bukan middleware.ts.
- Tidak ada dependency baru tanpa izin; tidak ada dependency native.
- Tidak ada auto-redirect bahasa; locale hanya dari URL.
- Tidak ada GA4/cookie analytics sebelum consent=granted.
- Tidak ada gambar di filesystem server; gambar project disimpan di MySQL (lib/images) dan disajikan lewat /media.
- Tidak ada teks UI hardcode; semua dari i18n/en.json dan i18n/id.json.
- Akses DB hanya di lib/projects, lib/images, dan lib/auth.
- Jangan menambah layar, field, fitur, atau library di luar docs.
- Motion scroll hanya CSS (`@supports` + fallback statis); JS klien hanya untuk komponen di PRD §10 dan `PointerLayer` (khusus mouse, dimuat terpisah; v2.1.0 D-31..D-35); tanpa fade-in pada H1.
- String kamus dengan penanda (<em>, <s>, <strong>) dirender lewat richText(), jangan dangerouslySetInnerHTML.
- Folder baru dibuat saat task yang membutuhkannya dikerjakan, mengikuti struktur SDD bagian 4 (tanpa file placeholder kosong).

## Cara kerja per task

1. Baca task (T-xx) dan bagian docs yang dirujuk.
2. Tulis rencana singkat: file yang diubah + acceptance criteria yang dipenuhi.
3. Implementasi kecil dan fokus.
4. Jalankan: npm run lint, npm run typecheck, npm run format:check, npm test (+ test:e2e bila relevan), npm run build.
5. Laporkan: apa yang dibuat, AC mana yang lolos, apa yang belum.
6. Keputusan yang menyimpang dari docs dicatat di docs/decisions/DECISIONS.md, lalu docs diperbarui.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
