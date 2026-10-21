---
doc: SDD
app: rifaldiradya.com
tier: full
version: 2.0.1
status: current
last_updated: 2026-10-22
last_change: changes/archive/2026-10-18-v2.0.0-showcase-redesign
---

# SDD — rifaldiradya.com v2

Sep 27, 2026 · @Pal

> **v2.0.0 (18 Okt 2026).** Diperbarui: font Archivo (bagian 2), skema project v2 + migrasi `0004` dan avatar 640 (3), komponen v2 (4), rich-text `<em>`/`<s>` dan rendering Selected work (5), mailto + `live_url` https (6), SEO/analytics v2 (7), token dua lapis + tema + motion scroll-driven (8), `site-config` v2 (9), rilis & rollback v2 dengan restore DB (10), testing v2 (11), task T-23..T-33 (12), AGENTS.md (13). Arsitektur, database, auth, dan deploy tidak berubah. Keputusan D-01..D-30 di `docs/decisions/DECISIONS.md`.

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
| Styling | Tailwind CSS v4 + CSS variables | 4.x | Token tema dari PRD bagian 8 jadi CSS variables (dua lapis, bagian 8) |
| Font | `next/font/google` (self-host saat build): Archivo (`subsets: ['latin','latin-ext']`, `display: 'swap'`, `variable: '--font-archivo'`, file variabel normal + italic) | — | woff2, tanpa request runtime ke Google; satu keluarga (D-03) |
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

Tidak dipakai: CMS headless, NextAuth/Auth.js, Prisma, state management library, UI kit berat, library animasi.

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
| `projects` | `id` varchar(26) PK (cuid2/ulid) · `slug` varchar(100) unique · `title_en`, `title_id` varchar(80) · `group` varchar(12) default `'web'` · `meta_en`, `meta_id` varchar(40) null · `side_en`, `side_id` varchar(20) null · `summary_en`, `summary_id` varchar(160) · `show_on_home` boolean default false · `case_is_en`, `case_is_id` varchar(220) null · `case_did_en`, `case_did_id` JSON null · `tags` JSON (array string, maks. 6) · `status_en`, `status_id` varchar(40) null · `case_action` varchar(12) default `'site'` · `live_url` varchar(300) **null** (D-21) · `visual_type` varchar(10) default `'screenshot'` · `thumbnail_public_id` varchar(255) null · `thumbnail_url` varchar(500) null · `thumbnail_width`, `thumbnail_height` int null · `thumbnail_alt_en`, `thumbnail_alt_id` varchar(140) null · `card_number` varchar(12) null · `card_caption_en`, `card_caption_id` varchar(60) null · `sort_order` smallint default 1 (posisi 1…n, unik, dijaga `lib/projects/mutations.ts`) · `featured` boolean (**deprecated v2.0.0, tidak dibaca/ditulis**, D-22) · `published` boolean default false · `created_at`, `updated_at` datetime(3) UTC | Index: (`published`, `sort_order`, `created_at`) dan (`published`, `show_on_home`, `sort_order`). Charset `utf8mb4`, collation `utf8mb4_unicode_ci`. |
| `admin_sessions` | `id` varchar(26) PK · `token_hash` char(64) unique (SHA-256 dari token) · `created_at` · `expires_at` · `last_seen_at` · `user_agent` varchar(255) | Token asli hanya ada di cookie; DB menyimpan hash. Sesi kedaluwarsa dibersihkan saat login. |
| `site_settings` | `key` varchar(50) PK · `value` varchar(255) null · `updated_at` | Pengaturan kecil dari admin (tabel key-value, tanpa migrasi per key): `profile_photo` = id gambar (S-14), `availability_on` = `'1'`/`'0'` (default on bila belum ada). Keduanya disimpan dalam satu transaksi oleh API-09 (`saveProfileSettings()`). |
| `images` / `image_variants` | lihat "Gambar (MySQL)" di bawah | Gambar project (16:10) dan foto profil (1:1). |
| `login_attempts` | `id` bigint PK auto · `ip_hash` char(64) · `success` boolean · `created_at` | Untuk rate limit 5 gagal / 15 menit / IP. Baris > 7 hari dihapus saat login. IP disimpan sebagai hash, bukan mentah. |

Kredensial admin **tidak** disimpan di tabel: `ADMIN_EMAIL` dan `ADMIN_PASSWORD_HASH` di environment variable Hostinger (bagian 9). Ganti password = generate hash baru dengan skrip `npm run hash-password` lalu update env dan restart app.

Migrasi: drizzle-kit menghasilkan file SQL di `/drizzle` (`npm run db:generate`, bekerja tanpa koneksi DB). `0000_init.sql` membuat 3 tabel; `0001_utf8mb4.sql` (migrasi custom) memaksa `utf8mb4_unicode_ci` di ketiga tabel apa pun default server-nya. `npm run db:generate` juga menyalin isi `/drizzle` ke `lib/db/migrations.generated.ts` (`scripts/embed-migrations.mts`; setelah mengedit migrasi custom secara manual jalankan `npm run db:embed`), karena server Hostinger hanya membawa hasil build tanpa folder `/drizzle`. Hash dan urutannya identik dengan `readMigrationFiles()` milik Drizzle (dijaga unit test), dan CI gagal kalau file itu tidak sinkron. Penerapan lewat satu fungsi, `runMigrations()` di `lib/db/migrate.ts`, idempotent dan dilindungi MySQL named lock (`GET_LOCK`) supaya beberapa proses yang start bersamaan tidak saling bentrok:

