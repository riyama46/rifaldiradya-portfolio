# SDD — rifaldiradya.com v1

Sep 27, 2026 · @Pal

> **Revisi 28 Sep 2026 — desain homepage v3.** Diperbarui: struktur repo (komponen baru, `lib/site-config.ts`, rich-text i18n, mockup di `docs/design/`), bagian 5 (rich-text + data featured bersama), 7 (gambar panel hero, parameter `placement`), 8 (token, tipografi, implementasi motion), 9 (flag availability), 11 (test), 12 (T-02, T-08, T-09), 13 (AGENTS.md). Arsitektur, database, auth, dan deploy tidak berubah.

## 1. Ringkasan arsitektur

v1 adalah **satu aplikasi Next.js** yang berjalan di Hostinger Business (Node.js web app), memakai **MySQL bawaan Hostinger** untuk data dan gambar (DECISIONS 2026-09-29: gambar pindah dari rencana Cloudinary ke MySQL). Halaman publik dirender statis dan hanya dibangun ulang saat admin menyimpan, jadi situs tetap cepat dan tetap tampil walau database sedang bermasalah.

&#91;embedded content: arsitektur v1 · 1 app Node.js, 1 database, 2 layanan eksternal\]

Gambar project disajikan dari `/media/…` dengan cache 1 tahun (`immutable`), jadi setelah permintaan pertama dilayani CDN Hostinger dan browser, bukan MySQL. GA4 dimuat di browser pengunjung setelah consent.

**Keputusan utama**

| # | Keputusan | Alasan singkat |
| --- | --- | --- |
| K1 | Satu repo, satu app Next.js (publik + admin + API) | Paling sedikit bagian bergerak untuk 1 orang dengan 5–10 jam/minggu |
| K2 | MySQL Hostinger, bukan Postgres eksternal | Sudah termasuk paket, koneksi lokal, ada backup Hostinger, tidak ada vendor tambahan yang bisa pause |
| K3 | Gambar disimpan di MySQL (dikompres di browser admin: 16:10, 4 lebar WebP), disajikan lewat `/media` dengan cache panjang | Aman dari redeploy (bukan filesystem), tanpa vendor pihak ketiga, ±300–500 KB per project (disetujui Pal, 29 Sep 2026) |
| K4 | Halaman publik statis + revalidasi on-demand | Performa maksimal dan tahan gangguan DB |
| K5 | Auth buatan sendiri yang minimal (1 admin, sesi di DB) | Tidak butuh layanan auth pihak ketiga untuk 1 user |
| K6 | Tanpa dependency native (bcryptjs, bukan argon2/bcrypt native; gambar dikompres di browser admin, bukan sharp di server) | Mengurangi risiko build gagal di Hostinger |

## 2. Tech stack final

Stack dipilih dengan satu kriteria utama: **sedikit bagian bergerak, tanpa build native, dan jalan di Hostinger Node.js tanpa trik**. Versi dikunci di `package.json`; upgrade minor hanya lewat PR terpisah.

| Lapisan | Pilihan | Versi | Alasan |
| --- | --- | --- | --- |
| Runtime | Node.js | 24 LTS (`engines: ">=24 <25"`) | Didukung Hostinger (18/20/22/24); jalur LTS terpanjang |
| Framework | Next.js App Router | 16.3.x, patch terbaru | Rilis stabil saat ini; ada security release terjadwal 16.3.7 pada 30 Sep 2026, langsung pakai begitu keluar. Build produksi `next build --webpack` (Turbopack gagal memproses CSS di server build Hostinger, lihat DECISIONS); `next dev` tetap Turbopack. |
| UI | React | 19.x (ikut Next.js) | — |
| Bahasa | TypeScript strict | 5.x | Stabil; TypeScript 7 belum dipakai di v1 |
| Styling | Tailwind CSS v4 + CSS variables | 4.x | Token warna/spacing dari PRD bagian 8 langsung jadi CSS variables |
| Font | `next/font/google` (self-host saat build): Space Grotesk, IBM Plex Sans | — | woff2, tanpa request runtime ke Google |
| Database | MySQL Hostinger | versi dari hPanel | Lihat bagian 3 |
| ORM & migrasi | Drizzle ORM + `mysql2` + drizzle-kit | terbaru stabil | Ringan, typed, migrasi berupa file SQL yang bisa dijalankan manual di phpMyAdmin bila perlu |
| Validasi | Zod | 3.x/4.x stabil | Satu skema dipakai client dan server |
| Password | `bcryptjs` | terbaru | Pure JS, tidak butuh kompilasi native saat build di Hostinger |
| Gambar | Canvas API di browser admin (resize + WebP) + tabel MySQL + custom `next/image` loader ke `/media` | — | Tanpa dependency tambahan; tanpa `sharp` di server |
| i18n | Kamus JSON + helper sendiri (tanpa library i18n) | — | Hanya 2 bahasa & sedikit string; menghindari middleware library yang melakukan auto-redirect bahasa (dilarang di App Flow G1) |
| Analytics | GA4 via `next/script` + Consent Mode v2 | — | Default denied sebelum consent |
| Test | Vitest (unit) + Playwright (e2e smoke) | terbaru | Cukup untuk validasi, util, dan flow utama |
| Kualitas kode | ESLint (config Next.js) + Prettier | — | — |
| Package manager | npm + `package-lock.json` | — | Default yang dikenali pipeline Hostinger |

Tidak dipakai di v1: CMS headless, NextAuth/Auth.js, Prisma, state management library, UI kit berat, library animasi.

## 3. Database & penyimpanan gambar

**Keputusan: MySQL bawaan Hostinger untuk data dan gambar.** (Rencana awal: Cloudinary untuk gambar; diganti 29 Sep 2026, lihat DECISIONS.)

| Opsi database | Kelebihan | Kekurangan | Hasil |
| --- | --- | --- | --- |
| MySQL Hostinger | Termasuk paket Business; koneksi lokal dari app di akun yang sama tanpa Remote MySQL; backup Hostinger; tidak ada vendor baru | Hanya MySQL; akses dari laptop saat dev butuh Remote MySQL atau DB lokal | **Dipilih** |
| Supabase (Postgres) | Integrasi satu klik di Hostinger, ada auth & storage | Vendor tambahan; project free tier bisa di-pause saat tidak aktif, dan situs portfolio jarang menulis data | Tidak |
| Neon/Postgres lain | Postgres serverless | Vendor tambahan, cold start, tidak ada keuntungan nyata untuk 1 tabel kecil | Tidak |

