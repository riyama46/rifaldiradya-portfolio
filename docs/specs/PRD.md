---
doc: PRD
app: rifaldiradya.com
tier: full
version: 2.0.0
status: current
last_updated: 2026-10-18
last_change: changes/archive/2026-10-18-v2.0.0-showcase-redesign
---

# PRD — rifaldiradya.com Portfolio v2

Sep 27, 2026 · @Pal · v2.0.0: 18 Okt 2026

> **v2.0.0 (showcase software engineer).** Arah situs berubah dari menjual landing page ke klien Upwork menjadi showcase software engineer full-stack .NET untuk recruiter dan hiring manager, dengan klien proyek sebagai audiens kedua. Rujukan visual dan interaksi: `docs/design/v2/option-b.html` (publik) dan `docs/design/v2/admin.html` (admin). Kalau mockup berbeda dengan dokumen ini, dokumen ini yang menang; kalau dokumen ini diam, ikuti mockup. Keputusan v2 (D-01..D-30) ada di `docs/decisions/DECISIONS.md`; riwayat perubahan di `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/CHANGE.md`.

## 1. Ringkasan produk

rifaldiradya.com adalah portfolio bilingual (EN default, ID sekunder) yang menampilkan Pal sebagai **software engineer full-stack .NET**, dengan bukti utama HRMS yang dipakai 13 perusahaan grup PT Panasonic Manufacturing Indonesia. Situs adalah **funnel ke email** (posisi full-time atau proyek) plus Download CV; admin single-user tetap untuk mengelola proyek.

**Problem.** Recruiter dan hiring manager membandingkan banyak kandidat dalam beberapa detik, kebanyakan di HP. Pekerjaan utama Pal bersifat internal sehingga tidak bisa diklik, jadi situs harus menjelaskannya dengan angka nyata, isi case, CV, dan tawaran walkthrough.

**Konteks pemilik.** Pal sedang aktif melamar; pengunjung datang dari LinkedIn, Upwork, dan Fiverr, kebanyakan lewat HP. Panasonic boleh disebut; layar HRMS internal dan tidak ditampilkan.

## 2. Target user & persona

| Persona | Siapa | Yang dicari | Bahasa | Aksi yang diharapkan |
| --- | --- | --- | --- | --- |
| P1 — Recruiter / hiring manager (primer) | Datang dari LinkedIn, Upwork, atau Fiverr, mayoritas lewat HP | Peran, stack, skala sistem, bukti, cara menghubungi | EN atau ID | Baca hero → Selected work/Work → Download CV atau "Email about a full-time role" |
| P2 — Klien proyek (sekunder) | Perusahaan yang butuh sistem HR atau aplikasi internal | Bukti sistem serupa dan cara menghubungi | EN atau ID | "Email about a project" |
| P3 — Admin (Pal) | Pemilik situs, satu-satunya user admin | Tambah/edit project dalam < 5 menit, dari laptop atau HP | UI admin EN | Login → CRUD project |

## 3. Goals, non-goals & success metrics

**Goals**

1. Recruiter paham peran, stack, dan skala kerja Pal dari layar pertama di HP.
2. Setiap bab mengarah ke email atau CV.
3. Pekerjaan internal bisa dinilai tanpa layarnya (angka nyata, isi case, walkthrough).
4. Pal bisa menambah dan mengatur proyek, termasuk proyek tanpa URL, tanpa menyentuh kode.
5. SEO dua bahasa tidak turun.

**Non-goals**

- Form kontak dan penyimpanan data pengunjung.
- Halaman case study per proyek.
- Blog, testimoni.
- Lapisan pointer dan preview admin (v2.1.0, `docs/changes/v2.1.0-pointer-layer/CHANGE.md`).
- Multi-user admin atau sistem role.

**Success metrics**

| Metrik | Target | Cara ukur |
| --- | --- | --- |
| Lighthouse Performance (mobile) | ≥ 90 | PageSpeed Insights |
| Core Web Vitals | LCP < 2,5 s · INP < 200 ms · CLS < 0,1 | PageSpeed Insights / Search Console |
| Lighthouse Accessibility & SEO | ≥ 95 | Lighthouse |
| Halaman terindex | 4 halaman publik (/, /work, /id, /id/work) | Google Search Console |
| Waktu tambah 1 project via admin | < 5 menit | Uji manual |
| Email posisi full-time yang berujung interview | ≥ 1 dalam 60 hari setelah rilis v2.0.0 | Dicatat manual oleh Pal |
| `contact_email_click` per `kind` | Baseline 30 hari pertama | GA4 |
| `cv_download` | Baseline 30 hari pertama (sinyal awal minat recruiter) | GA4 |

