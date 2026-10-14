# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi memakai SemVer lewat tag git di `main`: MAJOR = arah, positioning, arsitektur informasi, atau perubahan yang memutus kompatibilitas; MINOR = fitur, section, atau halaman baru; PATCH = perbaikan, copy, styling kecil.

## [Unreleased]

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

[Unreleased]: https://github.com/riyama46/rifaldiradya-portfolio/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/riyama46/rifaldiradya-portfolio/releases/tag/v1.0.0
