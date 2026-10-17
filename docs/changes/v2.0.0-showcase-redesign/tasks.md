---
change: v2.0.0-showcase-redesign
doc: tasks
status: approved
date: 2026-10-17
---

# Tasks v2.0.0 — Showcase software engineer

Satu task = satu sesi coding AI = satu PR kecil `feat/v2-<task>` → `staging`. Kerjakan berurutan; mulai dari `[ ]` pertama. Setiap task:

1. Baca bagian CHANGE.md yang dirujuk, lalu tulis rencana singkat dan tunggu persetujuan Pal.
2. Implementasi.
3. Jalankan `npm run lint && npm run typecheck && npm run format:check && npm test && npm run build` (+ `test:integration` / `test:e2e` bila relevan).
4. Laporkan acceptance yang lolos.

Komponen v1 yang digantikan dihapus di task yang menggantinya. Migrasi hanya menambah, kecuali `live_url` nullable (D-21).

Penomoran melanjutkan SDD §12 (T-01..T-22 = v1).

## Fase A — Persiapan

- [x] **T-23 Simpan change & rapikan rujukan.**
  - Commit `docs/design/v2/screens-option-b/`.
  - Pindahkan `docs/design/homepage-mockup.html` ke `docs/design/archive/`.
  - Simpan `docs/changes/v2.0.0-showcase-redesign/CHANGE.md` + `tasks.md` (status `approved`) dan `docs/changes/v2.1.0-pointer-layer/CHANGE.md` (status tetap `proposed`).
  - Isi "Active change" di AGENTS.md dengan v2.0.0.
  - Perbarui AGENTS.md "Sumber kebenaran #4" sesuai Delta SDD §13.
  - PR ke `staging`.

  *Rujukan:* CHANGE.md header, Delta SDD §4/§13. *Selesai bila:* AGENTS.md menunjuk active change dan mockup v2; tidak ada kode yang berubah.

## Fase B — Fondasi (gate: halaman v1 masih tampil utuh di staging)

- [x] **T-24 Token tema + Archivo + toggle tema.**
  - `styles/globals.css` dua lapis (Delta SDD §8), Archivo via `next/font`, `ThemeScript` inline (D-23), `ThemeToggle` (O-04, publik + admin).
  - Skin ulang `ui/*` (Button, Field, Toggle, Toast) dengan focus ring v2.
  - Hapus token/font v1 dan `<hl>`/`<dim>`/`<mark>` di `richText` (ganti `<em>`/`<s>`; kamus v1 yang memakai tag lama disesuaikan sementara).

  *Rujukan:* Delta PRD §8, Delta SDD §2/§5/§8, Delta APP_FLOW O-04, E-31. *Selesai bila:*
  - grep token v1 bersih;
  - tema tanpa flash (E2E frame pertama) di kedua tema;
  - axe bersih di kedua tema;
  - halaman v1 masih tampil.
- [x] **T-25 Migrasi `0004` + skema + validasi.**
  - `lib/db/schema.ts` (kolom baru, `live_url` nullable, `featured` deprecated), `0004_v2_showcase.sql`, `db:generate` + `db:embed`.
  - `lib/projects/validation.ts` dengan aturan kondisional dan batas 5 `show_on_home`.
  - `mutations`/`queries`/DTO v2.
  - `site_settings.availability_on`.
  - Avatar 640 (`kind=avatar` min 640, varian 320/640).

  *Rujukan:* Delta APP_FLOW §9/§10, Delta SDD §3. *Selesai bila:* AC-14; unit + integrasi untuk setiap aturan kondisional dan E-26/E-27 hijau.

## Fase C — Admin (gate: Pal bisa mengisi 7 proyek di staging)

- [x] **T-26 Admin proyek dan profil.**
  - S-11 (kolom, info, filter grup; hapus featured + E-08).
  - S-12/S-13 per bagian: `LinesInput`, `SegmentedControl`, `CaseActionField`, `VisualField`, Stack maks. 6; tanpa preview live.
  - S-14: foto 640 + switch availability.
  - API-03/04/09 sesuai kontrak.

  *Rujukan:* Delta APP_FLOW §6/§10, `admin.html`. *Selesai bila:*
  - AC-7, AC-8;
  - E2E UF-07/UF-08 versi v2;
  - form nyaman di 375 px;
  - semua kontrol berfungsi (yang di mockup masih tampilan saja: ↑/↓, + Add a line, hapus chip/baris, upload, Delete).
