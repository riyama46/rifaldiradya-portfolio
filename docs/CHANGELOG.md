# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi memakai SemVer lewat tag git di `main`: MAJOR = arah, positioning, arsitektur informasi, atau perubahan yang memutus kompatibilitas; MINOR = fitur, section, atau halaman baru; PATCH = perbaikan, copy, styling kecil.

## [Unreleased]

## [2.0.2] - 2026-10-22

### Added

- Tautan GitHub (profil publik) di Contact dan JSON-LD `sameAs` (D-19 terpenuhi: repo sudah publik).

### Changed

- README ditulis ulang untuk repo publik; email admin di spec dikoreksi ke hello@rifaldiradya.com.

## [2.0.1] - 2026-10-22

### Fixed

- Rate limit login (E-10) tidak lagi bisa dilewati dengan banyak request serentak.
- Body JSON API admin, termasuk login, dibatasi 32 KB juga untuk request chunked tanpa `Content-Length`.
- URL live yang tidak ditampilkan di halaman (tombol case bukan "site") tidak lagi ikut di JSON-LD halaman Work.
- Gambar yang dihapus di satu tab tidak lagi bisa tersimpan di project/profil yang disimpan di tab lain.

### Changed

- Bersih-bersih kode: helper yang hanya dipakai test dihapus, cek fase build di satu tempat.

## [2.0.0] - 2026-10-18

Arah situs berubah: showcase software engineer full-stack .NET untuk recruiter dan klien proyek, dengan situs sebagai funnel ke email. Detail: `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/CHANGE.md`, keputusan D-01..D-30 di `docs/decisions/DECISIONS.md`.

### Added

- Home 5 bab dengan scroll snap: Hero, Selected work (dipin, maks. 5, penghitung + rail), About (Pendidikan, Sertifikasi, Download CV), Highlight SSO, Contact.
- Halaman Work baru: filter grup (Panasonic, Websites, AI tools), baris case yang bisa dibuka (`/work#case-<slug>`), sub dihitung dari data.
- Tema gelap/terang dengan toggle, tanpa flash saat load (`rr-theme`).
- Funnel email: mailto dengan subject dan isi terisi untuk 4 jenis (umum, posisi, proyek, walkthrough), Copy email di Contact, Download CV (PDF web tanpa nomor HP).
- Model data project v2 (grup, meta + side, isi case EN/ID, tombol case, visual screenshot/kartu angka, Show in Selected work maks. 5); migrasi `0004`.
- Admin: form per bagian (What I did per baris dengan paste multi-baris, Stack maks. 6, tombol case, visual), daftar dengan filter grup, saklar availability di Profile.
- Event GA4 `case_open`, `cv_download`, `theme_switch`; `contact_email_click` dengan `kind`.

### Changed

- Positioning, persona, copy EN/ID, meta SEO, JSON-LD `Person` (Software Engineer, `worksFor`, `knowsAbout`), gambar OG.
- Visual "Opsi B": font Archivo, aksen cobalt, token dua lapis; motion CSS scroll-driven dengan fallback statis.
- `live_url` opsional (proyek internal tanpa URL); rollback ke v1 butuh restore backup database (D-21).
- Foto profil minimal 640 px (varian 320/640).
- Spesifikasi (`docs/specs/`) dinaikkan ke 2.0.0.

### Removed

- HeroProofPanel (rotasi), service block, alur Brief → Build → Live, label section bernomor, highlighter, status dot berdenyut, CTA akhir, ProjectCard.
- Flag `availableForWork` (diganti saklar availability di admin).

### Fixed

- Paste beberapa baris ke What I did tidak lagi tergabung jadi satu baris.
- Foto profil dan availability disimpan dalam satu transaksi.

## [1.0.1] - 2026-10-17

### Fixed

- URL LinkedIn diganti ke `https://www.linkedin.com/in/rifaldiradya` (footer dan `sameAs` JSON-LD Person).

### Changed

- Dokumen dipindah ke layout `docs/specs/` (PRD, APP_FLOW, SDD) dan `docs/decisions/DECISIONS.md`, dengan header versi; CHANGELOG ini ditambahkan.
- Alur kerja: semua perubahan masuk `staging` dulu, baru `staging` → `main` (SDD bagian 10, DECISIONS 2026-10-13).

## [1.0.0] - 2026-10-02

### Added

- Situs publik bilingual (EN di `/`, ID di `/id`, tanpa auto-redirect bahasa): homepage (hero dengan panel bukti bergantian, services, selected work, about, CTA), `/work`, `/privacy`, 404.
- Admin `/admin`: login dengan rate limiting, CRUD project dengan draft/published, urutan ↑/↓, gambar dikompres di browser dan disimpan di MySQL (disajikan lewat `/media`), foto profil.
- SEO: canonical + hreflang, JSON-LD (WebSite + Person), sitemap, robots, gambar OG; hanya `rifaldiradya.com` yang bisa diindeks.
- GA4 dengan Consent Mode (tidak ada yang dimuat sebelum Accept); event `contact_email_click`, `project_link_click`, `language_switch`.
- Keamanan: CSP, HSTS, X-Frame-Options, cek Origin pada penulisan admin.
- Dua lingkungan: `main` → rifaldiradya.com, `staging` → devstaging.rifaldiradya.com, database terpisah; CI di keduanya.

[Unreleased]: https://github.com/riyama46/rifaldiradya-portfolio/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/riyama46/rifaldiradya-portfolio/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/riyama46/rifaldiradya-portfolio/releases/tag/v1.0.0