## 4. Positioning, promise & copy

**Positioning:** software engineer full-stack .NET (C#, ASP.NET, SQL Server, Azure). Sejak Nov 2022 membangun dan menjaga HRMS yang dipakai 13 perusahaan grup PT Panasonic Manufacturing Indonesia. Situs adalah showcase untuk recruiter dan klien proyek, dan funnel ke email.

Sumber copy final EN/ID = objek `T` di `option-b.html`, dipindah ke `i18n/en.json` dan `i18n/id.json` (key di App Flow §11). Pengecualian terhadap `T`: teks availability tetap di i18n (D-16), label Copy email (D-17), subject walkthrough (D-25), sub halaman Work dihitung dari data (D-30), dan copy baru yang tidak ada di mockup: Download CV, Copy email, meta SEO (§9).

Aturan copy: tanpa em dash, tanpa pola "Not X. Y.", tanpa kata klise, tombol menyebut persis apa yang terjadi, EN dan ID ditulis terpisah (transcreation), tanpa angka atau testimoni karangan, angka proyeksi selalu ditulis "projected"/"perkiraan".

| Elemen | EN | ID |
| --- | --- | --- |
| Bar | Rifaldi Radya Pratama · Work · About · EN/ID · tema · Email me | … · Karya · Tentang · … · Kirim email |
| Label hero | Software engineer · Full-stack .NET · Jakarta, Indonesia | … · Jabodetabek |
| Availability (hanya bila saklar on) | Open to full-time roles and projects | Terbuka untuk posisi full-time dan proyek |
| H1 | Building HR software / for *thousands.* | Membangun software HR / untuk *ribuan karyawan.* |
| Sub | Four years building and running the HR system of 13 Panasonic group companies: hundreds of HR users, thousands of employee records. | Empat tahun membangun dan menjaga sistem HR 13 perusahaan grup Panasonic: ratusan pengguna HR, ribuan data karyawan. |
| Stack | C# · ASP.NET · SQL Server · Azure · Power Automate · Next.js · TypeScript | sama |
| Highlight | One login instead of ~~five passwords.~~ · 5 → 1 · ~200 · 13 | ~~Lima password~~ jadi satu login. · ±200 |
| Contact H2 | Tell me what you're *building.* | Ada posisi atau *proyek?* |
| Tombol Contact | Email about a full-time role · Email about a project | Email soal posisi full-time · Email soal proyek |
| Download CV | Download CV (PDF) | Unduh CV (PDF) |
| Copy email | Copy email → Copied | Salin email → Tersalin |

Angka dan sumbernya (CV v1.0, Drive `01_Personal Docs/Current/Career`, dicek ulang 17 Okt 2026): 13 perusahaan grup, Pal memegang 6; ratusan staf HR/admin, ribuan data karyawan, ±2.000 di site utama; SSO 4–5 password → 1 untuk ±200 staf, live sejak awal 2023; Teams approval ±57 → 4 menit **proyeksi** (tahap usulan); tim 3 orang.

## 5. Information architecture & site map

URL publik: `/`, `/work`, `/privacy`, `/id`, `/id/work`, `/id/privacy`; admin `/admin/*`. EN tinggal di root, ID di prefix `/id`.

Setiap halaman EN berpasangan dengan versi ID lewat hreflang dan toggle bahasa. Admin tidak dwibahasa, tidak masuk sitemap, dan diblok dari index (`noindex`).

**Home:** bar → Hero `#top` → Selected work `#work` → About `#about` → Highlight `#highlight` → Contact `#contact` → footer.

**Work:** bar → judul + filter + baris case (`#case-<slug>`) → Contact penutup `#more` → footer.

Tanpa label section bernomor.

## 6. Fitur

| ID | Fitur | Persona | Prioritas |
| --- | --- | --- | --- |
| F1 | Homepage (Hero, Selected work, About, Highlight, Contact) | P1, P2 | P0 |
| F2 | Halaman Work (filter grup + baris case) | P1, P2 | P0 |
| F3 | Case row (menggantikan project card v1) | P1, P2 | P0 |
| F4 | Bilingual routing EN/ID + toggle + banner saran bahasa | P1, P2 | P0 |
| F5 | Kontak: mailto 4 jenis, Copy email, Download CV | P1, P2 | P0 |
| F6 | Admin login single-user | P3 | P0 |
| F7 | Admin CRUD project (field case EN+ID, grup, tombol case, visual, Show in Selected work, publish) | P3 | P0 |
| F8 | GA4 + cookie consent banner | P3 (insight), P1 (privasi) | P0 |
| F9 | Fondasi SEO (meta, hreflang, sitemap, robots, schema Person) | Semua | P0 |

### F1 — Homepage

**Story:** Sebagai recruiter, saya mau langsung paham peran, stack, dan skala kerja Rifaldi dari layar pertama di HP, lalu menghubungi atau mengunduh CV.

- [ ] Urutan bab sesuai bagian 5; tiap bab satu layar (`100svh`) dengan scroll snap `y proximity`; reduced motion → snap dimatikan.
- [ ] Layar pertama di 390 × 844 dan 375 × 667 memuat label peran, H1, dan tombol "Email me", termasuk saat banner consent tampil.
- [ ] Baris availability hanya tampil bila `availability_on` (S-14) aktif.
- [ ] Selected work menampilkan proyek `published AND show_on_home`, urut `sort_order`, maks. 5, dengan penghitung "0n / 0N" dan rail nama proyek; judul proyek menaut ke `/work#case-<slug>` (locale aktif).
- [ ] Proyek dengan `case_action = site` menampilkan tautan "Open the live site ↗"; proyek bervisual screenshot menampilkan screenshot yang menaut ke `live_url` bila ada, selain itu ke case.
- [ ] About: statement, dua paragraf, Pendidikan, Sertifikasi, tautan Download CV.
- [ ] Highlight SSO: statement dengan "five passwords" dicoret, tiga angka (5 → 1, ~200, 13), catatan HRMS internal, kalimat jembatan ke Contact.
- [ ] Contact: dua tombol mailto (role, project), email sebagai tautan + tombol Copy email, LinkedIn, Download CV, jam GMT+7; GitHub hanya bila terisi (D-19).

### F2 — Halaman Work

**Story:** Sebagai recruiter, saya mau melihat semua proyek dan membuka detail satu proyek tanpa pindah halaman.

- [ ] H1 "Work" dengan jumlah proyek published; sub dihitung dari jumlah proyek per grup (D-30).
- [ ] Filter All / Panasonic / Websites / AI tools (dengan jumlah per grup); filter hanya di klien, tanpa JS semua baris tampil.
- [ ] Semua proyek published sebagai baris (judul · meta · side), urut `sort_order`.
- [ ] Baris dibuka untuk melihat What it is, What I did (1–8 poin), Stack, Status, dan tombol sesuai `case_action`.
- [ ] `/work#case-<slug>` membuka dan menggulir ke baris itu.
- [ ] Bab Contact penutup "Have a project like *these?*".
- [ ] Empty state kalau 0 project: pesan singkat + CTA email (tidak pernah halaman kosong).

### F3 — Case row

Kartu v1 diganti baris case (F2) dan item Selected work (F1); tag tech stack menjadi "Stack" (maks. 6).

- [ ] Tautan keluar ke situs live membuka tab baru dengan `rel="noopener noreferrer"`; `live_url` hanya dirender bila `https:`.
- [ ] Semua teks baris mengikuti bahasa halaman aktif; alt text screenshot juga per bahasa.
- [ ] Klik tautan situs tercatat sebagai `project_link_click` (placement `home` atau `case`), membuka baris tercatat sebagai `case_open`, hanya jika consent analytics diberikan.

### F4 — Bilingual EN/ID

**Story:** Sebagai klien lokal, saya mau membaca situs dalam Bahasa Indonesia tanpa kehilangan posisi.

- [ ] EN di `/` dan `/work`; ID di `/id` dan `/id/work`. Kedua versi selalu bisa diakses langsung tanpa redirect paksa.
- [ ] Toggle "EN | ID" di navbar, bahasa aktif ditandai; klik membawa ke halaman padanan (`/work` ↔ `/id/work`), bukan ke homepage.
- [ ] Pilihan bahasa disimpan di cookie `lang_pref` (365 hari).
- [ ] Banner saran: muncul hanya jika user berada di versi EN, header `Accept-Language` mengandung `id`, dan cookie `lang_pref` belum ada. Isi: "Also available in Indonesian" + tombol "Lihat versi Indonesia" + tombol tutup. Klik apa pun menyimpan `lang_pref`, banner tidak muncul lagi.
- [ ] Tidak ada auto-redirect berbasis IP atau `Accept-Language`; crawler selalu mendapat konten sesuai URL.
- [ ] Atribut `<html lang>` = `en` atau `id` sesuai halaman.

### F5 — Kontak

**Story:** Sebagai recruiter atau klien yang tertarik, saya mau menghubungi Rifaldi dengan satu klik atau mengunduh CV-nya.

- [ ] Semua tombol email adalah `mailto:hello@rifaldiradya.com` dengan subject dan body terisi per jenis: `general` (bar, hero), `role`, `project` (Contact), `walkthrough` (case dengan `case_action = walkthrough`, subject menyebut judul proyek), per bahasa halaman (App Flow §11).
- [ ] Copy email hanya di Contact (D-17).
- [ ] Download CV di About dan Contact.
- [ ] Event `contact_email_click` dengan `kind`, `cv_download` (bila consent).
- [ ] Tidak ada form dan tidak ada data pengunjung di server.

### F6 — Admin login

**Story:** Sebagai Pal, saya mau area admin yang hanya bisa saya buka.

- [ ] Hanya satu akun admin; tidak ada halaman register atau reset password publik.
- [ ] Login dengan email + password; sesi via cookie `httpOnly`, `secure`, `sameSite=lax`, kedaluwarsa 7 hari.
- [ ] Semua route `/admin/*` (kecuali `/admin/login`) dan semua API tulis menolak request tanpa sesi valid (redirect ke login / respons 401).
- [ ] Rate limit login: maksimal 5 percobaan gagal per 15 menit per IP.
- [ ] Pesan error login generik: "Email or password is incorrect" (tidak membocorkan mana yang salah).
- [ ] Tombol logout menghapus sesi.

### F7 — Admin CRUD project

**Story:** Sebagai Pal, saya mau menambah project baru dalam kurang dari 5 menit supaya portfolio selalu up to date.

- [ ] Field dan aturan publish mengikuti App Flow S-12/S-13: judul, grup, meta + side, deskripsi singkat, Show in Selected work, What it is, What I did, Stack, Status, tombol case (situs / walkthrough / tanpa tombol) + Live URL, visual (screenshot + alt atau kartu angka), Published.
- [ ] "Show in Selected work" maks. 5 (UI menonaktifkan saklar ke-6, API menolak dengan 422); urutan ↑/↓ tetap.
- [ ] Live URL hanya wajib bila tombol case = situs; harus `https://`.
- [ ] Upload gambar: JPG/PNG/WebP, dikompres di browser, disimpan di MySQL (bukan filesystem server).
- [ ] Pesan error menyebut cara memperbaikinya.
- [ ] Delete butuh konfirmasi dialog; gambar terkait ikut dihapus.
- [ ] Setelah simpan/hapus, halaman publik ter-update maksimal 60 detik tanpa redeploy.
- [ ] Form admin nyaman dipakai di HP (input ≥ 16 px, satu kolom di < 768 px).

### F8 — GA4 + cookie consent

**Story:** Sebagai Pal, saya mau tahu apakah portfolio bekerja, tanpa melanggar privasi pengunjung EU.

- [ ] Banner consent muncul pada kunjungan pertama dengan dua pilihan setara: "Accept" dan "Reject" (+ link kebijakan privasi singkat).
- [ ] Google Consent Mode v2 dengan default `analytics_storage = denied`; GA4 tidak menyimpan cookie sebelum Accept.
- [ ] Pilihan disimpan di cookie `consent` (180 hari); link "Cookie settings" di footer untuk mengubah pilihan.
- [ ] Event terlacak: `page_view`, `contact_email_click` (dengan `kind`), `project_link_click`, `case_open`, `theme_switch`, `cv_download`, `language_switch`. Key event: `contact_email_click` dan `cv_download`.
- [ ] Admin tidak dilacak.
- [ ] Halaman kebijakan privasi singkat per bahasa (`/privacy`, `/id/privacy`), `noindex` tidak diperlukan.

### F9 — Fondasi SEO

Detail lengkap di bagian 9. Acceptance ringkas:

- [ ] Title dan meta description unik per halaman per bahasa.
- [ ] hreflang `en`, `id`, dan `x-default` (→ EN) di semua halaman publik.
- [ ] `sitemap.xml` dan `robots.txt` digenerate otomatis; admin tidak masuk sitemap.
- [ ] JSON-LD `Person` + `WebSite` di homepage.
- [ ] Open Graph + Twitter card per halaman (gambar OG 1200 × 630).

## 7. Out of scope (roadmap setelahnya)

Semua item di bawah sengaja ditunda. Trigger = kondisi yang membuat item layak dikerjakan.

| Item | Kenapa ditunda | Trigger untuk dikerjakan |
| --- | --- | --- |
| Lapisan pointer + preview admin | Dipisah agar v2.0.0 bisa live lebih cepat (D-27) | v2.0.0 live; sudah direncanakan di `docs/changes/v2.1.0-pointer-layer/CHANGE.md` |
| Halaman case study per URL | Baris case di halaman Work sudah cukup | Ada proyek dengan cerita yang tidak muat di satu baris |
| Form kontak dengan penyimpanan data | Email sudah cukup; form menambah data pribadi + spam handling | Volume inquiry naik atau butuh brief terstruktur |
| Link GitHub | Profil publik belum punya repo yang layak (D-19) | Profil GitHub punya repo publik yang layak |
| Screenshot HRMS diblur | Layar internal | Pal mendapat izin dan ingin mengganti kartu angka |
| Link profil Upwork/Fiverr | Belum diputuskan | Profil aktif dan ingin ditautkan |
| Testimoni | Belum ada testimoni tertulis | Ada testimoni tertulis yang boleh dipakai |
| Blog/artikel | Beban konten besar, bukan kebutuhan funnel | Portfolio stabil dan ada waktu konten rutin |
| Layanan non-engineering | Di luar positioning | Tidak direncanakan |

## 8. Arah UI/UX & visual identity

Arah **"Opsi B"** (D-02): hitam/putih hangat dengan banyak ruang, satu adegan per layar, aksen cobalt hanya di satu kata miring per judul, tombol primer, garis/hover aksen, dan cahaya bab. Mode gelap (default) dan terang dengan toggle, tanpa flash saat load (D-23). Rujukan nilai: blok `:root` di `option-b.html`, dipindah apa adanya ke lapisan token (SDD §8):

| Token | Gelap (default) | Terang |
| --- | --- | --- |
| `--bg` | `#0b0b0b` | `#f6f6f3` |
| `--ink` | `#f1f1ef` | `#111111` |
| `--soft` | `rgba(241,241,239,.62)` | `rgba(17,17,17,.64)` |
| `--faint` | `rgba(241,241,239,.16)` | `rgba(17,17,17,.14)` |
| `--accent` | `#7b93ff` | `#2f4fe0` |
| `--accent-ink` | `#0b0b0b` | `#ffffff` |
| `--calm` | `#d2bf9f` | `#8a7152` |
| `--k` (kekuatan cahaya) | `1` | `0.6` |

Kontras (WCAG, dihitung 17 Okt 2026): ink di bg 17,4 / 17,4; soft di bg 6,98 / 5,55; accent sebagai teks 6,99 / 5,85; label di atas tombol aksen 6,99 / 6,33 (semua lulus AA). **Aturan:** `--calm` hanya untuk warna cahaya, tidak pernah untuk teks (terang hanya 4,25:1); `--faint` hanya garis dekoratif, tidak pernah satu-satunya batas input (1,35–1,49:1), input admin wajib punya batas ≥ 3:1 (pakai `--soft`).

**Tipografi:** Archivo (400, 500, 600, italic 500/600), self-host lewat `next/font`.

**Motion** (D-08, D-10): parallax per bab (lapisan titik dan cahaya), fokus blur/fade per bab, statement About terisi baris per baris, "five passwords" dicoret lalu angka menghitung, progress bar, langkah Selected work dipin, hover garis aksen judul. Semua CSS scroll-driven (`view()`/`scroll()`) di dalam `@supports`, dengan fallback tumpukan statis untuk browser lama dan reduced motion. H1 punya animasi masuk naik 900 ms **tanpa fade** (`opacity` 1 sejak frame pertama, LCP = teks H1). Tidak ada listener scroll JavaScript, library animasi, atau rotasi/timer JS. Tabel motion lengkap mengikuti mockup.

**Komponen:** SDD §4.

**Mobile-first (wajib):** didesain dari 375 px dulu. Target sentuh ≥ 44 × 44 px dengan jarak ≥ 8 px. Tidak ada horizontal scroll di lebar berapa pun.

## 9. Requirement SEO & bilingual (i18n)

SEO = level **standard**: fondasi teknis yang benar untuk 2 bahasa, on-page per halaman, structured data personal brand, dan kesiapan untuk AI search. Link building dan konten blog di luar scope.

**Struktur URL & bahasa**

- Subfolder, bukan subdomain atau query param: EN di root, ID di `/id`. Slug tetap sama di kedua bahasa (`/work`, `/id/work`) supaya pemetaan padanan sederhana.
- Setiap halaman publik: `<link rel="canonical">` ke dirinya sendiri (bukan ke versi EN).
- hreflang dua arah + `x-default` → versi EN, di `<head>` dan di sitemap.
- Tidak ada redirect otomatis berbasis bahasa/lokasi (lihat F4); crawler dan manusia melihat konten yang sama untuk URL yang sama.

**Meta per halaman**

| Halaman | Title | Description |
| --- | --- | --- |
| `/` | Rifaldi Radya Pratama, Software Engineer (Full-Stack .NET) | Software engineer building the HR system 13 Panasonic group companies run on. C#, ASP.NET, SQL Server and Azure. Based in Jakarta, Indonesia. |
| `/work` | Work: HR Systems, Websites, AI Tools \| Rifaldi Radya Pratama | HR systems inside Panasonic, websites and AI tools by Rifaldi Radya Pratama. Open a row for what it is, what I did and the stack. |
| `/id` | Rifaldi Radya Pratama, Software Engineer (Full-Stack .NET) | Software engineer yang membangun sistem HR 13 perusahaan grup Panasonic. C#, ASP.NET, SQL Server, dan Azure. Berbasis di Jabodetabek. |
| `/id/work` | Karya: Sistem HR, Website, Alat AI \| Rifaldi Radya Pratama | Sistem HR di Panasonic, website, dan alat AI karya Rifaldi Radya Pratama. Buka satu baris untuk melihat apa itu, yang saya kerjakan, dan stack-nya. |

Meta tidak menyebut availability (D-26).

**Keyword hipotesis:** "software engineer .NET Jakarta", "full-stack .NET developer", "ASP.NET developer Indonesia" + nama pribadi. Target realistis: ranking untuk **nama sendiri** (branded search).

**On-page**

- Satu H1 per halaman (headline hero di homepage), hierarki H2/H3 berurutan.
- Semua gambar via `next/image`: WebP/AVIF, ukuran responsif, `width`/`height` eksplisit (anti-CLS), lazy-load kecuali gambar di atas fold, alt text per bahasa.
- HTML semantik: `header`, `nav`, `main`, `section`, `footer`; link keluar ke project live pakai anchor text deskriptif.
- Open Graph + Twitter card per halaman per bahasa, `og:locale` = `en_US` / `id_ID` dengan `og:locale:alternate`.

**Structured data (JSON-LD)**

- Homepage: `Person` (name, url, `jobTitle` "Software Engineer", email, `worksFor` PT Panasonic Manufacturing Indonesia, `knowsAbout` C#, ASP.NET, SQL Server, Microsoft Azure, Next.js, TypeScript; `sameAs` `https://www.linkedin.com/in/rifaldiradya` + GitHub bila terisi) + `WebSite` (name, url, inLanguage).
- Halaman Work: `CollectionPage` dengan `ItemList` project (name, `live_url` bila ada, selain itu URL case `…/work#case-<slug>`).
- Isi schema harus sama dengan konten yang terlihat di halaman.

**Teknis crawl & index**

- Rendering: halaman publik dirender statis (SSG) dengan revalidasi on-demand saat admin menyimpan, jadi HTML lengkap tersedia untuk crawler.
- `sitemap.xml` otomatis: 4 halaman publik + 2 halaman privacy, masing-masing dengan `xhtml:link` alternate hreflang dan `lastmod` dari update project terakhir.
- `robots.txt`: allow semua, disallow `/admin` dan `/api`, cantumkan URL sitemap. Crawler AI (GPTBot, ClaudeBot, PerplexityBot) diizinkan supaya profil bisa dikutip di AI search.
- Admin: `noindex, nofollow` via meta dan header.
- Halaman 404 custom per bahasa dengan link balik ke homepage dan Work.
- HTTPS wajib. Versi kanonik: `https://rifaldiradya.com` (non-www); `www.rifaldiradya.com` dan `http://` redirect 301 ke versi kanonik dengan path yang sama.

**Siap AI search (GEO dasar):** paragraf About ditulis faktual dan mudah dikutip: siapa, peran, perusahaan, stack, cara kontak, dalam kalimat utuh, bukan hanya ikon.

**Setelah launch:** verifikasi domain di Google Search Console, submit sitemap, cek coverage kedua bahasa dan laporan hreflang; cek Rich Results Test untuk schema.

## 10. Non-functional requirements

| Area | Requirement | Cara verifikasi |
| --- | --- | --- |
| Performance | Lighthouse mobile ≥ 90; LCP < 2,5 s, INP < 200 ms, CLS < 0,1; LCP = teks H1; JS klien halaman publik (di luar runtime Next.js dan GA4) hanya: toggle tema, filter + hash Work, Copy email, jam GMT+7, consent, banner bahasa, target gabungan ≤ 6 KB gzip; animasi scroll hanya CSS, tanpa listener `scroll` | PageSpeed Insights di 4 halaman publik dalam kedua tema + Performance panel DevTools |
| Aksesibilitas | WCAG 2.2 AA: kontras, focus ring terlihat (`:focus-visible`), navigasi keyboard penuh, elemen native (`button`, `a`), target sentuh ≥ 44 px, `prefers-reduced-motion` dihormati, skip link ke konten | Lighthouse ≥ 95 + uji keyboard manual + axe DevTools |
| Responsif | Layout benar di 360, 375, 768, 1024, 1440 px; tanpa horizontal scroll | Uji manual di DevTools + 1 HP Android/iOS nyata |
| Browser | 2 versi terakhir Chrome, Safari (termasuk iOS), Firefox, Edge | Uji manual |
| Keamanan | HTTPS; password admin di-hash (bcrypt/argon2); sesi cookie httpOnly + secure; rate limit login; validasi input server-side; upload dibatasi tipe & ukuran; secret hanya di environment variable, tidak pernah di repo; security headers (CSP, X-Frame-Options, Referrer-Policy) | Review kode + cek header via securityheaders.com |
| Privasi | Tidak menyimpan data pribadi pengunjung di server; GA4 hanya aktif setelah consent; `localStorage` `rr-theme` hanya preferensi tampilan, tidak dikirim ke mana pun; kebijakan privasi per bahasa menyebutnya | Uji: tolak consent → tidak ada cookie `_ga` |
| Ketersediaan | Situs publik tetap tampil walau database/storage sedang gangguan (menyajikan halaman statis terakhir) | Simulasi: matikan koneksi DB di staging |
| Maintainability | Konten project hanya lewat admin; copy statis di file terjemahan terpisah per bahasa (bukan hardcode di komponen) | Review struktur repo |
| Biaya | Rp 0 tambahan per bulan di luar hosting Hostinger Business + domain (semua layanan pihak ketiga di tier gratis) | Cek dashboard tiap layanan |

## 11. Constraints teknis & hosting

| Constraint | Keputusan | Status |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript | Final |
| Hosting | Hostinger **Business Web Hosting** → fitur Node.js Web Apps (paket Business termasuk yang didukung; runtime Node 18/20/22/24) | Final, perlu cek di hPanel |
| Deploy | Push ke GitHub → Hostinger GitHub integration build otomatis (install → build → start) setiap push ke branch `main` | Final |
| Domain | rifaldiradya.com (sudah dimiliki); project demo di `staging0.` dan `staging1.rifaldiradya.com` | Final |
| Email | hello@rifaldiradya.com (public), rifaldi@rifaldiradya.com (primer) | Final |
| Penyimpanan gambar | Bukan filesystem server, supaya aman dari redeploy. Dikunci: MySQL Hostinger, dikompres di browser admin (16:10, WebP, 4 lebar) | Final (29 Sep 2026, tanpa vendor pihak ketiga) |
| Database | Database terkelola kecil untuk data project + akun admin (kandidat dibandingkan di SDD: MySQL bawaan Hostinger vs Postgres terkelola seperti Supabase/Neon) | Diputuskan di SDD |
| Analytics | Google Analytics 4 + Consent Mode v2 | Final |
| Font | Archivo, self-host via `next/font` | Final |
| Waktu kerja | 5–10 jam/minggu di luar kerja full-time | Final |
| Data sensitif | Hanya kredensial admin (hash) dan secret API; tidak ada data pembayaran; tidak ada data pribadi pengunjung selain cookie analytics berbasis consent | Final |

**Catatan penting dari dokumentasi Hostinger:** alur deploy Node.js membuat slot website baru untuk domain. Kalau rifaldiradya.com sudah terdaftar sebagai website (mis. WordPress) di paket hosting, website itu harus dihapus dulu sebelum deploy app Node.js di domain yang sama ([Hostinger docs](https://docs.hostinger.com/node.js/creating-an-app)). Cek dulu apakah subdomain `staging0`/`staging1` ikut terdampak sebelum menghapus apa pun.

Alur GitHub → build otomatis dan paket yang didukung: [Hostinger GitHub integration](https://docs.hostinger.com/node.js/github), [panduan deploy Next.js resmi Hostinger](https://github.com/hostinger/deploy-nextjs).

## 12. Dependensi konten (v2)

- [ ] Isi 7 proyek di admin **produksi** setelah rilis (teks EN/ID dari `T` di mockup: `w*`, `r*`, `c*`, `peek.*`), atur `show_on_home` dan urutan (D-18, D-29).
- [x] PDF CV versi web: varian Software Engineer tanpa nomor HP, dibersihkan metadata generator, `public/cv/rifaldi-radya-pratama-cv.pdf`.
- [ ] Foto profil ≥ 640 × 640 px diunggah ulang di S-14.
- [ ] Konfirmasi akhir teks hero dan About.
- [ ] Opsional: screenshot HRMS diblur.

## 13. Risiko, asumsi & open questions

**Risiko**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Rekan kerja melihat "Open to full-time roles" | Situasi canggung di kantor | Saklar availability di S-14 (D-16); meta tanpa availability (D-26) |
| Scroll-driven animation berbeda di Safari/Firefox | Bab tidak terbaca | Fallback tumpukan statis + QA wajib |
| Rollback setelah ada proyek tanpa URL | Kode v1 rusak | Revert merge **dan** restore backup DB pra-rilis (D-21) |
| Blur/filter dan font menurunkan skor mobile | Lighthouse < 90 | Gate Lighthouse diuji di staging sebelum rilis |
| Scope creep (admin, bilingual, GA4) memperlambat launch | Rencana transisi 6 bulan mundur | Scope v1 dikunci di dokumen ini; item baru masuk tabel bagian 7 |
| Deploy Node.js di Hostinger bentrok dengan website WordPress lama di domain yang sama | Downtime atau subdomain demo terganggu | Cek daftar website di hPanel dulu; backup; uji di subdomain sementara sebelum pindah ke domain utama |
| Build di Hostinger gagal karena versi Node/konfigurasi | Deploy tertunda | Kunci versi Node di `package.json` (`engines`), uji build lokal sebelum push |
| Konten (About, deskripsi, screenshot) belum siap saat kode selesai | Launch tertunda | Kerjakan konten paralel sejak minggu pertama (bagian 12) |
| Copy terjemahan mesin terasa kaku | Trust turun, terutama di EN | Wajib revisi manual; minta 1 orang fasih EN membaca sebelum launch |
| Layanan gratis (storage/DB) mengubah kuota | Upload/admin gagal | Pilih vendor dengan free tier jauh di atas kebutuhan; halaman publik tetap statis |

**Asumsi**

- Paket Business Hostinger menampilkan menu Node.js Apps di hPanel akun Pal.
- Pal mengelola akun GitHub sendiri dan repo bisa private.
- Pekerjaan Panasonic boleh disebut (dikonfirmasi Pal); layar internal tidak ditampilkan.
- Trafik awal kecil (< 1.000 kunjungan/bulan), jadi tier gratis semua layanan cukup.

**Open questions**

- [x] Apakah rifaldiradya.com saat ini masih terpasang sebagai website WordPress di Hostinger? **Ya, masih WordPress**, dan **tidak ada kontennya yang dibutuhkan** (dikonfirmasi 28 Sep 2026). WordPress tetap di-backup sebagai jaring pengaman, lalu diganti di Fase 4 setelah versi uji lolos QA (SDD bagian 10).
- [ ] Subdomain demo tetap `staging0/1` untuk v1 (diputuskan). Ganti nama nanti cukup edit URL project di admin.
- [x] Versi kanonik: **`rifaldiradya.com` (non-www)**, disetujui 28 Sep 2026.
- [x] Link sosial di footer: **LinkedIn** `https://www.linkedin.com/in/rifaldiradya` (diputuskan 28 Sep 2026). GitHub menyusul jika diinginkan.
- [x] Zona waktu di blok fakta About: **GMT+7 (WIB)**, dikonfirmasi 28 Sep 2026.

## 14. Rencana rilis & milestone

Target: v1 live sekitar **4 minggu** setelah dokumen perencanaan selesai, dengan asumsi 5–10 jam/minggu (total kira-kira 20–40 jam). Ini estimasi, bukan komitmen; gate di bawah lebih penting daripada tanggal.

&#91;embedded content: rencana rilis v1 · 4 fase, 2 gate, 1 jalur konten paralel\]

Pipeline deploy diuji di minggu pertama dengan halaman kosong, supaya masalah Hostinger ketahuan sebelum fitur dibangun. Launch hanya jika semua acceptance criteria di bagian 6 tercentang dan metrik bagian 3 terpenuhi.

**Urutan dokumen perencanaan:** PRD (dokumen ini) → App Flow Document (layar, navigasi, flow langkah demi langkah, state, edge case, kontrak data/API) → SDD (arsitektur, pilihan DB/storage final, struktur repo, aturan kerja dengan coding AI). Eksekusi kode dilakukan terpisah dengan setup vibe-coding-builder.

**v2.0.0:** dirakit di `staging` (task T-23..T-33, SDD §12), dirilis lewat PR `staging` → `main`; v2.1.0 (lapisan pointer + preview admin) menyusul sebagai MINOR.