- [ ] **T-27 Konten staging (Pal, paralel mulai setelah T-26).**
  - Isi 7 proyek dari teks `T` di mockup.
  - Atur `show_on_home` + urutan (D-18).
  - Unggah screenshot SwiftPay/Bloom dan foto ≥ 640.
  - [x] Siapkan PDF CV web tanpa nomor HP (dibersihkan metadata generator): `public/cv/rifaldi-radya-pratama-cv.pdf`, disusun ulang dari "Career - CV Software Engineer - v1.0" (Drive), satu halaman A4.

  *Selesai bila:* semua proyek published tanpa error validasi; PDF siap di-commit.

## Fase D — Situs publik (gate: semua AC CHANGE.md lolos di staging)

- [x] **T-28 Shell publik.**
  - `SiteBar` (desktop + mobile sesuai mockup), `ScrollProgress`, `ChapterDepth` (titik + cahaya CSS per `data-zone`), footer v2, skip link.
  - Restyle O-02/O-03 dan S-04.
  - Hapus `Navbar`, `FooterCta`.

  *Rujukan:* Delta APP_FLOW G2/G3/§5, Delta SDD §4. *Selesai bila:* E2E bar + toggle bahasa + tema di 375/1280; tanpa scroll horizontal 320–1440.
- [x] **T-29 Home: Hero, About, Highlight, Contact.**
  - Copy dari kamus baru (kunci `T`).
  - `MailtoLink` 4 jenis, `CopyEmailButton` di Contact, `CvLink` + file `public/cv/rifaldi-radya-pratama-cv.pdf`, `LocalClock`, availability dari `site_settings`.
  - Motion CSS D-08 + H1 tanpa fade (D-10) + fallback E-30.
  - Hapus `HeroProofPanel`, `BylineBadge`, `MetaRow`, `SectionHeader`, `ServiceTile`, `ProcessSteps`, `AboutFacts`.

  *Rujukan:* Delta APP_FLOW S-01 bab 1/3/4/5, Delta PRD §4. *Selesai bila:* AC-1, AC-5 (mailto), AC-6, AC-9, AC-11, AC-13.
- [ ] **T-30 Home: Selected work.**
  - Item dipin + snap, penghitung 0n/0N, rail, judul → `/work#case-<slug>`, tautan situs, screenshot lazy, atribut `data-cursor`.
  - E-25.
  - Hapus `ProjectCard`.

  *Rujukan:* Delta APP_FLOW S-01 bab 2, D-06, D-18, D-20. *Selesai bila:* AC-2, AC-3 (sisi home); fallback daftar biasa tanpa scroll-driven.
- [ ] **T-31 Halaman Work.**
  - H1 + jumlah, `WorkFilter`, `CaseRow` (`<details>`), tombol case 3 jenis, hash open/reset filter, Contact penutup `#more`.
  - E-27/E-28/E-29.

  *Rujukan:* Delta APP_FLOW S-02, D-05, D-24. *Selesai bila:* AC-3, AC-4, AC-5; snap dan baris nyaman di HP.

## Fase E — SEO, analytics, privasi

- [ ] **T-32 SEO + analytics + Privacy.**
  - Meta baru, JSON-LD (Person, ItemList dengan URL case), OG ulang (`scripts/og-images.mts`), `events.ts` v2 + atribut `data-track`.
  - Privacy EN/ID (`rr-theme`, CV).
  - `site-config` LinkedIn baru + `github` kosong.
  - `check-deploy.mts` diperbarui.

  *Rujukan:* Delta PRD §9, Delta APP_FLOW §11, Delta SDD §7/§9. *Selesai bila:* AC-13; E2E UF-05 mencakup event baru dengan request Google dicegat; `check-deploy` lulus di staging.

## Fase F — QA & rilis

- [ ] **T-33 QA v2.0.0 + rilis.**
  - Jalankan semua Acceptance checks (AC-1..AC-15) dan QA manual (Delta SDD §11): Safari iOS nyata, Firefox, reduced motion, mode terang di semua bab, snap Work di HP, kontras soft, focus ring baris case, Lighthouse mobile ≥ 90 di 4 halaman dalam kedua tema.
  - Backup database produksi.
  - `version` 2.0.0, CHANGELOG `[2.0.0]`.
  - PR `staging` → `main`, tag `v2.0.0` + GitHub Release, `check-deploy --production`.
  - Merge CHANGE.md ke `docs/specs/` (header `version: 2.0.0`, `last_change`), salin D-01..D-28 ke DECISIONS, arsipkan change ke `docs/changes/archive/`, kosongkan "Active change".

  *Selesai bila:* semua kotak tercentang dan Pal menyetujui.

## Setelah rilis

- v2.1.0 (lapisan pointer + preview admin) sudah direncanakan di `docs/changes/v2.1.0-pointer-layer/CHANGE.md`. Untuk memulai, Pal cukup bilang ke builder: "approve dan build v2.1.0". Builder memeriksa ulang base version, mengubah status jadi `approved`, lalu build.