- **Produksi: otomatis di `instrumentation.ts` setiap server start**, apa pun perintah start yang dipakai host. Hostinger ternyata menjalankan Next.js langsung, bukan `npm start` (terlihat dari runtime log 28 Sep 2026), jadi migrasi di perintah start tidak pernah jalan. Jika DB tidak terjangkau (`ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `EHOSTUNREACH`) atau migrasi gagal, error dicatat di runtime log (`[migrate] …`) dan server tetap melayani halaman statis (NFR Ketersediaan); migrasi dicoba lagi pada start berikutnya. `SKIP_MIGRATIONS=1` menonaktifkannya (darurat saja).
- `npm run db:migrate` (`scripts/migrate.mts --strict`, dijalankan `node` langsung; Node 24 membuang tipe TypeScript) untuk CI, development lokal, dan manual: kegagalan apa pun → exit 1.
- CI menguji dua proses migrasi paralel pada database kosong, lalu memastikan riwayat migrasi tercatat tepat sekali per file.
- Cadangan terakhir: jalankan SQL di `/drizzle` manual lewat phpMyAdmin (lalu isi `__drizzle_migrations` sesuai), hanya jika semua cara di atas gagal.

**Migrasi `0004_v2_showcase.sql` (v2.0.0):** satu `ALTER TABLE projects` yang menambah kolom v2 dan membuat `live_url` NULL-able (satu-satunya pengecualian aturan "migrasi hanya menambah", D-21), index `projects_home_order_idx`, dan nilai awal `UPDATE projects SET show_on_home = featured WHERE published = 1` (Pal merapikan di admin). Diuji di CI pada dump v1 dan dijalankan dua kali (idempotent, AC-14).

Seed tidak ada; project pertama diisi lewat admin.

### Gambar (MySQL)

- **Kompresi di browser admin** (`lib/images/compress.ts`): file JPG/PNG/WebP ≤ 5 MB, lebar ≥ 1200 px → crop 16:10 (gambar tinggi dipotong dari atas, gambar lebar dari tengah) → lebar standar di bawah hasil crop (640/960/1280) + hasil crop itu sendiri (maks. 1600) → WebP kualitas 0,8 (JPEG 0,82 jika browser tidak bisa encode WebP). Menggambar ulang lewat canvas juga membuang EXIF/GPS.
- **Upload (API-06)**: multipart dengan satu bagian `variant` per lebar. Server tidak mempercayai apa pun dari client: format dan ukuran dibaca dari byte file (`lib/images/inspect.ts`, hanya WebP/JPEG), set lebar harus persis hasil kompresi, bentuk 16:10, tiap varian ≤ 1 MB, terbesar ≥ 1200 px. Disimpan di `images` (1 baris per upload) + `image_variants` (1 baris per lebar, `MEDIUMBLOB`) dalam satu transaksi.
- **Avatar (S-14)**: persegi, minimal 640 × 640, varian 320 dan 640 (v1: 160/320). Avatar 320 lama tetap disajikan dengan srcset hanya berisi lebar yang benar-benar ada (E-32).
- **Delivery**: `/media/<id>.<ext>` (terbesar) dan `/media/<id>-<lebar>.<ext>`; loader `next/image` memilih lebar tersimpan terkecil yang cukup. Gambar tidak pernah berubah (thumbnail baru = id baru), jadi `Cache-Control: public, max-age=31536000, immutable`.
- **Project hanya memilih `public_id`**: API-03/04 mengambil url, lebar, dan tinggi dari tabel `images`, bukan dari request.
- **Hapus**: thumbnail lama dihapus setelah project tersimpan dengan gambar baru; API-05 (T-17) menghapus gambar project. Hapus dan simpan saling mengunci baris gambar (`for update` / `for share`), jadi gambar yang sedang dipilih oleh save project/profil tidak bisa terhapus di tengah jalan; kalau sudah terhapus duluan, save menjawab "image no longer available". Upload yang tidak pernah tersimpan dihapus lewat API-07 (Remove/Replace/Cancel) atau otomatis setelah 24 jam (dibersihkan saat upload berikutnya). Gagal hapus tidak membatalkan operasi utama, hanya dicatat di log. Salinan di cache CDN bisa bertahan, tapi tidak lagi ditautkan dari mana pun.

## 4. Struktur repo & konvensi kode

Repo GitHub private `rifaldiradya-portfolio`, satu branch produksi `main`. Struktur di bawah wajib diikuti; file baru di luar pola ini perlu alasan.

```text
/
├─ app/
│  ├─ [lang]/                  # root layout publik (G2); lang = en | id
│  │  ├─ layout.tsx            # <html lang={lang} data-theme>, ThemeScript, ScrollProgress, overlay
│  │  ├─ page.tsx              # S-01
│  │  ├─ work/page.tsx         # S-02
│  │  └─ privacy/page.tsx      # S-03
│  ├─ global-not-found.tsx     # S-04 untuk semua path tak dikenal; locale dari header x-locale (proxy)
│  ├─ admin/                   # root layout admin (G3), terpisah
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx        # S-10 (di luar grup, tanpa sesi)
│  │  └─ (panel)/              # route group: layout.tsx = requireAdmin() + header G3
│  │     ├─ page.tsx           # S-11 (/admin)
│  │     ├─ profile/page.tsx   # S-14 (foto profil + availability)
│  │     └─ projects/
│  │        ├─ new/page.tsx    # S-12
│  │        └─ [id]/page.tsx   # S-13
│  ├─ api/admin/               # API-01..09 (route handlers)
│  ├─ sitemap.ts
│  └─ robots.ts
├─ components/
│  ├─ site/                    # SiteBar, ThemeScript, ThemeToggle (client), ScrollProgress, ChapterDepth,
│  │                           # Hero, SelectedWork, AboutChapter, HighlightChapter, ContactChapter,
│  │                           # MailtoLink, CopyEmailButton (client), CvLink, LocalClock (client),
│  │                           # WorkFilter (client), CaseRow, EmptyState, Footer, ...
│  ├─ overlays/                # LanguageToggle, LanguageSuggestBanner, CookieConsent
│  ├─ admin/                   # LoginForm, ProjectList, ProjectForm (per bagian), LinesInput, StackInput,
│  │                           # SegmentedControl, CaseActionField, VisualField, ImageUploader, ProfileForm, ConfirmDialog
│  └─ ui/                      # Button, Toggle, Toast, Container, ArrowIcon (primitif)
├─ i18n/
│  ├─ en.json
│  ├─ id.json
│  ├─ index.ts                 # getDictionary(lang), localePath(path, lang), altPath(), interpolate()
│  ├─ server.ts                # resolveLocale(params) untuk page/layout (notFound jika bukan en/id)
│  └─ rich.tsx                 # richText(str): <em>/<s>/<strong> → elemen React
├─ lib/
│  ├─ db/ (client.ts, schema.ts)
│  ├─ projects/ (queries.ts, mutations.ts, validation.ts, slug.ts, public.ts, admin.ts, errors.ts)
│  ├─ auth/ (session.ts, password.ts, rate-limit.ts, guard.ts)
│  ├─ images/ (rules.ts, compress.ts, inspect.ts, upload.ts, store.ts, loader.ts)
│  ├─ seo/ (metadata.ts, jsonld.ts)
│  ├─ analytics/ (events.ts)
│  ├─ mailto.ts                # mailtoHref(dict, kind, title): 4 jenis mailto, subject/body ter-encode
│  ├─ theme.ts                 # resolveTheme (D-23), skrip inline, applyTheme
│  ├─ revalidate.ts
│  ├─ locale-header.ts         # nama header x-locale (dipakai proxy.ts dan global-not-found)
│  ├─ cn.ts, fonts.ts          # helper class + next/font
│  └─ site-config.ts           # konfigurasi non-secret (bagian 9)
├─ styles/globals.css          # tokens (CSS variables) + Tailwind + keyframes & motion
├─ drizzle/                    # file migrasi SQL
├─ public/cv/rifaldi-radya-pratama-cv.pdf   # CV web statis tanpa nomor HP (D-14)
├─ scripts/ (hash-password.mts, migrate.mts, embed-migrations.mts, og-images.mts, icons.mts, check-deploy.mts)
├─ instrumentation.ts          # validasi semua env saat server produksi start
├─ drizzle.config.ts, docker-compose.yml
├─ tests/ (unit/, integration/, e2e/)  # Vitest (vitest.config.ts, vitest.integration.config.ts), Playwright
├─ docs/ (specs/, changes/, decisions/, design/v2/, CHANGELOG.md)
├─ proxy.ts                    # Next.js 16 (pengganti middleware): rewrite locale, 301, guard /admin, header x-locale
├─ AGENTS.md                   # aturan untuk coding AI (bagian 13)
├─ .env.example
└─ package.json
```

**Konvensi**

- TypeScript strict; tanpa `any` kecuali dengan komentar alasan.
- Server Components default; `"use client"` hanya untuk komponen interaktif: overlay, toggle tema, filter + hash Work, Copy email, jam GMT+7, form admin. Semua motion murni CSS, tanpa komponen client. Komponen v1 yang digantikan dihapus, bukan dibiarkan sebagai kode mati.
- Akses database hanya di `lib/projects/*`, `lib/images/*`, dan `lib/auth/*`; komponen tidak pernah import `lib/db` langsung.
- Semua string UI lewat `getDictionary(locale)`; tidak ada teks hardcode di komponen publik.
- Nama file komponen PascalCase, util camelCase/kebab-case sesuai contoh di atas.
- Commit message: Conventional Commits (`feat:`, `fix:`, `chore:`), satu fitur/fix per commit.

## 5. Routing, i18n, rendering & revalidasi

URL publik tetap seperti App Flow (`/`, `/work`, `/id`, `/id/work`), tapi di dalam app semua halaman publik hidup di `app/[lang]`. `proxy.ts` (pengganti `middleware.ts` di Next.js 16, berjalan di runtime Node.js) menjembatani keduanya ([Next.js 16](https://nextjs.org/blog/next-16)).

### proxy.ts — aturan lengkap (urut)

Matcher: semua path kecuali `/_next/static` dan `/_next/image`.

1. Host `www.rifaldiradya.com` → 301 ke `https://rifaldiradya.com` dengan path dan query yang sama. Berlaku untuk semua path yang lewat matcher, termasuk file statis dan `/api/*`. (Hostinger juga sudah me-redirect www di level server; aturan ini jaring pengaman.)
2. Lewati `/api/*` dan file statis (path berakhiran ekstensi: `favicon.ico`, `robots.txt`, `sitemap.xml`, `*.png`, `/cv/*.pdf`, dll.).
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
- `richText(str)` di `i18n/rich.tsx` mengubah penanda di string kamus menjadi elemen React tanpa `dangerouslySetInnerHTML`: `<em>` → `<em class="ac">` (kata aksen miring), `<s>` → `<s>`, `<strong>` → `<strong>`. Parser sederhana (tanpa nesting); tag lain (termasuk `<hl>`, `<dim>`, `<mark>` v1) dirender sebagai teks biasa. Test unit memastikan setiap key yang dipakai `richText` hanya berisi tag yang diizinkan dan tag-nya seimbang di `en.json` maupun `id.json`.
- `interpolate(template, values)` mengisi `{key}`; sub halaman Work disusun `workSub()` dari jumlah per grup (D-30).
- `localePath('/work', 'id')` → `/id/work`; `localePath('/work', 'en')` → `/work`. Semua link internal wajib lewat helper ini.
- `altPath(currentPath)` menghasilkan path padanan untuk O-01, hreflang, dan O-02.
- `app/[lang]/layout.tsx`: `generateStaticParams` → `[{lang:'en'},{lang:'id'}]`; lang selain `en`/`id` → 404 lewat `resolveLocale()` → `notFound()`. **Jangan** pakai `dynamicParams = false`: bersama revalidasi on-demand, semua halaman publik jadi 404 (lihat DECISIONS T-15).

### Rendering & cache

| Route | Mode | Detail |
| --- | --- | --- |
| `/[lang]`, `/[lang]/work` | Statis (ISR) | Homepage memanggil `getPublishedProjects()` dan `getSiteSettings()` (foto, availability) sekali, lalu menurunkan Selected work (`show_on_home`, maks. 5) di memori; Work memakai daftar penuh. `export const revalidate = 300` sebagai jaring pengaman + revalidasi on-demand saat admin menyimpan (API-03/04/05/08/09) |
| `/[lang]/privacy`, not-found | Statis penuh | Tanpa data |
| `sitemap.ts`, `robots.ts` | Statis (ISR 300 s) | `lastmod` dari `max(updated_at)` |
| `/admin/*` | Dinamis | Selalu baca sesi dan data terbaru; tidak pernah di-cache |
| `/api/admin/*` | Dinamis | Route handlers, Node.js runtime |

- Setelah API-03/04/05/08/09 sukses: `revalidatePath('/[lang]', 'layout')` (mencakup 4 halaman publik) + `revalidatePath('/sitemap.xml')`. Hasil dibungkus try/catch → field `revalidated` di respons (E-19).
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
| XSS | React escaping; tidak ada `dangerouslySetInnerHTML` kecuali JSON-LD yang dibentuk dari objek (di-`JSON.stringify` + escape `<`) dan skrip tema inline yang dibentuk dari kode sendiri; input admin disimpan sebagai teks biasa; mailto dibangun dengan `encodeURIComponent` untuk subject/body (judul proyek di subject walkthrough ikut di-encode) |
| Upload berbahaya | Client: tipe JPG/PNG/WebP, maks 5 MB, lebar ≥ 1200 px, digambar ulang lewat canvas. Server: format + dimensi dari magic bytes (hanya WebP/JPEG; SVG/HTML/PNG ditolak), set lebar dan rasio 16:10 wajib cocok, maks 1 MB per varian; nama file dan MIME dari client diabaikan; disajikan dengan `Content-Type` dari DB + `X-Content-Type-Options: nosniff` |
| URL berbahaya | `live_url` divalidasi `https:` di server dan hanya dirender (termasuk JSON-LD) bila `https:` dan tombol case = `site`; dirender dengan `rel="noopener noreferrer"` |
| Brute force | Rate limit login + bcrypt cost 12. Percobaan dicatat sebagai gagal *sebelum* cek password, jadi request paralel ikut terhitung; percobaan yang ditolak 429 tidak dihitung (DECISIONS 2026-10-22) |
| Body request besar | Body JSON API admin, termasuk login, maks 32 KB (`readJsonBody`, dihitung saat dibaca, jadi body chunked tanpa `Content-Length` ikut terpotong); lebih besar diperlakukan seperti body rusak (`400`/`422`) |
| Kebocoran secret | Semua secret di env Hostinger; `.env*` di `.gitignore`; `.env.example` tanpa nilai; tidak ada secret dengan prefix `NEXT_PUBLIC_` |
| Clickjacking & header | `lib/security-headers.ts` lewat `next.config.ts` `headers()` di semua respons: `Content-Security-Policy` (default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com, + 'unsafe-eval' hanya di dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: + host GA; font-src 'self'; connect-src 'self' + host GA; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera, mikrofon, lokasi, pembayaran, USB, topics dimatikan), `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` (produksi) |
| Dependency rentan | Aktifkan scan kerentanan otomatis Hostinger + Dependabot di GitHub; ikuti security release Next.js |
| Enumerasi admin | Pesan login generik; `/admin/*` noindex + disallow di robots |

CSP tetap untuk v2 (font self-host, tanpa host baru; skrip tema inline tercakup `'unsafe-inline'`). CSP sengaja tanpa nonce: nonce per request memaksa semua halaman dirender dinamis, bertentangan dengan target performa statis. Risiko `'unsafe-inline'` rendah karena situs tidak menampilkan HTML buatan pengguna. CSP diuji di Fase 4; jika memblokir sesuatu, perbaiki allowlist, jangan matikan CSP.

## 7. SEO, analytics & consent

### SEO (implementasi PRD bagian 9)

- `lib/seo/metadata.ts` → `buildMetadata({ lang, path, page, dict })` (meta v2 di kamus `seo.*`, PRD bagian 9) dipakai setiap `generateMetadata`. Menghasilkan: `title`, `description`, `alternates.canonical` (URL absolut halaman itu sendiri), `alternates.languages` (`en`, `id`, `x-default` → EN), `openGraph` (title, description, url, `locale` en\_US/id\_ID, `alternateLocale`, gambar OG per bahasa 1200 × 630 di `/public/og/`), `twitter` (summary\_large\_image).
- `metadataBase = new URL(SITE_URL)`; `SITE_URL` = `https://rifaldiradya.com` (non-www kanonik, disetujui 28 Sep 2026). Redirect www → non-www ditangani aturan 1 `proxy.ts` (bagian 5); DNS tetap perlu record `www` yang mengarah ke app yang sama supaya request www sampai ke proxy. Semua canonical, hreflang, sitemap, OG `url`, dan JSON-LD memakai versi non-www.
- `lib/seo/jsonld.ts` → `homeJsonLd(lang, origin)` (Person: `jobTitle` Software Engineer, `worksFor`, `knowsAbout`, `sameAs` LinkedIn + GitHub bila terisi; WebSite) dan `workJsonLd(...)` (CollectionPage + ItemList; proyek tanpa `live_url` memakai URL case `…/work#case-<slug>`); dirender sebagai `<script type="application/ld+json">` di Server Component (bukan ditambahkan via JS client), supaya terlihat di HTML awal.
- `app/sitemap.ts`: 6 URL (home, work, privacy × 2 bahasa), masing-masing dengan `alternates.languages`, `lastModified`.
- `app/robots.ts`: allow `/`, disallow `/admin` dan `/api`, `sitemap: SITE_URL/sitemap.xml`. Tidak ada blok khusus crawler AI (diizinkan). **Hanya jika `SITE_URL` = `https://rifaldiradya.com`**; deployment lain (devstaging, lokal) mendapat `Disallow: /` dan semua halaman `noindex` (`isIndexable()` di `lib/seo/metadata.ts`).
- Halaman statis, sitemap, dan robots memakai `SITE_URL` **saat build** (lalu diperbarui oleh revalidasi ≤ 5 menit). Karena itu langkah Fase 4 "ubah `SITE_URL`, lalu redeploy" wajib: redeploy membangun ulang dengan domain utama.
- Admin: `metadata.robots = { index: false, follow: false }` + header dari proxy.
- Gambar OG dibuat ulang dengan `scripts/og-images.mts` memakai token v2 (tema gelap) dan Archivo → `public/og/{en,id}.png`.
- Gambar: `next/image` + loader `/media`. Tidak ada gambar prioritas di S-01 dan S-02 (tidak ada thumbnail di atas fold; LCP = teks H1); screenshot di Selected work `loading="lazy"`, `sizes="(min-width: 768px) 55vw, 100vw"`.

### Analytics & consent (implementasi F8)

- Komponen `<Analytics />` (client) di layout publik dan 404 (tidak di admin). **Mode dasar (DECISIONS T-19):** `gtag.js` baru diminta setelah `consent=granted`, baik saat halaman dibuka dengan cookie itu maupun tepat setelah Accept. Urutannya: `gtag('consent','default', semua denied)` → `gtag('consent','update',{ analytics_storage:'granted' })` → `gtag('config', ID)` (mengirim `page_view` halaman saat ini) → skrip `gtag/js?id=…` disisipkan. Tanpa consent tidak ada skrip, cookie, maupun ping tanpa cookie ke Google. Iklan tidak dipakai, jadi semua `ad_*` tetap denied selamanya.
- Navigasi client (Link) dihitung oleh GA4 Enhanced measurement "Page changes based on browser history events" (biarkan aktif di pengaturan stream).
- `<CookieConsent />` (client): baca/tulis cookie `consent` (180 hari, `sameSite=lax`, `secure`), panggil `gtag('consent','update', ...)`. Reject setelah sebelumnya granted → hapus cookie `_ga`, `_ga_<ID>` di domain `.rifaldiradya.com` dan path `/`.
- `lib/analytics/events.ts` → `track(name, params)` dengan tipe ketat untuk event App Flow bagian 11 (`contact_email_click` dengan `kind`, `cv_download`, `case_open`, `project_link_click` placement `home`|`case`, `theme_switch`, `language_switch`); fungsi tidak melakukan apa-apa jika ID kosong, `window.gtag` tidak ada, atau consent bukan granted. Tautan yang dirender server menandai event lewat atribut (`data-track`, `data-kind`, `data-location`, `data-method`, `data-slug`, `data-placement`, `data-source`) dan satu listener klik di `<Analytics />` mengubahnya jadi `track()`, jadi tautan tetap Server Component. `language_switch` dipanggil langsung oleh O-01/O-02, `theme_switch` oleh O-04. Klik judul di home meninggalkan penanda sekali pakai `sessionStorage` `rr-case-from-home` supaya halaman Work tidak menghitungnya lagi sebagai `source: hash`.
- Di GA4: tandai `contact_email_click` dan `cv_download` sebagai key event; aktifkan data retention 14 bulan; tidak perlu Google Signals.
- Search Console: verifikasi via DNS TXT di hPanel; submit sitemap setelah launch.

Consent Mode v2 dan kewajiban banner untuk pengunjung EEA/UK mengikuti panduan resmi Google; teks banner dan halaman privacy ditulis sederhana dan jujur, bukan template hukum. Ini bukan nasihat hukum.

## 8. Design system di kode

Token PRD bagian 8 menjadi satu sumber di `styles/globals.css`; komponen hanya boleh memakai token, tidak boleh nilai warna mentah. Dua lapis:

1. **Token tema** di `:root, :root[data-theme="dark"]` dan `:root[data-theme="light"]` (plus `@media (prefers-color-scheme: light) :root:not([data-theme])` untuk tanpa JS, E-07), nilai persis PRD bagian 8: `--bg`, `--ink`, `--soft`, `--faint`, `--accent`, `--accent-ink`, `--calm`, `--k`, `--dot`, `--avatar-ring`, dan khusus admin `--panel`, `--field`, `--ok`, `--warn`, `--danger`.
2. **Pemetaan `@theme` Tailwind:** `--color-bg: var(--bg)`, `--color-text: var(--ink)`, `--color-text-muted: var(--soft)`, `--color-border: var(--faint)`, `--color-accent: var(--accent)`, `--color-on-accent: var(--accent-ink)`, `--color-success`/`--color-danger` khusus admin; `--font-sans: var(--font-archivo)`.

- Ukuran, spasi, radius, dan easing mengikuti mockup: `--gutter: clamp(20px, 2.8vw, 40px)`, `--ease: cubic-bezier(0.23, 1, 0.32, 1)`, `--win: 100svh`.
- Token v1 (`--color-accent-soft`, `--font-display`, `--shadow-card*`, `--slide-ms`, `--ease-pulse`, highlighter) dihapus; test `tokens.test.ts` menjaga grep tetap bersih.
- Focus ring: 2 px `--accent`, offset 2 px, kedua tema.
- `--calm` hanya warna cahaya, `--faint` hanya garis dekoratif; keduanya tidak pernah untuk teks. Input admin punya batas ≥ 3:1 (`--soft`).
- Kontras dicek otomatis (axe di Playwright, kedua tema) dan saat token berubah.
- Komponen `ui/*` punya state lengkap: default, hover, focus-visible, active, disabled, loading.

### Motion di kode

Semua motion mengikuti D-08 dan D-10. Keyframes dan aturan motion tinggal di `styles/globals.css` (bukan per komponen) supaya mudah diaudit.

- Semua motion scroll dibungkus `@supports (animation-timeline: view())` + `@media (prefers-reduced-motion: no-preference)`: parallax lapisan per bab (`ChapterDepth`: titik + cahaya per `data-zone`), blur/fade fokus per bab, statement About terisi per baris, coret + hitung angka Highlight (`@property` integer counter), progress bar `scroll(root)`, langkah Selected work dipin (rentang per langkah dari `selectedWorkRanges()`), hover garis aksen judul.
- Scroll snap `y proximity` di `html`, mati saat reduced motion.
- H1: animasi `transform: translateY` 900 ms `--ease`, **tanpa opacity** (D-10).
- Transisi tema 300 ms pada `background-color`/`color`.
- Tanpa dukungan (Firefox saat ini) atau reduced motion: semua bab tampil statis dalam keadaan akhir (E-30); tidak ada fallback JavaScript/IntersectionObserver.
- **Larangan**: listener `scroll`, library animasi, rotasi/timer JS, fade-in pada H1/sub, JS pointer (v2.1.0).

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
- Konfigurasi non-secret di `lib/site-config.ts` (di-commit, bukan env): `role: 'Software Engineer'`, `employer`, `knowsAbout` (JSON-LD), `contactEmail: 'hello@rifaldiradya.com'`, `cvPath: '/cv/rifaldi-radya-pratama-cv.pdf'`, `timezoneLabel: 'GMT+7'` + `timezone: 'Asia/Jakarta'` (jam Contact), `stack` (baris Stack hero), `social: { linkedin: 'https://www.linkedin.com/in/rifaldiradya', github: '' }` (GitHub kosong = tidak dirender, D-19). Flag v1 `availableForWork` dihapus, diganti `availability_on` di admin (D-16). Mengubahnya = commit + deploy. Tidak ada env baru di v2.
- `next.config.ts`: `images.loader: 'custom'`, `images.loaderFile: './lib/images/loader.ts'`, `deviceSizes` = lebar tersimpan, `headers()` keamanan (bagian 6), `poweredByHeader: false`, `reactStrictMode: true`.
- `package.json` (`"type": "module"`) scripts: `dev`, `build`, `start` (`next start`; migrasi berjalan otomatis di `instrumentation.ts`; Next.js membaca `PORT` dari env Hostinger), `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `hash-password`.

## 10. Deploy ke Hostinger via GitHub

Alurnya: kode di GitHub → Hostinger menarik repo → install, build, start otomatis setiap push ke `main` ([Hostinger GitHub integration](https://docs.hostinger.com/node.js/github)). Deploy pertama dilakukan di subdomain uji dulu, domain utama baru dipindah setelah semuanya hijau.

### Persiapan sekali saja

- [x] **Cek domain utama di hPanel → Websites.** Jika rifaldiradya.com masih terpasang sebagai website (mis. WordPress), jangan dihapus dulu. Backup file + database WordPress lewat hPanel, dan pastikan subdomain `staging0`/`staging1` terdaftar sebagai website terpisah yang tidak ikut terhapus.
- [x] Buat repo GitHub private, push skeleton Next.js yang sudah bisa `npm run build` di lokal.
- [x] hPanel → Databases: buat database MySQL + user khusus app; catat nama, user, password.
- [x] Buat property GA4, catat Measurement ID.
- [x] Generate `ADMIN_PASSWORD_HASH` di lokal.

### Deploy pertama (Fase 1, di subdomain uji)

1. hPanel → Websites → Add Website → Node.js web app → Import Git repository → Connect with GitHub → pilih repo, branch `main`.
2. Periksa setting yang dideteksi otomatis: framework Next.js, Node 24, build `npm run build`, start `npm run start`, root directory `/`.
3. Pakai subdomain uji: **`devstaging.rifaldiradya.com`** (dipilih 28 Sep 2026), dengan `SITE_URL=https://devstaging.rifaldiradya.com`.
4. Isi environment variable kelompok yang sudah wajib (`REQUIRED_AT_START`, bagian 9), lalu Deploy. Output directory `.next`, package manager npm.
5. Pantau build log. Jika gagal: cek versi Node, script `package.json`, dan dependency native (App Flow melarang yang native). `TurbopackInternalError … node process exited` = build berjalan dengan Turbopack; pastikan script `build` masih `next build --webpack`.
6. Verifikasi (bertahap sesuai fitur yang sudah ada): halaman publik tampil, migrasi membuat tabel; `/admin/login` bisa login (T-13), upload gambar + tampil dari `/media` (T-16), revalidasi bekerja (T-15).

### Pindah ke domain utama (Fase 4)

Dijalankan 30 Sep 2026 (DECISIONS T-22):

1. Kosongkan website lama di rifaldiradya.com (WordPress, kontennya tidak dibutuhkan) setelah versi uji lolos QA. Jangan pakai dialog "Connect domain" yang menawarkan reset email; website Node.js baru di domain yang sama tetap mendapat email gratis, dan record MX tidak berubah.
2. hPanel → Databases: buat database + user baru untuk produksi. Di Hostinger setiap database berpasangan dengan user-nya sendiri, jadi `DATABASE_NAME` dan `DATABASE_USER` harus pasangan yang sama persis (salah nama database = login 500 dan `/media` 503, log runtime: `Access denied … to database`). Salin isi database devstaging lewat phpMyAdmin (Export → Import).
3. Add Website → Node.js web app di rifaldiradya.com, branch `main`, env produksi: `SITE_URL=https://rifaldiradya.com`, `DATABASE_HOST=127.0.0.1`, database baru, GA4 diisi. Pastikan SSL aktif untuk `rifaldiradya.com` dan `www`.
4. Website devstaging lama pindah ke branch `staging`, tetap memakai database lamanya; kosongkan GA4 lalu redeploy.
5. Periksa otomatis dari luar: `node scripts/check-deploy.mts https://rifaldiradya.com --production` (24 pemeriksaan) dan tanpa `--production` untuk devstaging (23). Cek juga: login dengan kredensial salah → 401 (bukan 500/403), `/media/<id-tidak-ada>.webp` → 404 (bukan 503), record MX/SPF/DKIM/DMARC sama seperti sebelum pindah.

### Dua lingkungan setelah launch (keputusan Pal, T-22)

| | Produksi | Staging |
| --- | --- | --- |
| Domain | `rifaldiradya.com` (+ `www` → 301) | `devstaging.rifaldiradya.com` |
| Website Hostinger | Website Node.js baru di domain utama | Website Node.js yang dipakai sejak Fase 1 |
| Branch deploy | `main` | `staging` |
| Database | Database baru, salinan sekali dari devstaging (export/import phpMyAdmin) | Database lama devstaging |
| `SITE_URL` | `https://rifaldiradya.com` (terindeks) | `https://devstaging.rifaldiradya.com` (noindex otomatis) |
| GA4 | ID diisi | Kosong (tanpa banner, tidak mengotori data) |

Kedua lingkungan **tidak boleh** memakai database yang sama: admin staging akan mengubah konten situs asli, dan migrasi dari branch staging akan berjalan di data asli.

### Alur kerja sehari-hari

- **Semua perubahan lewat `staging` dulu** (DECISIONS 2026-10-13), termasuk perbaikan kecil: branch (`fix/...`, `feat/...`, `docs/...`) → PR ke `staging` → CI hijau → merge → cek di devstaging → PR `staging` → `main` → CI hijau → merge → produksi deploy otomatis.
- CI berjalan di PR dan push ke `main` maupun `staging`.
- Jangan push langsung ke `main`; `main` hanya menerima PR dari `staging`. Pengecualian hanya untuk hotfix darurat saat produksi rusak, lalu segera merge `main` → `staging`.
- Migrasi database: generate di lokal, commit file SQL, dijalankan otomatis saat start. Backup database di hPanel sebelum merge perubahan skema.

### Versi & rilis (DECISIONS 2026-10-02)

- Versi memakai SemVer dan ditandai dengan **tag git** di `main` (`v1.0.0` = rilis pertama, 2 Okt 2026) plus GitHub Release berisi ringkasan dan hasil QA. Tidak ada branch versi permanen (`v1`, `v2`); kode versi lama dibuka lewat tag-nya.
- Mulai rilis berikutnya, `version` di `package.json` dinaikkan di PR rilis supaya sama dengan tag (saat `v1.0.0` dibuat nilainya masih `0.1.0`).
- Versi mayor (redesign, mis. v2): `main` tetap versi yang live; v2 dirakit di `staging` (branch `feat/v2-...` → PR ke `staging`, dilihat di devstaging). Selama versi mayor dirakit di `staging`, perbaikan untuk versi live dibuat dari `main` (`fix/...`) lalu PR ke `staging` dan dicek di devstaging lebih dulu; kalau `staging` sedang berisi pekerjaan versi mayor yang belum siap rilis, perbaikan itu dibawa ke `main` dengan PR terpisah dari branch yang sama setelah lolos cek di devstaging.
- Rilis: PR `staging` → `main` → CI hijau → merge → tag `vX.Y.Z` + GitHub Release → cek `node scripts/check-deploy.mts https://rifaldiradya.com --production`.
- Rollback rilis mayor: revert merge commit rilis di `main`; untuk v2.0.0 **wajib juga restore backup database pra-rilis** (kode v1 tidak menangani `live_url` null atau proyek tanpa thumbnail). Darurat: buat branch `release/v1` dari tag `v1.0.0` dan arahkan sementara branch deploy produksi di hPanel ke branch itu.
- **Rilis v2.0.0:** semua kerja di `feat/v2-<task>` → PR ke `staging`. Sebelum PR rilis `staging` → `main`: backup database produksi di hPanel (wajib, D-21). Migrasi `0004` jalan otomatis saat start. Tag `v2.0.0` + GitHub Release; `package.json` `version` 2.0.0; `check-deploy.mts` memeriksa halaman v2, `/cv/…pdf` 200, dan meta baru. Konten final diisi di admin produksi setelah deploy (D-29).

### Rollback

- Kode: `git revert` commit bermasalah → push ke `main` → deploy ulang otomatis.
- Data: restore backup database di hPanel.
- Migrasi hanya boleh menambah (kolom/tabel baru), tidak menghapus, supaya rollback kode tetap kompatibel dengan skema. Satu-satunya pengecualian: `live_url` nullable di `0004` (D-21) → rollback v2 = revert **dan** restore backup DB.

## 11. Testing & QA

Test otomatis fokus pada bagian yang paling mudah rusak diam-diam: validasi, routing bahasa, auth, dan flow utama. Sisanya dicek manual dengan checklist sebelum launch.

| Level | Tool | Cakupan wajib | Kapan jalan |
| --- | --- | --- | --- |
| Unit | Vitest | Skema Zod project v2 (setiap aturan kondisional: site ↔ live_url, screenshot ↔ thumbnail+alt, number ↔ number+caption, batas `case_did`, maks. 6 stack), batas 5 `show_on_home`, builder mailto (4 jenis × 2 bahasa, encoding), `workSub`, paste multi-baris What I did, `slugify` + bentrok, `localePath`/`altPath`, aturan `proxy.ts`, kesamaan key `en.json` vs `id.json`, `richText` (tag `<em>`/`<s>`/`<strong>`, tag lama jadi teks), urutan penentuan tema, rate-limit window, builder metadata | Setiap PR (CI) |
| Integrasi | Vitest + MySQL Docker | Migrasi `0004` pada dump v1 (baris lama valid, default terisi, idempotent); query publik hanya `published=true` dengan urutan benar; API-03/04 aturan kondisional + E-26; API-09 availability + simpan atomik; sesi login/expired/logout | Setiap PR (CI, service MySQL) |
| E2E | Playwright (Edge desktop 1280 + mobile 375) | UF-01 v2, UF-02, UF-04, UF-05 (event v2, request Google dicegat), UF-06, UF-07/UF-08 v2 (termasuk paste multi-baris), UF-09; filter + hash Work; tema tanpa flash (frame pertama) di kedua tema; tanpa JS (E-07); reduced motion + tanpa scroll-driven (E-30); axe di kedua tema | Setiap PR fitur + sebelum rilis |
| Build | `next build` | Build sukses tanpa koneksi DB | Setiap PR (CI) |

### Checklist QA manual sebelum launch (v1)

- [x] Semua acceptance criteria PRD F1–F9 dicentang satu per satu (per task lewat Definition of Done, bagian 12, dan tes otomatis: unit 271, integrasi 18, E2E 40).
- [x] Semua edge case App Flow E-01 s.d. E-20 dicoba (yang bisa disimulasikan), per task + E2E.
- [x] PageSpeed Insights mobile ≥ 90 dan Core Web Vitals lolos di `/`, `/work`, `/id`, `/id/work`. Produksi 30 Sep 2026: `/` 99/100/100/100 (LCP 1,2 s, CLS 0), `/work` 100/100/100/100 (LCP 1,1 s); `/id` dan `/id/work` memakai template yang sama (lolos di devstaging, T-21). Belum ada data lapangan CrUX (situs baru).
- [x] Lighthouse Accessibility & SEO ≥ 95 (100/100 di produksi); navigasi penuh dengan keyboard (E2E); screen reader dicek Pal.
- [x] Tampilan di HP nyata (dicek Pal), layar 360–1440 px tanpa horizontal scroll (T-21).
- [x] Visual dibandingkan dengan `docs/design/homepage-mockup.html` di 375 px dan 1280 px (hero, SectionHeader, ProcessSteps, About, CTA akhir).
- [x] Motion: animasi scroll jalan di Chrome/Safari, halaman tetap utuh di Firefox; `prefers-reduced-motion` mematikan semua animasi dan rotasi panel; Performance panel DevTools tidak menunjukkan long task atau layout shift dari animasi. Dicek di produksi 1 Okt 2026 (Playwright + Edge): `reduce` → 0 elemen beranimasi, panel hero tetap di slide 01 setelah 8 s; tanpa `reduce` → 24 elemen beranimasi dan panel pindah ke slide 02. CLS 0 di PageSpeed. Visual vs mockup dicek Pal.
- [x] Tolak consent → tidak ada cookie `_ga`; terima → gtag dimuat dan cookie `_ga` dibuat (dicek di produksi 30 Sep 2026; tolak lewat Cookie settings menghapus `_ga`).
- [x] View source: canonical, hreflang, JSON-LD benar di keempat halaman (`check-deploy`); JSON-LD `WebSite` + `Person` valid tanpa error/peringatan di Schema Markup Validator (Rich Results Test butuh login Google).
- [x] `robots.txt` dan `sitemap.xml` benar; `/admin` mengirim `noindex` (`check-deploy` 24/24).
- [x] securityheaders.com minimal grade A: **A+** di produksi (30 Sep 2026).
- [x] Mailto terbuka dengan subject yang benar di EN dan ID (dicek di keempat halaman produksi); tombol Copy (E2E).
- [x] Copy EN dibaca ulang oleh orang yang fasih bahasa Inggris (dikonfirmasi Pal).

## 12. Urutan build

v1: 22 task dalam 4 fase (T-01..T-22). v2.0.0: 11 task (T-23..T-33), di bawah. Satu task = satu sesi coding AI = satu PR kecil.

### Fase 1 — Fondasi (gate: deploy pipeline jalan)

- [x] **T-01** Init Next.js 16.3 + TypeScript strict + Tailwind v4 + ESLint/Prettier; `engines` Node 24; commit `docs/` (PRD, App Flow, SDD, `design/homepage-mockup.html`) dan `AGENTS.md`.
- [x] **T-02** `styles/globals.css` token + keyframes/motion (bagian 8) + font via `next/font` + komponen `ui/*` dasar (Button, Badge, StatusDot, ArrowIcon) dengan semua state.
- [x] **T-03** Struktur `app/[lang]` + `proxy.ts` (rewrite, 301, guard admin) + `i18n/` (kamus, `localePath`, `altPath`) + unit test routing.
- [x] **T-04** `lib/env.ts` + koneksi Drizzle ke MySQL + skema 3 tabel + migrasi + `scripts/migrate`; Docker MySQL untuk lokal.
- [x] **T-05** GitHub Actions CI (lint, typecheck, unit, build tanpa DB).
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
- [x] **T-21** Isi konten nyata lewat admin (Pal, di devstaging), copy final EN/ID; QA otomatis di devstaging: PageSpeed mobile homepage 98/100/100 (SEO 61 karena staging sengaja noindex), 6 halaman × 5 lebar (360–1440) tanpa scroll samping/gambar rusak, 1 H1 per halaman. Perbaikan: CSP juga lewat `<meta>` (CDN Hostinger menimpa header CSP), bahasa aktif di toggle bukan link, favicon + ikon aplikasi. Sisa manual sebelum launch: HP Android/iPhone nyata + pembaca layar, securityheaders.com dan Rich Results Test setelah domain utama.
- [x] **T-22** Pindah ke domain utama, Search Console, submit sitemap, tempel link di profil Upwork. 30 Sep 2026: produksi live di rifaldiradya.com (branch `main`, database sendiri, check-deploy 24/24, login 401, `/media` 404, DNS email utuh), devstaging di branch `staging` (23/23). 2 Okt 2026: Search Console property Domain `rifaldiradya.com` terverifikasi lewat TXT DNS (record `google-site-verification` di hPanel, jangan dihapus), sitemap disubmit, request indexing untuk `/` dan `/id`; GA4 retensi event data 14 bulan; `contact_email_click` sudah masuk Realtime, tinggal ditandai bintang (key event) di Admin → Events setelah muncul di daftar (≤ 24 jam). **Ditunda:** link di profil Upwork (profil belum dibuat Pal).

### QA v2.0.0 (T-33, 17–18 Okt 2026)

- [x] Tes otomatis: unit 335+, integrasi 29 (migrasi `0004` dua kali = AC-14), E2E 116 desktop + 375 px (axe kedua tema, tema tanpa flash, tanpa JS, reduced motion).
- [x] Code review seluruh diff v2: 2 bug diperbaiki (paste multi-baris What I did; simpan profil atomik), 2 temuan kecil dicatat tanpa perubahan (penanda `case_open` bisa tertinggal setelah ctrl-klik; peringatan E-28 tercatat per render).
- [x] Gerbang UI design-taste: tanpa kontras, overflow, atau scroll samping; temuan lain adalah pilihan mockup yang sudah dibela (scrim, titik + cahaya D-08, garis bawah tautan, penghitung D-04).
- [x] PageSpeed mobile di devstaging, kedua tema: `/` 100/100/100, `/work` 100/100/100, `/id` 94–97/100/100, `/id/work` 99–100/100/100; CLS ≤ 0,001 (SEO < 95 karena devstaging sengaja noindex).
- [x] AC-2..AC-6 diverifikasi di devstaging dengan 7 proyek; AC-7/AC-8 lewat E2E admin; AC-9 diuji Pal di S-14.
- [x] `check-deploy` devstaging 29/29.

### Fase v2 A–D — Persiapan, fondasi, admin, situs publik

- [x] **T-23** Simpan change & rujukan: mockup v2, `homepage-mockup.html` ke `docs/design/archive/`, CHANGE v2.0.0 + tasks, CHANGE v2.1.0 (`proposed`), AGENTS.md menunjuk active change.
- [x] **T-24** Token tema dua lapis + Archivo + `ThemeScript`/`ThemeToggle` (O-04, D-23); skin ulang `ui/*`; token/font v1 dan `<hl>`/`<dim>`/`<mark>` dihapus.
- [x] **T-25** Migrasi `0004` + skema + validasi kondisional + batas 5 `show_on_home` + DTO v2 + `availability_on` + avatar 640 (AC-14).
- [x] **T-26** Admin S-11 (kolom, filter grup), S-12/S-13 per bagian (`LinesInput`, `SegmentedControl`, `CaseActionField`, `VisualField`, Stack maks. 6), S-14 foto 640 + availability; API-03/04/09 (AC-7, AC-8).
- [x] **T-27** Konten (Pal): PDF CV web tanpa nomor HP; konten final diisi di produksi setelah rilis (D-29).
- [x] **T-28** Shell publik: `SiteBar`, `ScrollProgress`, `ChapterDepth`, footer v2, skip link; restyle O-02/O-03 dan S-04; `Navbar`, `FooterCta` dihapus.
- [x] **T-29** Home Hero, About, Highlight, Contact: `MailtoLink` 4 jenis, `CopyEmailButton` di Contact, `CvLink`, `LocalClock`, availability dari `site_settings`, motion CSS D-08 + H1 tanpa fade (D-10); komponen v1 dihapus.
- [x] **T-30** Selected work dipin + snap, penghitung, rail, judul → `/work#case-<slug>`, screenshot lazy, `data-cursor`, E-25.
- [x] **T-31** Halaman Work: H1 + jumlah, `WorkFilter`, `CaseRow` (`<details>`), tombol case 3 jenis, hash open/reset filter, Contact penutup; `ProjectGrid`, `ProjectCard`, `.reveal` dihapus. Sub dihitung dari data (D-30, PR #58).

### Fase v2 E–F — SEO, analytics, rilis

- [x] **T-32** Meta v2, JSON-LD (Person, ItemList dengan URL case), OG ulang, `events.ts` v2 + `data-track`, Privacy EN/ID (`rr-theme`, CV, `rr-case-from-home`), `site-config` LinkedIn baru + GitHub kosong, `check-deploy.mts` diperbarui.
- [x] **T-33** QA v2.0.0 (di atas) + rilis: perbaikan QA (#59, #60), backup DB produksi, `version` 2.0.0, CHANGELOG `[2.0.0]`, CHANGE digabung ke `docs/specs/` dan diarsipkan, D-01..D-30 ke DECISIONS, PR `staging` → `main`, tag `v2.0.0` + GitHub Release, `check-deploy --production`.
- [x] **Pasca-rilis (D-29):** Pal mengisi 7 proyek di admin produksi, `show_on_home` + urutan, foto ≥ 640; lalu verifikasi AC-2 dan PageSpeed di produksi. Produksi 18 Okt 2026: AC-2 lolos di `/` dan `/id` (HR System, Single Sign-On, rifaldiradya.com, SwiftPay, Bloom Studio; penghitung 01–05 / 05; AI tidak di home sesuai D-18); `/work` dan `/id/work` 7 baris, filter 7/3/3/1. PageSpeed mobile kedua tema: `/` 98–99, `/work` 97–99, `/id` 97–98, `/id/work` 96–99; Accessibility, Best Practices, SEO 100; CLS ≤ 0,001; LCP lab 1,7–3,1 s (bervariasi antar-run, belum ada data CrUX). Foto profil 640 × 640.

## 13. Aturan kerja dengan coding AI

Coding AI hanya sebaik konteks dan batas yang diberikan. Tiga dokumen ini masuk ke repo di `docs/`, dan `AGENTS.md` di root jadi pintu masuk yang dibaca AI di setiap sesi.

### Isi `AGENTS.md` (salin ke repo)

```markdown
# AGENTS.md — rifaldiradya.com

## Specs (source of truth)
- Current: docs/specs/ (cek `version` dan `status: current` di header tiap file).
- Active change: none (atau docs/changes/vX.Y.Z-name/CHANGE.md).
- docs/changes/archive/ is history only — never use it as requirements.

## Sumber kebenaran
1. docs/specs/APP_FLOW.md — layar, flow, state, edge case, kontrak API. Paling mengikat.
2. docs/specs/SDD.md — arsitektur, stack, struktur repo, keamanan.
3. docs/specs/PRD.md — alasan produk, copy, visual, motion.
4. docs/design/v2/option-b.html (publik) dan docs/design/v2/admin.html (admin) — referensi visual & interaksi. Kalau mockup berbeda dengan docs, docs yang menang; kalau docs diam, ikuti mockup. Abaikan docs/design/archive/.
Kalau semuanya tidak menjawab: BERHENTI dan tanya. Jangan mengarang.

## Aturan keras
- Next.js 16 App Router, TypeScript strict, Tailwind v4 token dari styles/globals.css; `--calm`/`--faint` bukan untuk teks.
- Pakai proxy.ts, bukan middleware.ts.
- Tidak ada dependency baru tanpa izin; tidak ada dependency native.
- Tidak ada auto-redirect bahasa; locale hanya dari URL.
- Tidak ada GA4/cookie analytics sebelum consent=granted.
- Tidak ada gambar di filesystem server; gambar project di MySQL (lib/images), disajikan lewat /media.
- Tidak ada teks UI hardcode; semua dari i18n/en.json dan i18n/id.json.
- Akses DB hanya di lib/projects, lib/images, dan lib/auth.
- Jangan menambah layar, field, fitur, atau library di luar docs.
- Motion scroll hanya CSS (`@supports` + fallback statis); JS klien hanya untuk komponen di PRD §10; tanpa fade-in pada H1.
- String kamus dengan penanda (<em>, <s>, <strong>) dirender lewat richText(), jangan dangerouslySetInnerHTML.
```

### Pola prompt per task

> Kerjakan **T-30** dari docs/specs/SDD.md bagian 12. Rujukan: App Flow S-01 (Selected work), E-25, E-30; SDD bagian 8 (motion). Tulis rencana dulu, tunggu persetujuan, lalu implementasi. Jangan ubah file di luar `components/site`, `lib/projects`, `app/[lang]/page.tsx`, `styles/globals.css`.

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

- [x] Status rifaldiradya.com di hPanel: WordPress (kontennya tidak dibutuhkan) dikosongkan Pal dan diganti website Node.js baru pada 30 Sep 2026 (bagian 10, "Pindah ke domain utama").
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