Hostinger menyatakan hanya menyediakan MySQL di paket shared/managed, dan app Node.js di akun yang sama terhubung secara lokal. Pakai host `127.0.0.1`, bukan `localhost`, karena Node.js bisa me-resolve `localhost` ke IPv6 `::1` yang ditolak user database ([Hostinger docs](https://docs.hostinger.com/websites/databases), [panduan MySQL + Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)).

**Development lokal:** MySQL 8.4 lokal via Docker (`docker compose up -d db`, konfigurasi di `docker-compose.yml`, port hanya di `127.0.0.1`) dengan skema yang sama. Database produksi tidak pernah dipakai untuk development. Migrasi juga dijalankan di CI terhadap service MySQL 8.4 (T-05), jadi tetap teruji walau mesin lokal belum punya Docker.

### Skema

| Tabel | Kolom | Catatan |
| --- | --- | --- |
| `projects` | `id` varchar(26) PK (cuid2/ulid) · `slug` varchar(100) unique · `title_en`, `title_id` varchar(80) · `summary_en`, `summary_id` varchar(160) · `live_url` varchar(300) · `tags` JSON (array string) · `thumbnail_public_id` varchar(255) null · `thumbnail_url` varchar(500) null · `thumbnail_width`, `thumbnail_height` int null · `thumbnail_alt_en`, `thumbnail_alt_id` varchar(140) null · `sort_order` smallint default 1 (posisi 1…n, unik, dijaga `lib/projects/mutations.ts`) · `featured`, `published` boolean default false · `created_at`, `updated_at` datetime(3) UTC | Index: (`published`, `sort_order`, `created_at`). Charset `utf8mb4`, collation `utf8mb4_unicode_ci`. |
| `admin_sessions` | `id` varchar(26) PK · `token_hash` char(64) unique (SHA-256 dari token) · `created_at` · `expires_at` · `last_seen_at` · `user_agent` varchar(255) | Token asli hanya ada di cookie; DB menyimpan hash. Sesi kedaluwarsa dibersihkan saat login. |
| `site_settings` | `key` varchar(50) PK · `value` varchar(255) null · `updated_at` | Pengaturan kecil dari admin; saat ini hanya `profile_photo` = id gambar (S-14). |
| `images` / `image_variants` | lihat "Gambar (MySQL)" di bawah | Gambar project (16:10) dan foto profil (1:1). |
| `login_attempts` | `id` bigint PK auto · `ip_hash` char(64) · `success` boolean · `created_at` | Untuk rate limit 5 gagal / 15 menit / IP. Baris > 7 hari dihapus saat login. IP disimpan sebagai hash, bukan mentah. |

Kredensial admin **tidak** disimpan di tabel: `ADMIN_EMAIL` dan `ADMIN_PASSWORD_HASH` di environment variable Hostinger (bagian 9). Ganti password = generate hash baru dengan skrip `npm run hash-password` lalu update env dan restart app.

Migrasi: drizzle-kit menghasilkan file SQL di `/drizzle` (`npm run db:generate`, bekerja tanpa koneksi DB). `0000_init.sql` membuat 3 tabel; `0001_utf8mb4.sql` (migrasi custom) memaksa `utf8mb4_unicode_ci` di ketiga tabel apa pun default server-nya. `npm run db:generate` juga menyalin isi `/drizzle` ke `lib/db/migrations.generated.ts` (`scripts/embed-migrations.mts`; setelah mengedit migrasi custom secara manual jalankan `npm run db:embed`), karena server Hostinger hanya membawa hasil build tanpa folder `/drizzle`. Hash dan urutannya identik dengan `readMigrationFiles()` milik Drizzle (dijaga unit test), dan CI gagal kalau file itu tidak sinkron. Penerapan lewat satu fungsi, `runMigrations()` di `lib/db/migrate.ts`, idempotent dan dilindungi MySQL named lock (`GET_LOCK`) supaya beberapa proses yang start bersamaan tidak saling bentrok:

- **Produksi: otomatis di `instrumentation.ts` setiap server start**, apa pun perintah start yang dipakai host. Hostinger ternyata menjalankan Next.js langsung, bukan `npm start` (terlihat dari runtime log 28 Sep 2026), jadi migrasi di perintah start tidak pernah jalan. Jika DB tidak terjangkau (`ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `EHOSTUNREACH`) atau migrasi gagal, error dicatat di runtime log (`[migrate] …`) dan server tetap melayani halaman statis (NFR Ketersediaan); migrasi dicoba lagi pada start berikutnya. `SKIP_MIGRATIONS=1` menonaktifkannya (darurat saja).
- `npm run db:migrate` (`scripts/migrate.mts --strict`, dijalankan `node` langsung; Node 24 membuang tipe TypeScript) untuk CI, development lokal, dan manual: kegagalan apa pun → exit 1.
- CI menguji dua proses migrasi paralel pada database kosong, lalu memastikan riwayat migrasi tercatat tepat sekali per file.
- Cadangan terakhir: jalankan SQL di `/drizzle` manual lewat phpMyAdmin (lalu isi `__drizzle_migrations` sesuai), hanya jika semua cara di atas gagal.

Seed tidak ada; project pertama diisi lewat admin.

### Gambar (MySQL)

- **Kompresi di browser admin** (`lib/images/compress.ts`): file JPG/PNG/WebP ≤ 5 MB, lebar ≥ 1200 px → crop 16:10 (gambar tinggi dipotong dari atas, gambar lebar dari tengah) → lebar standar di bawah hasil crop (640/960/1280) + hasil crop itu sendiri (maks. 1600) → WebP kualitas 0,8 (JPEG 0,82 jika browser tidak bisa encode WebP). Menggambar ulang lewat canvas juga membuang EXIF/GPS.
- **Upload (API-06)**: multipart dengan satu bagian `variant` per lebar. Server tidak mempercayai apa pun dari client: format dan ukuran dibaca dari byte file (`lib/images/inspect.ts`, hanya WebP/JPEG), set lebar harus persis hasil kompresi, bentuk 16:10, tiap varian ≤ 1 MB, terbesar ≥ 1200 px. Disimpan di `images` (1 baris per upload) + `image_variants` (1 baris per lebar, `MEDIUMBLOB`) dalam satu transaksi.
- **Delivery**: `/media/<id>.<ext>` (terbesar) dan `/media/<id>-<lebar>.<ext>`; loader `next/image` memilih lebar tersimpan terkecil yang cukup. Gambar tidak pernah berubah (thumbnail baru = id baru), jadi `Cache-Control: public, max-age=31536000, immutable`.
- **Project hanya memilih `public_id`**: API-03/04 mengambil url, lebar, dan tinggi dari tabel `images`, bukan dari request.
- **Hapus**: thumbnail lama dihapus setelah project tersimpan dengan gambar baru; API-05 (T-17) menghapus gambar project. Upload yang tidak pernah tersimpan dihapus lewat API-07 (Remove/Replace/Cancel) atau otomatis setelah 24 jam (dibersihkan saat upload berikutnya). Gagal hapus tidak membatalkan operasi utama, hanya dicatat di log. Salinan di cache CDN bisa bertahan, tapi tidak lagi ditautkan dari mana pun.

## 4. Struktur repo & konvensi kode

Repo GitHub private `rifaldiradya-portfolio`, satu branch produksi `main`. Struktur di bawah wajib diikuti; file baru di luar pola ini perlu alasan.

```text
/
├─ app/
│  ├─ [lang]/                  # root layout publik (G2); lang = en | id
│  │  ├─ layout.tsx            # <html lang={lang}>, navbar, footer, overlay
│  │  ├─ page.tsx              # S-01
│  │  ├─ work/page.tsx         # S-02
│  │  └─ privacy/page.tsx      # S-03
│  ├─ global-not-found.tsx     # S-04 untuk semua path tak dikenal; locale dari header x-locale (proxy)
│  ├─ admin/                   # root layout admin (G3), terpisah
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx        # S-10 (di luar grup, tanpa sesi)
│  │  └─ (panel)/              # route group: layout.tsx = requireAdmin() + header G3
│  │     ├─ page.tsx           # S-11 (/admin)
│  │     ├─ profile/page.tsx   # S-14 (foto profil, T-18b)
│  │     └─ projects/
│  │        ├─ new/page.tsx    # S-12
│  │        └─ [id]/page.tsx   # S-13
│  ├─ api/admin/               # API-01..07 (route handlers)
│  ├─ sitemap.ts
│  └─ robots.ts
├─ components/
│  ├─ site/                    # Navbar, Hero, BylineBadge, MetaRow, HeroProofPanel (client),
│  │                           # SectionHeader, ServiceTile, ProcessSteps, ProjectCard,
│  │                           # AboutFacts, FooterCta, CopyEmailButton (client), Footer, ...
│  ├─ overlays/                # LanguageToggle, LanguageSuggestBanner, CookieConsent
│  ├─ admin/                   # LoginForm, ProjectForm, ImageUploader, ConfirmDialog
│  └─ ui/                      # Button, Badge, Toggle, Toast, StatusDot, ArrowIcon (primitif)
├─ i18n/
│  ├─ en.json
│  ├─ id.json
│  ├─ index.ts                 # getDictionary(lang), localePath(path, lang), altPath(), interpolate()
│  ├─ server.ts                # resolveLocale(params) untuk page/layout (notFound jika bukan en/id)
│  └─ rich.tsx                 # richText(str): <hl>/<dim>/<mark>/<strong> → elemen React
├─ lib/
│  ├─ db/ (client.ts, schema.ts)
│  ├─ projects/ (queries.ts, mutations.ts, validation.ts, slug.ts)
│  ├─ auth/ (session.ts, password.ts, rate-limit.ts, guard.ts)
│  ├─ images/ (rules.ts, compress.ts, inspect.ts, upload.ts, store.ts, loader.ts)
│  ├─ seo/ (metadata.ts, jsonld.ts)
│  ├─ analytics/ (events.ts)
│  ├─ revalidate.ts
│  ├─ locale-header.ts         # nama header x-locale (dipakai proxy.ts dan global-not-found)
│  ├─ cn.ts, fonts.ts          # helper class + next/font
│  └─ site-config.ts           # availableForWork, timezoneLabel (konfigurasi non-secret)
├─ styles/globals.css          # tokens (CSS variables) + Tailwind + keyframes & motion
├─ drizzle/                    # file migrasi SQL
├─ scripts/ (hash-password.mts, migrate.mts)   # dijalankan `node` langsung (ESM, "type": "module")
├─ instrumentation.ts          # validasi semua env saat server produksi start
├─ drizzle.config.ts, docker-compose.yml
├─ tests/ (unit/, integration/, e2e/)  # Vitest (vitest.config.ts, vitest.integration.config.ts), Playwright
├─ docs/ (PRD.md, APP_FLOW.md, SDD.md, DECISIONS.md, design/homepage-mockup.html)
├─ proxy.ts                    # Next.js 16 (pengganti middleware): rewrite locale, 301, guard /admin, header x-locale
├─ AGENTS.md                   # aturan untuk coding AI (bagian 13)
├─ .env.example
└─ package.json
```

**Konvensi**

- TypeScript strict; tanpa `any` kecuali dengan komentar alasan.
- Server Components default; `"use client"` hanya untuk komponen interaktif (overlay, tombol copy email, rotasi HeroProofPanel, form admin). Animasi selain rotasi panel murni CSS, tanpa komponen client.
- Akses database hanya di `lib/projects/*` dan `lib/auth/*`; komponen tidak pernah import `lib/db` langsung.
- Semua string UI lewat `getDictionary(locale)`; tidak ada teks hardcode di komponen publik.
- Nama file komponen PascalCase, util camelCase/kebab-case sesuai contoh di atas.
- Commit message: Conventional Commits (`feat:`, `fix:`, `chore:`), satu fitur/fix per commit.

## 5. Routing, i18n, rendering & revalidasi

URL publik tetap seperti App Flow (`/`, `/work`, `/id`, `/id/work`), tapi di dalam app semua halaman publik hidup di `app/[lang]`. `proxy.ts` (pengganti `middleware.ts` di Next.js 16, berjalan di runtime Node.js) menjembatani keduanya ([Next.js 16](https://nextjs.org/blog/next-16)).

### proxy.ts — aturan lengkap (urut)

Matcher: semua path kecuali `/_next/static` dan `/_next/image`.

1. Host `www.rifaldiradya.com` → 301 ke `https://rifaldiradya.com` dengan path dan query yang sama. Berlaku untuk semua path yang lewat matcher, termasuk file statis dan `/api/*`. (Hostinger juga sudah me-redirect www di level server; aturan ini jaring pengaman.)
2. Lewati `/api/*` dan file statis (path berakhiran ekstensi: `favicon.ico`, `robots.txt`, `sitemap.xml`, `*.png`, dll.).
3. Path berakhiran `/` (kecuali root) → redirect permanen ke versi tanpa slash. Ditangani bawaan Next.js **sebelum** proxy berjalan, dengan status 308 (bukan 301); keduanya permanen dan diperlakukan sama oleh Google.
4. `/en` atau `/en/*` → 301 ke path tanpa `/en`.
5. `/admin/*` kecuali `/admin/login`: tidak ada cookie `admin_session` → 302 ke `/admin/login?next=<path>`. (Ini hanya filter cepat; validasi sesi sebenarnya tetap di server layout admin dan tiap API.)
6. `/admin*` → lanjut tanpa rewrite, tambahkan header `X-Robots-Tag: noindex, nofollow`.
7. `/id` atau `/id/*` → lanjut apa adanya (cocok dengan `app/[lang]` dengan `lang=id`).
8. Selain itu → **rewrite** (bukan redirect) ke `/en<path>`. URL di browser tetap tanpa prefix.

Tidak ada logika yang membaca `Accept-Language`, IP, atau `lang_pref` di proxy (App Flow G1).

### i18n

- `i18n/en.json` dan `i18n/id.json` berisi semua key App Flow bagian 11 + copy PRD bagian 4. Test unit memastikan kedua file punya key identik.
- `getDictionary(lang)` dipanggil di Server Components; komponen client menerima string lewat props (kamus tidak dikirim utuh ke browser).
- `richText(str)` di `i18n/rich.tsx` mengubah penanda di string kamus menjadi elemen React tanpa `dangerouslySetInnerHTML`: `<hl>` → `<span class="hl">` (highlighter), `<dim>` → `<span class="dim">`, `<mark>` → `<mark>`, `<strong>` → `<strong>`. Parser sederhana (tanpa nesting); tag lain dirender sebagai teks biasa. Test unit memastikan setiap key yang dipakai `richText` hanya berisi tag yang diizinkan dan tag-nya seimbang di `en.json` maupun `id.json`.
- `localePath('/work', 'id')` → `/id/work`; `localePath('/work', 'en')` → `/work`. Semua link internal wajib lewat helper ini.
- `altPath(currentPath)` menghasilkan path padanan untuk O-01, hreflang, dan O-02.
- `app/[lang]/layout.tsx`: `generateStaticParams` → `[{lang:'en'},{lang:'id'}]`; lang selain `en`/`id` → 404 lewat `resolveLocale()` → `notFound()`. **Jangan** pakai `dynamicParams = false`: bersama revalidasi on-demand, semua halaman publik jadi 404 (lihat DECISIONS T-15).

### Rendering & cache

| Route | Mode | Detail |
| --- | --- | --- |
| `/[lang]`, `/[lang]/work` | Statis (ISR) | Data dari `getPublishedProjects()`; homepage memanggil `getPublishedProjects()` sekali (tabel kecil, sudah terurut) lalu menurunkan dua daftar di memori: `featured` (maks. 3) untuk HeroProofPanel dan 6 teratas + jumlah total untuk section Selected work; `export const revalidate = 300` sebagai jaring pengaman + revalidasi on-demand saat admin menyimpan |
| `/[lang]/privacy`, not-found | Statis penuh | Tanpa data |
| `sitemap.ts`, `robots.ts` | Statis (ISR 300 s) | `lastmod` dari `max(updated_at)` |
| `/admin/*` | Dinamis | Selalu baca sesi dan data terbaru; tidak pernah di-cache |
| `/api/admin/*` | Dinamis | Route handlers, Node.js runtime |

- Setelah API-03/04/05 sukses: `revalidatePath('/[lang]', 'layout')` (mencakup 4 halaman publik) + `revalidatePath('/sitemap.xml')`. Hasil dibungkus try/catch → field `revalidated` di respons (E-19).
- Query publik dibungkus try/catch: DB gagal → log error, kembalikan `[]` hanya saat build; saat revalidasi runtime, lempar error supaya Next.js mempertahankan halaman statis lama (E-02).
- **Risiko build:** server build Hostinger belum tentu bisa menjangkau MySQL `127.0.0.1`. Karena itu build tidak boleh gagal tanpa DB, dan halaman terisi pada revalidasi pertama (≤ 5 menit setelah deploy atau saat admin menyimpan). Diuji di Fase 1.
- Catatan: App Flow E-19 menyebut revalidasi berbasis waktu maks 1 jam; SDD mengetatkan jadi 5 menit, perilaku lain sama.

## 6. Auth admin & keamanan

Satu admin, sesi disimpan di database, dan semua pemeriksaan dilakukan di server. `proxy.ts` hanya penyaring cepat; sumber kebenaran adalah `requireAdmin()`.

### Alur login (API-01)

0. Cek header `Origin` = `SITE_URL` (403). Env admin tidak valid → `503 ADMIN_NOT_CONFIGURED` (situs publik tetap jalan, lihat bagian 9).
1. Validasi body dengan Zod (email 1–254, password 1–200 karakter) → `400`.
2. Rate limit: hitung baris `login_attempts` gagal dalam 15 menit terakhir, **per IP** (`sha256(ip + "|" + RATE_LIMIT_SALT)`, ≥ 5) **dan global** (semua IP, ≥ 20). Salah satu terlampaui → `429` + `retryAfterSeconds` + header `Retry-After`; waktu tunggu = sampai kegagalan cukup banyak keluar dari jendela. IP diambil dari `x-real-ip`, lalu entri **terakhir** `x-forwarded-for` (ditambahkan proxy di depan app), fallback `"unknown"`. Entri pertama `x-forwarded-for` tidak dipakai karena bisa dipalsukan klien; batas global membuat brute force tetap mustahil walau header IP ternyata bisa dipalsukan.
3. Bandingkan email (case-insensitive, di-trim) dengan `ADMIN_EMAIL` dan password dengan `ADMIN_PASSWORD_HASH` via `bcryptjs.compare` (cost 12). Perbandingan bcrypt tetap dijalankan terhadap hash dummy walau email salah, supaya waktu respons tidak membocorkan info.
4. Catat attempt (success true/false). Kegagalan ke-5 langsung dijawab `429` (form terkunci), bukan `401`.
5. Sukses: buat token acak 32 byte (`crypto.randomBytes`), simpan `sha256(token)` di `admin_sessions` dengan `expires_at = now + 7 hari`, set cookie `admin_session` = token (`httpOnly`, `secure`, `sameSite=lax`, `path=/`, `maxAge` 7 hari). Hapus sesi dan attempt kedaluwarsa.

### requireAdmin()

- Dipanggil di `app/admin/layout.tsx` (kecuali halaman login) dan di awal setiap handler `/api/admin/*` selain login.
- Baca cookie → hash → cari sesi yang belum kedaluwarsa → perbarui `last_seen_at` (maks sekali per 5 menit).
- Tidak valid: halaman → `redirect('/admin/login?next=...')`; API → `401 UNAUTHENTICATED`.
- Logout (API-02): hapus baris sesi + hapus cookie.

### Kontrol keamanan lain

| Ancaman | Kontrol |
| --- | --- |
| CSRF | Cookie `sameSite=lax` + cek header `Origin` = `SITE_URL` di semua request tulis (`403 FORBIDDEN_ORIGIN`) |
| XSS | React escaping; tidak ada `dangerouslySetInnerHTML` kecuali JSON-LD yang dibentuk dari objek (di-`JSON.stringify` + escape `<`); input admin disimpan sebagai teks biasa |
| Upload berbahaya | Client: tipe JPG/PNG/WebP, maks 5 MB, lebar ≥ 1200 px, digambar ulang lewat canvas. Server: format + dimensi dari magic bytes (hanya WebP/JPEG; SVG/HTML/PNG ditolak), set lebar dan rasio 16:10 wajib cocok, maks 1 MB per varian; nama file dan MIME dari client diabaikan; disajikan dengan `Content-Type` dari DB + `X-Content-Type-Options: nosniff` |
| URL berbahaya di kartu | `live_url` wajib `https:`; dirender dengan `rel="noopener noreferrer"` |
| Brute force | Rate limit login + bcrypt cost 12 |
| Kebocoran secret | Semua secret di env Hostinger; `.env*` di `.gitignore`; `.env.example` tanpa nilai; tidak ada secret dengan prefix `NEXT_PUBLIC_` |
| Clickjacking & header | `lib/security-headers.ts` lewat `next.config.ts` `headers()` di semua respons: `Content-Security-Policy` (default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com, + 'unsafe-eval' hanya di dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: + host GA; font-src 'self'; connect-src 'self' + host GA; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera, mikrofon, lokasi, pembayaran, USB, topics dimatikan), `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` (produksi) |
| Dependency rentan | Aktifkan scan kerentanan otomatis Hostinger + Dependabot di GitHub; ikuti security release Next.js |
| Enumerasi admin | Pesan login generik; `/admin/*` noindex + disallow di robots |

CSP sengaja tanpa nonce: nonce per request memaksa semua halaman dirender dinamis, bertentangan dengan target performa statis. Risiko `'unsafe-inline'` rendah karena situs tidak menampilkan HTML buatan pengguna. CSP diuji di Fase 4; jika memblokir sesuatu, perbaiki allowlist, jangan matikan CSP.

## 7. SEO, analytics & consent

### SEO (implementasi PRD bagian 9)

- `lib/seo/metadata.ts` → `buildMetadata({ lang, path, titleKey, descKey })` dipakai setiap `generateMetadata`. Menghasilkan: `title`, `description`, `alternates.canonical` (URL absolut halaman itu sendiri), `alternates.languages` (`en`, `id`, `x-default` → EN), `openGraph` (title, description, url, `locale` en\_US/id\_ID, `alternateLocale`, gambar OG per bahasa 1200 × 630 di `/public/og/`), `twitter` (summary\_large\_image).
- `metadataBase = new URL(SITE_URL)`; `SITE_URL` = `https://rifaldiradya.com` (non-www kanonik, disetujui 28 Sep 2026). Redirect www → non-www ditangani aturan 1 `proxy.ts` (bagian 5); DNS tetap perlu record `www` yang mengarah ke app yang sama supaya request www sampai ke proxy. Semua canonical, hreflang, sitemap, OG `url`, dan JSON-LD memakai versi non-www.
- `lib/seo/jsonld.ts` → `personJsonLd(lang)`, `websiteJsonLd(lang)`, `collectionJsonLd(lang, projects)`; dirender sebagai `<script type="application/ld+json">` di Server Component (bukan ditambahkan via JS client), supaya terlihat di HTML awal.
- `app/sitemap.ts`: 6 URL (home, work, privacy × 2 bahasa), masing-masing dengan `alternates.languages`, `lastModified`.
- `app/robots.ts`: allow `/`, disallow `/admin` dan `/api`, `sitemap: SITE_URL/sitemap.xml`. Tidak ada blok khusus crawler AI (diizinkan). **Hanya jika `SITE_URL` = `https://rifaldiradya.com`**; deployment lain (devstaging, lokal) mendapat `Disallow: /` dan semua halaman `noindex` (`isIndexable()` di `lib/seo/metadata.ts`).
- Halaman statis, sitemap, dan robots memakai `SITE_URL` **saat build** (lalu diperbarui oleh revalidasi ≤ 5 menit). Karena itu langkah Fase 4 "ubah `SITE_URL`, lalu redeploy" wajib: redeploy membangun ulang dengan domain utama.
- Admin: `metadata.robots = { index: false, follow: false }` + header dari proxy.
- Gambar: `next/image` + loader `/media`, `sizes` diisi sesuai grid (`(min-width:1200px) 33vw, (min-width:768px) 50vw, 100vw`). Gambar prioritas (`loading="eager"` + `fetchPriority="high"`; prop `priority` sudah deprecated di Next.js 16) hanya untuk: slide pertama HeroProofPanel di S-01 (`sizes="(min-width:1024px) 560px, 100vw"`) dan kartu pertama di S-02. Slide panel ke-2 dan ke-3 dirender dengan `loading="lazy"` + `fetchPriority="low"` dan elemen `<img>`-nya baru dipasang setelah `requestIdleCallback` (fallback `setTimeout` 2 s), paling lambat sebelum rotasi pertama.

### Analytics & consent (implementasi F8)

- Komponen `<Analytics />` (client) di layout publik dan 404 (tidak di admin). **Mode dasar (DECISIONS T-19):** `gtag.js` baru diminta setelah `consent=granted`, baik saat halaman dibuka dengan cookie itu maupun tepat setelah Accept. Urutannya: `gtag('consent','default', semua denied)` → `gtag('consent','update',{ analytics_storage:'granted' })` → `gtag('config', ID)` (mengirim `page_view` halaman saat ini) → skrip `gtag/js?id=…` disisipkan. Tanpa consent tidak ada skrip, cookie, maupun ping tanpa cookie ke Google. Iklan tidak dipakai, jadi semua `ad_*` tetap denied selamanya.
- Navigasi client (Link) dihitung oleh GA4 Enhanced measurement "Page changes based on browser history events" (biarkan aktif di pengaturan stream).
- `<CookieConsent />` (client): baca/tulis cookie `consent` (180 hari, `sameSite=lax`, `secure`), panggil `gtag('consent','update', ...)`. Reject setelah sebelumnya granted → hapus cookie `_ga`, `_ga_<ID>` di domain `.rifaldiradya.com` dan path `/`.
- `lib/analytics/events.ts` → `track(name, params)` dengan tipe ketat untuk 4 event App Flow bagian 11 (termasuk `placement: 'hero_panel' | 'card'` di `project_link_click`); fungsi tidak melakukan apa-apa jika ID kosong, `window.gtag` tidak ada, atau consent bukan granted. Tautan yang dirender server menandai event lewat atribut (`data-track`, `data-location`, `data-method`, `data-slug`, `data-placement`) dan satu listener klik di `<Analytics />` mengubahnya jadi `track()`, jadi tautan tetap Server Component. `language_switch` dipanggil langsung oleh O-01/O-02.
- Di GA4: tandai `contact_email_click` sebagai key event; aktifkan data retention 14 bulan; tidak perlu Google Signals.
- Search Console: verifikasi via DNS TXT di hPanel; submit sitemap setelah launch.

Consent Mode v2 dan kewajiban banner untuk pengunjung EEA/UK mengikuti panduan resmi Google; teks banner dan halaman privacy ditulis sederhana dan jujur, bukan template hukum. Ini bukan nasihat hukum.

## 8. Design system di kode

Token PRD bagian 8 menjadi satu sumber di `styles/globals.css`; komponen hanya boleh memakai token, tidak boleh nilai warna/spacing mentah.

```css
@import "tailwindcss";

@theme {
  --color-bg: oklch(98.5% 0.008 85);
  --color-surface: oklch(96% 0.012 85);
  --color-surface-raised: oklch(100% 0 0);
  --color-border: oklch(88% 0.015 80);
  --color-text: oklch(22% 0.02 60);
  --color-text-muted: oklch(45% 0.02 60);
  --color-accent: oklch(52% 0.15 50);
  --color-accent-hover: oklch(47% 0.14 48);
  --color-accent-soft: oklch(93% 0.05 75);
  --color-success: oklch(51% 0.13 150);   /* L51: ≥ 4,8:1 di bg, surface, raised */
  --color-danger: oklch(55% 0.18 28);

  --font-display: var(--font-space-grotesk), system-ui, sans-serif;
  --font-sans: var(--font-plex-sans), system-ui, sans-serif;

  --radius-card: 12px;
  --radius-button: 10px;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-pulse: cubic-bezier(0.2, 0.6, 0.35, 1);

  --shadow-card: 0 1px 2px oklch(40% 0.04 60 / 0.06), 0 4px 12px oklch(40% 0.04 60 / 0.06), 0 12px 32px oklch(40% 0.04 60 / 0.05);
  --shadow-card-hover: 0 2px 4px oklch(40% 0.04 60 / 0.06), 0 8px 20px oklch(40% 0.04 60 / 0.08), 0 20px 48px oklch(40% 0.04 60 / 0.07);

  --slide-ms: 6000ms;          /* durasi per project di HeroProofPanel */
}
```

- Font: `next/font/google` → `Space_Grotesk({ weight: ['600'], subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' })` dan `IBM_Plex_Sans({ weight: ['400','500'], ... variable: '--font-plex-sans' })`. Hanya bobot yang dipakai.
- Skala tipe (mobile → desktop) memakai `clamp()`:

| Peran | Nilai |
| --- | --- |
| Display H1 hero | `clamp(2.5rem, 5.4vw, 4.25rem)`, line-height 1.05, `letter-spacing: -0.03em`, `max-width: 14ch` |
| Display H2 CTA akhir | `clamp(2.25rem, 5.5vw, 3.75rem)`, line-height 1.08, `letter-spacing: -0.025em`, `max-width: 14ch` |
| H2 section | `clamp(1.75rem, 3.5vw, 2.25rem)`, line-height 1.2 |
| Judul tile utama | `clamp(1.5rem, 2.6vw, 1.875rem)`, line-height 1.2 |
| Lead About | `clamp(1.25rem, 2.2vw, 1.625rem)`, Space Grotesk 600, line-height 1.4, `text-wrap: pretty` |
| Body | 1.0625rem → 1.125rem (≥ 1024 px); subheadline hero 1.1875rem di ≥ 1024 px |
| Eyebrow / label fakta | 13px, Plex 500, uppercase, `letter-spacing: 0.08em` |

- Spacing hanya dari skala Tailwind (kelipatan 4 px); jarak section `py-16 lg:py-24`; hero `pt-6 pb-16 lg:pt-18 lg:pb-28`; CTA akhir `py-28 lg:py-44`.
- Kontras: wajib dicek otomatis (axe di Playwright) dan manual untuk teks putih di atas `--color-accent`, teks muted di atas `--color-accent-soft` (highlight About), dan label 13 px muted di atas `--color-surface`. Jika < 4,5:1, gelapkan token terkait sampai lolos, catat di `docs/DECISIONS.md`.
- Komponen `ui/*` punya state lengkap: default, hover, focus-visible (outline 2 px `--color-accent`, offset 2 px), active (`scale-[0.98]`), disabled, loading.
- Dark mode: tidak ada di v1 (sesuai App Flow bagian 12).

### Motion di kode

Semua motion mengikuti tabel Motion di PRD bagian 8. Keyframes dan aturan motion tinggal di `styles/globals.css` (bukan per komponen) supaya mudah diaudit.

- **Transisi interaksi** (hover/tekan): util Tailwind `transition-[transform,opacity,box-shadow] duration-200 ease-[var(--ease-out)]`, dibungkus `motion-safe:`.
- **Highlighter** `.hl::before`: blok `--color-accent-soft`, `transform: skew(-10deg) rotate(-1.2deg)`, `transform-origin: left`. Di H1: `animation: hl-draw 700ms var(--ease-out) 250ms both` (scaleX 0 → 1), sekali saat load.
- **StatusDot**: `<span>` 8 px dengan `::after` yang menjalankan `pulse 2.2s var(--ease-pulse) infinite` (`scale 1 → 2.8`, `opacity 0.5 → 0`). Hanya `transform`/`opacity`, jadi berjalan di compositor.
- **Animasi berbasis scroll**: seluruhnya dibungkus
  ```css
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) { /* ... */ }
  }
  ```
  | Target | Timeline & range | Keyframes |
  | --- | --- | --- |
  | `.hero::before` (grid) | `scroll(root)`, `0 100vh` | `translateY(0 → 96px)` |
  | Kartu bayangan panel (≥ 1024 px) | `scroll(root)`, `0 100vh` | `translate(10px,-10px) → translate(10px,22px)` |
  | `.reveal` (tile, kartu, isi About) | `view()`, `entry 0% entry 70%` (elemen kedua: `entry 15% entry 85%`) | `opacity 0 → 1`, `translateY(24px → 0)` |
  | Garis SectionHeader | `view()`, `entry 10% cover 35%` | `scaleX(0 → 1)` |
  | Garis ProcessSteps | `view()`, `entry 30% cover 45%` | `scaleX(0 → 1)` |
  | Highlighter judul CTA akhir | `view()`, `entry 20% cover 50%` | `scaleX(0 → 1)` |
  | `<mark>` di About | `view()`, `entry 60% cover 45%` | `background-size: 0% → 100%` |

  Tanpa dukungan (mis. Firefox saat ini), elemen tampil statis dalam keadaan akhirnya; tidak ada fallback JavaScript/IntersectionObserver.
- **HeroProofPanel** (`"use client"`, ≤ 2 KB gzip):
  - Slide ditumpuk dengan `grid-area: 1/1`; slide aktif `opacity:1`, lainnya `opacity:0; visibility:hidden; transform: scale(1.015)`; transisi 450 ms (opacity) / 600 ms (transform).
  - Timer **tidak** memakai `setInterval`: progress bar tombol aktif menjalankan `animation: fill var(--slide-ms) linear forwards`, dan event `animationend` memindahkan ke slide berikutnya. Jeda = `animation-play-state: paused` lewat CSS (`.paused`, `:hover`, `:focus-within`), jadi hover/fokus/pause tidak butuh logika timer.
  - `prefers-reduced-motion: reduce` → class `paused stopped` saat mount; progress bar tampil penuh, tidak ada rotasi.
  - URL dan judul di caption memudar 200 ms saat berganti; `aria-label` link ikut diperbarui; tidak ada `aria-live`.
  - Tanpa JavaScript (E-24): markup server sudah menampilkan slide pertama sebagai aktif; kontrol disembunyikan sampai komponen ter-hydrate.
- **Larangan**: tidak ada fade-in pada H1, subheadline, atau panel hero (menunda LCP); tidak ada listener `scroll` untuk animasi; tidak ada library animasi; `prefers-reduced-motion: reduce` mematikan semua `animation` dan `transition` secara global.

## 9. Environment variables & konfigurasi

Semua variabel divalidasi oleh `lib/env.ts` (Zod) dalam 4 kelompok: site, database, admin, analytics (gambar di MySQL tidak butuh env tambahan). Setiap kelompok dicek saat pertama dipakai (`databaseEnv()`, `adminEnv()`, dst.), supaya `next build` di CI dan development lokal tetap jalan tanpa semua secret. Di server produksi, `instrumentation.ts` memanggil `assertServerEnv()` saat start untuk kelompok di `REQUIRED_AT_START`: variabel wajib yang hilang membuat app gagal start dengan pesan jelas yang menyebut semua variabel bermasalah per kelompok (tanpa menampilkan nilainya), bukan error acak saat runtime. `REQUIRED_AT_START` hanya berisi kelompok yang fiturnya sudah dibangun: `site`, `database`, `analytics` (opsional, tapi ID yang salah format ditolak). Kelompok khusus admin (`CHECKED_AT_START`: `admin`) dicek saat start tapi **hanya dicatat** (`[env] admin login disabled until fixed: …`): kesalahan di secret admin menonaktifkan login admin (`503 ADMIN_NOT_CONFIGURED`), bukan seluruh situs publik (NFR Ketersediaan). Deploy juga tidak pernah perlu mengisi nilai palsu untuk fitur yang belum ada. `SKIP_ENV_VALIDATION=1` hanya untuk mencoba build produksi di lokal; jangan pernah diset di Hostinger.

| Variabel | Contoh / format | Wajib | Publik? | Keterangan |
| --- | --- | --- | --- | --- |
| `SITE_URL` | `https://rifaldiradya.com` | ya | tidak | Basis canonical, sitemap, cek Origin |
| `DATABASE_HOST` | `127.0.0.1` | ya | tidak | Jangan `localhost` |
| `DATABASE_PORT` | `3306` | ya | tidak | — |
| `DATABASE_NAME` / `DATABASE_USER` / `DATABASE_PASSWORD` | dari hPanel → Databases | ya | tidak | User khusus app, hanya akses ke 1 database |
| `ADMIN_EMAIL` | `rifaldi@rifaldiradya.com` | ya | tidak | Email login admin |
| `ADMIN_PASSWORD_HASH` | hash bcrypt cost 12, **di-encode base64** (tanpa `$`) | ya (admin) | tidak | Dibuat dengan `npm run hash-password` di terminal sendiri (input tersembunyi). Base64 karena `$` pada hash mentah dianggap referensi variabel di file `.env` (dotenv-expand) dan bisa merusak hash; hash mentah `$2b$…` tetap diterima |
| `RATE_LIMIT_SALT` | string acak 32+ karakter | ya | tidak | Untuk hash IP |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | tidak | ya | Kosong → komponen analytics & banner consent tidak dirender (berguna di dev) |
| `NODE_ENV` | `production` | otomatis | — | Diset platform |

- Di Hostinger: isi lewat pengaturan environment variables app Node.js, lalu **restart app** (env tidak di-reload otomatis). Variabel `NEXT_PUBLIC_*` dibaca saat **build**, jadi setelah mengubahnya perlu redeploy, bukan hanya restart.
- Lokal: `.env.local` (tidak di-commit). `.env.example` berisi semua nama variabel tanpa nilai.
- Konfigurasi non-secret di `lib/site-config.ts` (di-commit, bukan env): `availableForWork: boolean` (mengatur item "Available for new projects" di MetaRow; nilai awal `true`, diputuskan 28 Sep 2026), `timezoneLabel: 'GMT+7'` (dikonfirmasi 28 Sep 2026; dipakai blok fakta About lewat interpolasi kamus), dan `social: { linkedin: 'https://www.linkedin.com/in/rifaldi-radya-070a44174/' }` (dipakai link footer dan `sameAs` JSON-LD `Person`). Mengubahnya = commit + deploy (beberapa menit); sengaja tidak dimasukkan ke admin supaya scope v1 tidak bertambah.
- `next.config.ts`: `images.loader: 'custom'`, `images.loaderFile: './lib/images/loader.ts'`, `deviceSizes` = lebar tersimpan, `headers()` keamanan (bagian 6), `poweredByHeader: false`, `reactStrictMode: true`.
- `package.json` (`"type": "module"`) scripts: `dev`, `build`, `start` (`next start`; migrasi berjalan otomatis di `instrumentation.ts`; Next.js membaca `PORT` dari env Hostinger), `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `hash-password`.

## 10. Deploy ke Hostinger via GitHub

Alurnya: kode di GitHub → Hostinger menarik repo → install, build, start otomatis setiap push ke `main` ([Hostinger GitHub integration](https://docs.hostinger.com/node.js/github)). Deploy pertama dilakukan di subdomain uji dulu, domain utama baru dipindah setelah semuanya hijau.

### Persiapan sekali saja

- [ ] **Cek domain utama di hPanel → Websites.** Jika rifaldiradya.com masih terpasang sebagai website (mis. WordPress), jangan dihapus dulu. Backup file + database WordPress lewat hPanel, dan pastikan subdomain `staging0`/`staging1` terdaftar sebagai website terpisah yang tidak ikut terhapus.
- [ ] Buat repo GitHub private, push skeleton Next.js yang sudah bisa `npm run build` di lokal.
- [ ] hPanel → Databases: buat database MySQL + user khusus app; catat nama, user, password.
- [ ] Buat property GA4, catat Measurement ID.
- [ ] Generate `ADMIN_PASSWORD_HASH` di lokal.

### Deploy pertama (Fase 1, di subdomain uji)

1. hPanel → Websites → Add Website → Node.js web app → Import Git repository → Connect with GitHub → pilih repo, branch `main`.
2. Periksa setting yang dideteksi otomatis: framework Next.js, Node 24, build `npm run build`, start `npm run start`, root directory `/`.
3. Pakai subdomain uji: **`devstaging.rifaldiradya.com`** (dipilih 28 Sep 2026), dengan `SITE_URL=https://devstaging.rifaldiradya.com`.
4. Isi environment variable kelompok yang sudah wajib (`REQUIRED_AT_START`, bagian 9), lalu Deploy. Output directory `.next`, package manager npm.
5. Pantau build log. Jika gagal: cek versi Node, script `package.json`, dan dependency native (App Flow melarang yang native). `TurbopackInternalError … node process exited` = build berjalan dengan Turbopack; pastikan script `build` masih `next build --webpack`.
6. Verifikasi (bertahap sesuai fitur yang sudah ada): halaman publik tampil, migrasi membuat tabel; `/admin/login` bisa login (T-13), upload gambar + tampil dari `/media` (T-16), revalidasi bekerja (T-15).

### Pindah ke domain utama (Fase 4)

1. Hapus/lepas website lama di rifaldiradya.com hanya setelah backup dan setelah versi uji lolos QA. Dokumentasi Hostinger menyebut alur deploy Node.js membuat slot baru, jadi domain yang sudah terpasang harus dilepas dulu ([Hostinger docs](https://docs.hostinger.com/node.js/creating-an-app)).
2. Hubungkan domain rifaldiradya.com ke app Node.js; pastikan SSL aktif untuk `rifaldiradya.com` dan `www.rifaldiradya.com`; cek `https://www.rifaldiradya.com/work` → 301 ke `https://rifaldiradya.com/work`.
3. Ubah `SITE_URL` ke domain utama, redeploy.
4. Cek ulang: canonical, sitemap, hreflang memakai domain utama; email di hello@rifaldiradya.com tetap berfungsi (record MX tidak boleh berubah).

### Alur kerja sehari-hari

- Branch fitur (`feat/...`) → PR → CI GitHub Actions (lint, typecheck, unit test, build) harus hijau → merge ke `main` → deploy otomatis.
- Jangan push langsung ke `main` kecuali hotfix kecil.
- Migrasi database: generate di lokal, commit file SQL, dijalankan otomatis saat start. Backup database di hPanel sebelum merge perubahan skema.

### Rollback

- Kode: `git revert` commit bermasalah → push ke `main` → deploy ulang otomatis.
- Data: restore backup database di hPanel.
- Migrasi v1 hanya boleh menambah (kolom/tabel baru), tidak menghapus, supaya rollback kode tetap kompatibel dengan skema.

## 11. Testing & QA

Test otomatis fokus pada bagian yang paling mudah rusak diam-diam: validasi, routing bahasa, auth, dan flow utama. Sisanya dicek manual dengan checklist sebelum launch.

| Level | Tool | Cakupan wajib | Kapan jalan |
| --- | --- | --- | --- |
| Unit | Vitest | Skema Zod project (semua aturan App Flow bagian 6 & 9), `slugify` + penanganan bentrok, `localePath`/`altPath` untuk semua route, aturan `proxy.ts` (matcher, www → non-www, `/en`, guard admin, rewrite locale, header `x-locale`; memakai helper `next/experimental/testing/server`), kesamaan key `en.json` vs `id.json`, `richText` (tag yang diizinkan, tag seimbang, tag asing jadi teks), rate-limit window, builder metadata (canonical + hreflang) | Setiap PR (CI) |
| Integrasi | Vitest + MySQL Docker | Query publik hanya mengembalikan `published=true` dengan urutan benar; create/update/delete project; sesi login/expired/logout | Setiap PR (CI, service MySQL) |
| E2E smoke | Playwright (Chromium + WebKit mobile 375 px) | UF-01, UF-02, UF-04, UF-05, UF-06, UF-07 (upload gambar nyata ke DB uji), UF-09; HeroProofPanel (berganti setelah 6 s, klik 02 pindah slide, pause menghentikan rotasi, `reducedMotion: 'reduce'` tidak berotasi, 0/1 featured sesuai E-21/E-22); axe accessibility scan di S-01 dan S-02 | Sebelum merge fitur besar + sebelum launch |
| Build | `next build` | Build sukses tanpa koneksi DB | Setiap PR (CI) |

### Checklist QA manual sebelum launch

- [ ] Semua acceptance criteria PRD F1–F9 dicentang satu per satu.
- [ ] Semua edge case App Flow E-01 s.d. E-20 dicoba (yang bisa disimulasikan).
- [ ] PageSpeed Insights mobile ≥ 90 dan Core Web Vitals lolos di `/`, `/work`, `/id`, `/id/work`.
- [ ] Lighthouse Accessibility & SEO ≥ 95; navigasi penuh dengan keyboard; screen reader (VoiceOver/TalkBack) membaca hero, kartu, dan dialog dengan benar.
- [ ] Tampilan di HP Android dan iPhone nyata, layar 360–1440 px, tanpa horizontal scroll.
- [ ] Visual dibandingkan dengan `docs/design/homepage-mockup.html` di 375 px dan 1280 px (hero, SectionHeader, ProcessSteps, About, CTA akhir).
- [ ] Motion: animasi scroll jalan di Chrome/Safari, halaman tetap utuh di Firefox; `prefers-reduced-motion` mematikan semua animasi dan rotasi panel; Performance panel DevTools tidak menunjukkan long task atau layout shift dari animasi.
- [ ] Tolak consent → tidak ada cookie `_ga`; terima → event muncul di GA4 DebugView.
- [ ] View source: canonical, hreflang, JSON-LD benar di keempat halaman; Rich Results Test lolos.
- [ ] `robots.txt` dan `sitemap.xml` benar; `/admin` mengirim `noindex`.
- [ ] securityheaders.com minimal grade A.
- [ ] Mailto terbuka dengan subject yang benar di EN dan ID; tombol Copy bekerja.
- [ ] Copy EN dibaca ulang oleh orang yang fasih bahasa Inggris.

## 12. Urutan build

22 task dalam 4 fase, mengikuti roadmap PRD bagian 14. Kerjakan berurutan; satu task = satu sesi coding AI = satu PR kecil. Fase berikutnya baru dimulai setelah gate fase sebelumnya lolos.

### Fase 1 — Fondasi (gate: deploy pipeline jalan)

- [x] **T-01** Init Next.js 16.3 + TypeScript strict + Tailwind v4 + ESLint/Prettier; `engines` Node 24; commit `docs/` (PRD, App Flow, SDD, `design/homepage-mockup.html`) dan `AGENTS.md`.
- [x] **T-02** `styles/globals.css` token + keyframes/motion (bagian 8) + font via `next/font` + komponen `ui/*` dasar (Button, Badge, StatusDot, ArrowIcon) dengan semua state.
- [x] **T-03** Struktur `app/[lang]` + `proxy.ts` (rewrite, 301, guard admin) + `i18n/` (kamus, `localePath`, `altPath`) + unit test routing.
- [x] **T-04** `lib/env.ts` + koneksi Drizzle ke MySQL + skema 3 tabel + migrasi + `scripts/migrate`; Docker MySQL untuk lokal.
- [ ] **T-05** GitHub Actions CI (lint, typecheck, unit, build tanpa DB).
- [x] **T-06** Deploy pertama ke subdomain uji di Hostinger (bagian 10); catat hasil di `docs/DECISIONS.md`, termasuk apakah build bisa menjangkau DB.

### Fase 2 — Halaman publik

- [x] **T-07** Layout publik: Navbar (responsif), Footer (CTA email + Copy), skip link.
- [x] **T-08** S-01 Hero kolom kiri (BylineBadge dengan inisial fallback, H1 dengan `richText`, MetaRow + `site-config`) + tekstur grid + SectionHeader + ServiceTile dua tier + ProcessSteps + About (lead, `<mark>`, AboutFacts) + FooterCta, copy dari kamus.
- [x] **T-09** `getPublishedProjects()` + turunan `selectHomepageProjects()` (featured maks. 3, grid maks. 6 + total) + ProjectCard + Selected work + EmptyState + HeroProofPanel (rotasi, kontrol, E-21 s.d. E-24, pemuatan gambar bertahap); loader Cloudinary (diganti loader `/media` di T-16).
- [x] **T-10** S-02 Work, S-03 Privacy, S-04 not-found per locale.
- [x] **T-11** O-01 toggle (client, tetap `<a href>`; simpan `lang_pref`, bawa `#hash`) + O-02 banner saran bahasa (`lib/lang-pref.ts`) + cookie `lang_pref`; e2e UF-02/UF-04. Event `language_switch` dan koordinasi O-02/O-03 di mobile ditambahkan di T-19.
- [x] **T-12** SEO: `buildMetadata` (canonical, hreflang + x-default, OG/Twitter), JSON-LD (Person + WebSite, CollectionPage + ItemList), `sitemap.ts`, `robots.ts`, gambar OG (`scripts/og-images.mts` → `public/og/{en,id}.png`); hanya `SITE_URL=https://rifaldiradya.com` yang boleh diindeks.

### Fase 3 — Admin

- [x] **T-13** Auth: API-01/02, `requireAdmin`, rate limit (per IP + global), `scripts/hash-password`, S-10; kelompok env `admin` dicek saat start sebagai peringatan (`CHECKED_AT_START`), bukan syarat start; login memvalidasi `next` hanya ke `/admin*`.
- [x] **T-14** S-11 daftar project (tabel ≥ 768 px, kartu di mobile) + layout admin G3, info featured/grid + peringatan E-08, Toast (`?notice=`), error boundary admin.
- [x] **T-15** Skema Zod bersama (`lib/projects/validation.ts`) + API-03/04 + `revalidate.ts`; revalidasi diverifikasi di `next start` (4 halaman berubah di kunjungan pertama setelah simpan).
- [x] **T-16** Penyimpanan gambar di MySQL (tabel `images` + `image_variants`, migrasi 0002), kompresi di browser, API-06/07, route `/media`, loader; ImageUploader (dipasang di form T-17); kelompok env Cloudinary dihapus.
- [x] **T-17** S-12/S-13 ProjectForm lengkap (validasi, dialog discard, `beforeunload`) + API-05 hapus + ConfirmDialog; Toggle, ImageUploader terpasang, varian Button `danger`.
- [x] **T-18b** (tambahan, permintaan Pal) Urutan project dengan tombol ↑/↓ di S-11 (API-08, posisi 1…n tanpa kembar, project baru di #1, field Sort order dihapus dari form) + foto profil hero lewat admin S-14 (API-09, `site_settings`, upload `kind=avatar`); migrasi 0003 menomori ulang urutan lama.
- [x] **T-18** Test integrasi (`npm run test:integration`, juga di CI job `database`) + e2e UF-06, UF-07, UF-09 (`npm run test:e2e`, Playwright di Edge terpasang, desktop + 375 px).

### Fase 4 — Launch (gate: Lighthouse ≥ 90, semua AC lolos)

- [x] **T-19** GA4 + Consent Mode v2 + O-03 + `track()` 4 event + S-03 tombol Cookie settings (gtag.js baru dimuat setelah Accept; event lewat atribut `data-track`; O-02 menunggu O-03 di HP; e2e UF-05 dengan request Google dicegat). Banner consent di mobile maks. ~130 px tingginya: di 375 × 667 tombol hero "See the Work" berakhir di y = 537 px dan harus tetap terlihat saat banner tampil (PRD F1).
- [x] **T-20** Header keamanan + CSP (`lib/security-headers.ts`); e2e merekam pelanggaran CSP (0 di halaman publik, 404, GA setelah Accept, admin + upload). Uji securityheaders.com di devstaging setelah deploy.
- [ ] **T-21** Isi konten nyata lewat admin (2 project), copy final EN/ID; QA checklist bagian 11.
- [ ] **T-22** Pindah ke domain utama, Search Console, submit sitemap, tempel link di profil Upwork.

## 13. Aturan kerja dengan coding AI

Coding AI hanya sebaik konteks dan batas yang diberikan. Tiga dokumen ini masuk ke repo di `docs/`, dan `AGENTS.md` di root jadi pintu masuk yang dibaca AI di setiap sesi.

### Isi `AGENTS.md` (salin ke repo)

```markdown
# AGENTS.md — rifaldiradya.com

## Sumber kebenaran
1. docs/APP_FLOW.md — layar, flow, state, edge case, kontrak API. Paling mengikat.
2. docs/SDD.md — arsitektur, stack, struktur repo, keamanan.
3. docs/PRD.md — alasan produk, copy, visual, tabel Motion.
4. docs/design/homepage-mockup.html — referensi visual saja (tampilan & motion). Kalau berbeda dengan docs, docs yang menang.
Kalau semuanya tidak menjawab: BERHENTI dan tanya. Jangan mengarang.

## Aturan keras
- Next.js 16 App Router, TypeScript strict, Tailwind v4 token dari styles/globals.css.
- Pakai proxy.ts, bukan middleware.ts.
- Tidak ada dependency baru tanpa izin; tidak ada dependency native.
- Tidak ada auto-redirect bahasa; locale hanya dari URL.
- Tidak ada GA4/cookie analytics sebelum consent=granted.
- Tidak ada gambar di filesystem server; gambar project di MySQL (`lib/images`).
- Tidak ada teks UI hardcode; semua dari i18n/en.json dan i18n/id.json.
- Akses DB hanya di lib/projects, lib/images, dan lib/auth.
- Jangan menambah layar, field, fitur, atau library di luar docs.
- Animasi hanya yang ada di tabel Motion PRD; hanya CSS kecuali rotasi HeroProofPanel; tanpa fade-in di H1/subheadline/panel hero.
- String kamus dengan penanda (<hl>, <dim>, <mark>, <strong>) dirender lewat richText(), jangan dangerouslySetInnerHTML.

## Cara kerja per task
1. Baca task (T-xx) dan bagian docs yang dirujuk.
2. Tulis rencana singkat: file yang diubah + acceptance criteria yang dipenuhi.
3. Implementasi kecil dan fokus.
4. Jalankan: npm run lint && npm run typecheck && npm test (+ test:e2e bila relevan).
5. Laporkan: apa yang dibuat, AC mana yang lolos, apa yang belum.
```

### Pola prompt per task

> Kerjakan **T-09** dari docs/SDD.md bagian 12. Rujukan: App Flow S-01 (Selected work), ProjectCard, E-01, E-03, E-05; SDD bagian 3 (loader gambar). Tulis rencana dulu, tunggu persetujuan, lalu implementasi. Jangan ubah file di luar `components/site`, `lib/projects`, `lib/images`, `app/[lang]/page.tsx`.

### Definisi selesai (per task)

- [ ] Acceptance criteria PRD/App Flow terkait terpenuhi dan disebut satu per satu.
- [ ] Lint, typecheck, unit test hijau; build sukses.
- [ ] Dicek di 375 px dan 1280 px; keyboard bisa mengakses semua yang baru.
- [ ] Tidak ada string hardcode, `any` tanpa alasan, atau `console.log` sisa.
- [ ] PR kecil dengan deskripsi jelas; di-review Pal sebelum merge.

### Kebiasaan yang mencegah AI "keluar jalur"

- Satu sesi AI = satu task. Mulai sesi baru untuk task berikutnya supaya konteks bersih.
- Setiap keputusan yang menyimpang dari docs dicatat di `docs/DECISIONS.md` (tanggal, apa, kenapa), lalu docs diperbarui.
- Jangan terima kode yang tidak dipahami; minta AI menjelaskan dulu bagian auth, validasi, dan revalidasi.
- Review diff sebelum commit, terutama file `proxy.ts`, `lib/auth/*`, `next.config.ts`.

Eksekusi kode, testing, dan push ke Git dikerjakan di setup terpisah (vibe-coding-builder), bukan di project perencanaan ini.

## 14. Keputusan terbuka & sumber

Empat hal perlu dijawab atau diuji sebelum/selama Fase 1; sisanya sudah dikunci.

- [ ] Status rifaldiradya.com di hPanel: **WordPress masih aktif, kontennya tidak dibutuhkan** (dikonfirmasi 28 Sep 2026); tetap ikuti alur "Pindah ke domain utama" di bagian 10 (backup dulu sebagai jaring pengaman, lalu lepas). Masih perlu dicek: apakah staging0/staging1 terdaftar sebagai website terpisah.
- [ ] Apakah server build Hostinger bisa menjangkau MySQL saat `next build` (diuji di T-06; desain sudah aman untuk kedua kemungkinan).
- [x] Migrasi di perintah `start`: **tidak bisa diandalkan**, karena Hostinger menjalankan Next.js langsung. Solusi: migrasi di `instrumentation.ts` (bagian 3). Sebelumnya: jalankan manual via phpMyAdmin setiap ada perubahan skema.
- [x] Link sosial di footer: LinkedIn (disimpan di `lib/site-config.ts`, bagian 9).

**Sumber (dibuka 27 Sep 2026)**

- [Next.js 16 release notes — proxy.ts menggantikan middleware.ts](https://nextjs.org/blog/next-16)
- [Next.js blog — rilis 16.3 dan jadwal security release](https://nextjs.org/blog)
- [Hostinger — membuat Node.js app (paket yang didukung, versi Node, domain existing)](https://docs.hostinger.com/node.js/creating-an-app)
- [Hostinger — integrasi GitHub dan build otomatis](https://docs.hostinger.com/node.js/github)
- [Hostinger — database MySQL dan host 127.0.0.1](https://docs.hostinger.com/websites/databases)
- [Hostinger — menghubungkan MySQL ke app Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
