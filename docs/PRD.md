# PRD — rifaldiradya.com Portfolio v1

Sep 27, 2026 · @Pal

> **Revisi 28 Sep 2026 — desain homepage v3.** Bagian 4, 5, F1, 8, 12, dan 13 diperbarui mengikuti mockup `docs/design/homepage-mockup.html` (panel bukti di hero dengan pengganti project, baris meta, label section bernomor, alur Brief → Build → Live, About dengan lead + highlight + blok fakta, CTA akhir yang dipusatkan, dan spesifikasi motion). Mockup adalah referensi visual; perilaku dan teks yang mengikat tetap ada di dokumen ini dan App Flow.

## 1. Ringkasan produk

rifaldiradya.com v1 adalah portfolio bilingual (EN default, ID sekunder) yang menjual satu layanan utama: **landing page yang live dalam hitungan hari**, dengan web app/dashboard sebagai layanan sekunder. Web ini dilengkapi admin panel single-user supaya library project bisa di-update sendiri tanpa sentuh kode.

**Problem.** Rifaldi (Pal) mau mulai ambil klien freelance, terutama lewat Upwork, tapi belum punya portfolio web. Tanpa bukti kerja yang bisa diklik, klien Upwork nggak punya alasan memilih dia dibanding ratusan freelancer lain yang profilnya sudah terbukti.

**Kenapa worth dibangun.**

- **Dibanding tidak melakukan apa-apa:** profil Upwork tanpa link portfolio cuma berisi klaim. Portfolio live = bukti yang bisa diverifikasi klien dalam hitungan detik.
- **Dibanding pakai platform siap jadi (Behance, Notion, Linktree):** untuk developer yang menjual jasa bikin website, web sendiri yang cepat dan rapi adalah bukti skill itu sendiri. Platform pihak ketiga malah menyiratkan "nggak bisa bikin sendiri".
- **Dibanding portfolio statis tanpa admin:** library harus terus bertambah seiring project baru. Admin panel menghapus friksi update, jadi portfolio nggak basi.

**Konteks pemilik.** Pal bekerja full-time sebagai web developer, punya waktu realistis 5–10 jam/minggu, dan menargetkan transisi ke freelance dalam kurang lebih 6 bulan. Portfolio ini ada di jalur kritis rencana itu.

## 2. Target user & persona

Prioritas audiens: **klien freelance** (bukan recruiter). Upwork/internasional adalah target utama, klien lokal Indonesia sekunder.

| Persona | Siapa | Yang dicari dalam 30 detik pertama | Bahasa | Aksi yang diharapkan |
| --- | --- | --- | --- | --- |
| P1 — Klien Upwork (primer) | Founder, marketer, atau pemilik bisnis kecil di luar negeri yang butuh landing page cepat | Bukti kerja live, kecepatan, sinyal bisa kerja remote lintas timezone | EN | Klik project live → email |
| P2 — Klien lokal (sekunder) | UMKM/bisnis kecil Indonesia yang butuh online cepat | Hasil nyata, proses simpel, bisa diajak ngobrol | ID | Pindah ke /id → lihat project → email |
| P3 — Admin (Pal) | Pemilik situs, satu-satunya user admin | Tambah/edit project dalam < 5 menit, dari laptop atau HP | UI admin EN | Login → CRUD project |

**Insight kunci dari P1:** klien Upwork membandingkan banyak profil sekaligus dan langsung klik link untuk verifikasi klaim. Klaim yang tidak didukung bukti menurunkan trust, jadi copy hanya menjanjikan yang bisa dibuktikan.

## 3. Goals, non-goals & success metrics

**Goals v1**

1. Punya portfolio live di rifaldiradya.com yang bisa langsung ditempel di profil dan proposal Upwork.
2. Membuktikan klaim "landing page cepat" lewat 2 project live dan performa situs itu sendiri.
3. Mengubah pengunjung jadi percakapan lewat CTA email ke hello@rifaldiradya.com.
4. Pal bisa menambah project baru tanpa menyentuh kode.
5. Terindex dengan benar di Google untuk dua bahasa (EN dan ID).

**Non-goals v1**

- Menjual layanan selain web development (SEO, design, ads, VA, copywriting, sosmed).
- Menarik recruiter/HR; CV dipisah dari situs ini.
- Blog, testimoni, halaman case study per project.
- Multi-user admin atau sistem role.

**Success metrics**

| Metrik | Target | Cara ukur |
| --- | --- | --- |
| Situs live + link dipakai di profil Upwork | Tercapai saat launch | Checklist rilis |
| Lighthouse Performance (mobile) | ≥ 90 | PageSpeed Insights |
| Core Web Vitals | LCP < 2,5 s · INP < 200 ms · CLS < 0,1 | PageSpeed Insights / Search Console |
| Lighthouse Accessibility & SEO | ≥ 95 | Lighthouse |
| Halaman terindex | 4 halaman publik (/, /work, /id, /id/work) | Google Search Console |
| Waktu tambah 1 project via admin | < 5 menit | Uji manual |
| Klik CTA email | Terlacak sebagai event di GA4 (baseline diukur 30 hari pertama) | GA4 event `contact_email_click` |

Target konversi (jumlah email masuk) sengaja belum dipatok: dengan trafik awal kecil, angka 30 hari pertama dipakai sebagai baseline.

## 4. Positioning, promise & copy

**Positioning:** web developer yang membangun landing page dengan cepat untuk founder dan bisnis kecil, siap kerja remote dengan klien global. **Promise tunggal:** landing page live dalam hitungan hari, bukan minggu. Web app/dashboard disebut sebagai layanan sekunder, tidak pernah di headline.

Aturan copy: EN dan ID adalah **transcreation**, bukan terjemahan literal. Draft awal boleh pakai machine translation, lalu direvisi manual per audiens. Copy tidak boleh berisi angka, testimoni, atau klaim yang tidak bisa dibuktikan.

**Hero**

| Elemen | EN (default, /) | ID (/id) |
| --- | --- | --- |
| Headline (H1) | Landing Pages That Launch in Days, Not Weeks | Landing Page Siap Pakai dalam Hitungan Hari, Bukan Minggu |
| Subheadline | I'm Rifaldi, a web developer who turns a brief into a live site, fast. Need something bigger, like a dashboard or web app? I build those too. Based in Indonesia, working with clients worldwide. | Saya bikin landing page dari brief sampai live, cepat dan rapi. Butuh dashboard atau web app yang lebih kompleks? Saya juga bisa bantu. |
| CTA primer | See the Work | Lihat Hasil Kerja |
| CTA sekunder / footer | Email Me About Your Project | Kirim Brief via Email |
| Byline badge | Rifaldi Radya Pratama · Web Developer | Rifaldi Radya Pratama · Web Developer |
| Baris meta (di bawah CTA) | Available for new projects · Based in Indonesia · Works remotely · EN / ID | Menerima project baru · Berbasis di Indonesia · Kerja remote · EN / ID |
| Label panel bukti | Latest work · {judul project} · Visit ↗ | Karya terbaru · {judul project} · Lihat ↗ |

Headline memakai dua penekanan visual: kata "Days"/"Hari" diberi highlighter amber, dan "Not Weeks"/"Bukan Minggu" ditulis dengan warna teks muted. Item "Available for new projects" hanya tampil jika statusnya benar (diatur lewat satu flag konfigurasi, lihat SDD); jika dimatikan, baris meta tetap tampil tanpa item itu.

**Service block (dua tier)**

| Tier | EN | ID |
| --- | --- | --- |
| Utama (label "Main focus" / "Fokus utama") | **Landing Page Development** — Fast, conversion-focused pages, ready to go live in days. | **Landing Page Development** — Cepat, fokus konversi, siap tayang dalam hitungan hari. |
| Sekunder (label "For bigger projects" / "Untuk proyek lebih besar") | **Web Apps & Dashboards** — For needs that go beyond a single page. | **Web App & Dashboard** — Untuk kebutuhan yang lebih kompleks dari sekadar landing page. |

Tile utama juga memuat alur kerja tiga langkah (bukan janji angka, hanya urutan):

| Langkah | EN (judul · keterangan) | ID (judul · keterangan) |
| --- | --- | --- |
| 1 | Brief · You send the goal | Brief · Kamu kirim tujuannya |
| 2 | Build · I design and code | Pengerjaan · Saya desain dan coding |
| 3 | Live · Online, ready to share | Live · Online, siap dibagikan |

**About & CTA akhir**

| Elemen | EN | ID |
| --- | --- | --- |
| Label section | 03 About | 03 Tentang |
| Judul (H2) | Who you'll work with | Siapa yang akan bekerja denganmu |
| Lead (paragraf pertama, besar) | Draft: I'm Rifaldi, a web developer who **[builds websites professionally as a full-time job]**, and takes on freelance landing pages for founders and small businesses. | Draft: Saya Rifaldi, web developer yang **[sehari-hari bekerja full-time membangun website]**, dan menerima project landing page freelance untuk founder dan bisnis kecil. |
| Body | Draft: My approach is simple: take your brief, turn it into a fast, clean page, and **[get it live in days, not weeks]**. You get one person from first message to launch, so nothing gets lost between a designer, a developer, and a project manager. | Draft: Cara kerja saya sederhana: terima brief, ubah jadi halaman yang cepat dan rapi, lalu **[tayang dalam hitungan hari, bukan minggu]**. Kamu berurusan dengan satu orang dari pesan pertama sampai launch, jadi tidak ada yang hilang di antara desainer, developer, dan project manager. |
| Blok fakta | Based in: Indonesia (GMT+7) · Works with: Clients worldwide, remotely · Focus: Landing pages, web apps & dashboards · Languages: English, Indonesian · Stack: tag teks | Berbasis di: Indonesia (GMT+7) · Bekerja dengan: Klien dari mana saja, secara remote · Fokus: Landing page, web app & dashboard · Bahasa: Indonesia, Inggris · Stack: tag teks |
| Label CTA akhir | 04 Contact | 04 Kontak |
| Judul CTA (H2) | Have a page to **launch**? | Punya halaman yang mau **diluncurkan**? |
| Kalimat arahan | Send a short brief: what the page is for and when you need it. I'll reply with the next steps. | Kirim brief singkat: halamannya untuk apa dan kapan dibutuhkan. Saya akan balas dengan langkah selanjutnya. |
| Opsi kedua | or copy {email} · Copy email | atau salin {email} · Salin email |

Teks dalam **[kurung tebal]** = kalimat kunci yang diberi highlight amber (maks. 2 per section About); teks **tebal** di judul CTA = kata dengan highlighter. Lead dan body adalah draft dari sesi desain; Pal tetap wajib merevisinya.

**Copy yang masih harus ditulis sebelum launch** (Pal, draft → review): finalisasi lead + body About (total 80–150 kata per bahasa setelah ada blok fakta, jujur soal pengalaman kerja profesional sebagai web developer tanpa menyebut klien yang kena NDA, maks. 2 kalimat kunci yang di-highlight), deskripsi singkat 2 project, dan teks cookie consent banner.

## 5. Information architecture & site map

v1 punya 4 halaman publik (2 bahasa × 2 halaman) dan 4 layar admin. EN tinggal di root, ID di prefix `/id`.

&#91;embedded content: site map v1 · 4 halaman publik, 4 layar admin\]

Setiap halaman EN berpasangan dengan versi ID lewat hreflang dan toggle bahasa. Admin tidak dwibahasa, tidak masuk sitemap, dan diblok dari index (`noindex`).

Di luar diagram ada 2 halaman utilitas: kebijakan privasi `/privacy` dan `/id/privacy` (dibutuhkan F8), ditautkan dari footer.

**Urutan section homepage (EN dan ID identik):** Navbar (logo/nama, link Work, toggle EN|ID, tombol Email) → Hero (kolom kiri: byline badge, headline, subheadline, CTA, baris meta; kolom kanan: panel bukti project featured) → `01` Service block dua tier + alur Brief → Build → Live → `02` Selected work (maksimal 6 project published, grid ke bawah; tombol "View all work" ke `/work`) → `03` About (lead, body, blok fakta) → `04` CTA akhir (dipusatkan, ruang lega) → footer bawah (Privacy, Cookie settings, LinkedIn, copyright).

Setiap section setelah hero diawali label bernomor kecil (`01 Services`, `02 Work`, `03 About`, `04 Contact`) di atas garis tipis. Label ini bagian dari header section, bukan section baru.

## 6. Fitur MVP v1

MVP = 9 fitur. Semuanya must-have; kalau satu dicabut, portfolio gagal membuktikan promise atau gagal di-maintain.

| ID | Fitur | Persona | Prioritas |
| --- | --- | --- | --- |
| F1 | Homepage (hero, service block, featured work, about, footer) | P1, P2 | P0 |
| F2 | Halaman Work (semua project) | P1, P2 | P0 |
| F3 | Project card + link keluar ke situs live | P1, P2 | P0 |
| F4 | Bilingual routing EN/ID + toggle + banner saran bahasa | P1, P2 | P0 |
| F5 | CTA email | P1, P2 | P0 |
| F6 | Admin login single-user | P3 | P0 |
| F7 | Admin CRUD project (field EN+ID, upload gambar, featured, publish) | P3 | P0 |
| F8 | GA4 + cookie consent banner | P3 (insight), P1 (privasi) | P0 |
| F9 | Fondasi SEO (meta, hreflang, sitemap, robots, schema Person) | Semua | P0 |

### F1 — Homepage

**Story:** Sebagai klien Upwork, saya mau langsung paham apa yang ditawarkan dan melihat bukti kerja tanpa scroll jauh, supaya bisa memutuskan menghubungi atau tidak.

- [ ] Urutan section sesuai bagian 5; headline + CTA primer terlihat di atas fold pada layar 375 × 667 px, termasuk saat banner cookie tampil.
- [ ] CTA "See the Work" scroll halus ke section Selected work (bukan pindah halaman).
- [ ] Selected work menampilkan project `published = true`, urut `sort_order` naik, maksimal 6, dalam grid ke bawah (1 / 2 / 3 kolom seperti halaman Work), tanpa scroll ke samping dan tanpa animasi geser otomatis. Jika total project published > 6, tombol berbunyi "View all work ({total})".
- [ ] Flag `featured` hanya menentukan project di panel hero (maks. 3); tidak memengaruhi isi grid Selected work.
- [ ] Tombol "View all work" di bawah featured menuju `/work` (atau `/id/work`).
- [ ] Foto profil tampil sebagai badge kecil (64–80 px) di samping nama; kalau foto belum ada, tampil inisial "RR" di lingkaran aksen.
- [ ] Konten dibaca dari database saat build/revalidate, bukan hardcode, kecuali copy statis hero/service/about.
- [ ] Panel bukti di hero menampilkan project `featured = true` dan `published = true` (urut `sort_order`, maks. 3) dalam frame browser: URL, status "Live", thumbnail 16:10, caption "Latest work · {judul} · Visit ↗". Frame dan link "Visit" membuka `live_url` di tab baru.
- [ ] Jika ada ≥ 2 project featured, panel berganti otomatis tiap 6 detik (crossfade), dengan tombol 01/02/03 berprogress bar dan tombol pause/play. Rotasi berhenti sementara saat panel di-hover atau mendapat fokus keyboard, dan tidak berjalan sama sekali jika `prefers-reduced-motion: reduce`.
- [ ] Jika hanya 1 project featured, panel statis tanpa kontrol; jika 0, panel disembunyikan dan hero menjadi satu kolom.
- [ ] Section About memuat lead, body dengan maks. 2 kalimat kunci ber-highlight, dan blok fakta (lokasi + zona waktu, cara kerja, fokus, bahasa, stack sebagai tag teks).
- [ ] CTA akhir dipusatkan dengan ruang vertikal minimal 112 px (mobile) / 176 px (desktop) di atas dan bawahnya; tidak ada elemen lain yang bersaing di area itu.

### F2 — Halaman Work

**Story:** Sebagai klien, saya mau lihat semua project di satu tempat.

- [ ] Menampilkan semua project `published = true`, urut `sort_order` naik.
- [ ] Grid 1 kolom (mobile), 2 kolom (≥ 768 px), 3 kolom (≥ 1200 px).
- [ ] Empty state kalau 0 project: pesan singkat + CTA email (tidak pernah halaman kosong).
- [ ] Tanpa filter/kategori di v1.

### F3 — Project card

**Story:** Sebagai klien, saya mau melihat situs live-nya langsung untuk verifikasi kualitas.

- [ ] Card berisi: thumbnail (rasio 16:10), judul, deskripsi singkat (maks. 160 karakter), tag tech stack (maks. 4), tombol "Visit live site" / "Lihat situs".
- [ ] Link keluar membuka tab baru dengan `rel="noopener noreferrer"` dan ikon external link.
- [ ] Semua teks card mengikuti bahasa halaman aktif; alt text gambar juga per bahasa.
- [ ] Klik link keluar tercatat sebagai event GA4 `project_link_click` (dengan slug project dan posisi klik: panel hero atau kartu), hanya jika consent analytics diberikan.

### F4 — Bilingual EN/ID

**Story:** Sebagai klien lokal, saya mau membaca situs dalam Bahasa Indonesia tanpa kehilangan posisi.

- [ ] EN di `/` dan `/work`; ID di `/id` dan `/id/work`. Kedua versi selalu bisa diakses langsung tanpa redirect paksa.
- [ ] Toggle "EN | ID" di navbar, bahasa aktif ditandai; klik membawa ke halaman padanan (`/work` ↔ `/id/work`), bukan ke homepage.
- [ ] Pilihan bahasa disimpan di cookie `lang_pref` (365 hari).
- [ ] Banner saran: muncul hanya jika user berada di versi EN, header `Accept-Language` mengandung `id`, dan cookie `lang_pref` belum ada. Isi: "Also available in Indonesian" + tombol "Lihat versi Indonesia" + tombol tutup. Klik apa pun menyimpan `lang_pref`, banner tidak muncul lagi.
- [ ] Tidak ada auto-redirect berbasis IP atau `Accept-Language`; crawler selalu mendapat konten sesuai URL.
- [ ] Atribut `<html lang>` = `en` atau `id` sesuai halaman.

### F5 — CTA email

**Story:** Sebagai klien yang tertarik, saya mau menghubungi Rifaldi dengan satu klik.

- [ ] Semua CTA email membuka `mailto:hello@rifaldiradya.com` dengan subject terisi (EN: "Project inquiry from rifaldiradya.com"; ID: "Tanya project dari rifaldiradya.com").
- [ ] Alamat email juga tampil sebagai teks yang bisa disalin + tombol "Copy email" dengan feedback "Copied" (untuk user tanpa mail client).
- [ ] Klik tercatat sebagai event GA4 `contact_email_click` (dengan lokasi: hero/navbar/footer), jika consent diberikan.
- [ ] Tidak ada form kontak dan tidak ada data pengunjung yang disimpan di server.

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

- [ ] List project: thumbnail kecil, judul EN, status (Published/Draft), badge Featured, tombol Edit, urut `sort_order`.
- [ ] Form create/edit dengan field: judul (EN, ID), deskripsi singkat (EN, ID), alt text thumbnail (EN, ID), URL live, tag tech stack, upload thumbnail, featured (on/off), published (on/off), sort order.
- [ ] Validasi: judul EN+ID wajib; deskripsi EN+ID wajib maks. 160 karakter; URL wajib dan harus `https://`; thumbnail wajib sebelum bisa publish; alt text EN+ID wajib jika ada thumbnail.
- [ ] Upload thumbnail: JPG/PNG/WebP, maks. 5 MB, disimpan di layanan storage eksternal (bukan filesystem server), dengan preview sebelum simpan.
- [ ] Pesan error menyebut cara memperbaikinya (mis. "URL must start with https://").
- [ ] Delete butuh konfirmasi dialog; gambar terkait ikut dihapus dari storage.
- [ ] Setelah simpan/hapus, halaman publik ter-update maksimal 60 detik tanpa redeploy.
- [ ] Form admin nyaman dipakai di HP (input ≥ 16 px, satu kolom di < 768 px).

### F8 — GA4 + cookie consent

**Story:** Sebagai Pal, saya mau tahu apakah portfolio bekerja, tanpa melanggar privasi pengunjung EU.

- [ ] Banner consent muncul pada kunjungan pertama dengan dua pilihan setara: "Accept" dan "Reject" (+ link kebijakan privasi singkat).
- [ ] Google Consent Mode v2 dengan default `analytics_storage = denied`; GA4 tidak menyimpan cookie sebelum Accept.
- [ ] Pilihan disimpan di cookie `consent` (180 hari); link "Cookie settings" di footer untuk mengubah pilihan.
- [ ] Event terlacak: `page_view`, `contact_email_click`, `project_link_click`, `language_switch`.
- [ ] Admin tidak dilacak.
- [ ] Halaman kebijakan privasi singkat per bahasa (`/privacy`, `/id/privacy`), `noindex` tidak diperlukan.

### F9 — Fondasi SEO

Detail lengkap di bagian 9. Acceptance ringkas:

- [ ] Title dan meta description unik per halaman per bahasa.
- [ ] hreflang `en`, `id`, dan `x-default` (→ EN) di semua halaman publik.
- [ ] `sitemap.xml` dan `robots.txt` digenerate otomatis; admin tidak masuk sitemap.
- [ ] JSON-LD `Person` + `WebSite` di homepage.
- [ ] Open Graph + Twitter card per halaman (gambar OG 1200 × 630).

## 7. Out of scope v1 (roadmap setelahnya)

Semua item di bawah sengaja ditunda. Trigger = kondisi yang membuat item layak dikerjakan.

| Item | Kenapa ditunda | Trigger untuk dikerjakan |
| --- | --- | --- |
| Halaman case study per project | Butuh konten mendalam; 2 landing page belum cukup bahannya | Ada ≥ 1 project dengan hasil terukur yang bisa diceritakan |
| Filter/kategori di halaman Work | Tidak berguna untuk 2 project | Project ≥ 6–8 dengan jenis beragam |
| Tombol/halaman CV | CV belum ada, audiens v1 klien bukan recruiter | CV ATS-friendly selesai |
| Form kontak dengan penyimpanan data | Email sudah cukup; form menambah data pribadi + spam handling | Volume inquiry naik atau butuh brief terstruktur |
| Project dashboard/web app di library | Belum ada project yang boleh ditampilkan | Project web app pertama selesai |
| Link profil Upwork | Akun Upwork belum dibuat | Profil Upwork aktif |
| Testimoni | Belum ada klien freelance | Klien pertama memberi testimoni tertulis |
| Blog/artikel | Beban konten besar, bukan kebutuhan konversi v1 | Portfolio stabil dan ada waktu konten rutin |
| Layanan lain (SEO, design, dll.) | Belum ada bukti kerja | Ada project nyata di layanan tersebut |
| Foto profesional | Belum tersedia; v1 pakai inisial | Foto siap, tinggal ganti aset |
|  |  |  |

## 8. Arah UI/UX & visual identity

Arah visual: **minimalis-profesional, light mode, warm off-white + satu aksen deep amber**, mobile-first. Tujuannya terlihat niat dan cepat, dan jelas bukan template AI (tanpa biru/indigo default, tanpa font Inter/Roboto, tanpa layout hero-tengah generik).

**Prinsip desain**

1. **Service first, persona second.** Hero didominasi headline + bukti kerja; foto hanya badge kecil.
2. **Bukti lebih keras dari klaim.** Situs live sudah terlihat di hero (panel bukti) sebelum pengunjung scroll; project card dan link live tetap elemen paling menonjol setelah headline.
3. **Cepat itu terasa.** Tidak ada loader, video background, library animasi, atau parallax berbasis JavaScript. Satu-satunya konten yang berganti otomatis adalah panel bukti di hero, dengan aturan ketat (lihat Motion). Situs yang ngebut adalah bukti promise.
4. **Satu aksen, peran terbatas.** Amber hanya dipakai untuk: CTA primer, state aktif (toggle bahasa, link aktif, border tile utama), penanda (highlighter di headline hero, judul CTA akhir, dan maks. 2 kalimat kunci di About), serta garis progres alur Brief → Build → Live. Hijau (`--color-success`) hanya untuk status "Live" dan "Available".

**Warna (token semantik, OKLCH)**

| Token | Nilai awal | Peran |
| --- | --- | --- |
| `--color-bg` | oklch(98.5% 0.008 85) | Background halaman (warm off-white) |
| `--color-surface` | oklch(96% 0.012 85) | Section berselang, area service block |
| `--color-surface-raised` | oklch(100% 0 0) | Card project, modal, banner |
| `--color-border` | oklch(88% 0.015 80) | Garis tipis, border card |
| `--color-text` | oklch(22% 0.02 60) | Teks utama (warm near-black) |
| `--color-text-muted` | oklch(45% 0.02 60) | Teks sekunder, caption |
| `--color-accent` | oklch(52% 0.15 50) | CTA primer, state aktif (deep amber) |
| `--color-accent-hover` | oklch(47% 0.14 48) | Hover/pressed CTA |
| `--color-accent-soft` | oklch(93% 0.05 75) | Highlight headline, badge "Main focus" |
| `--color-danger` | oklch(55% 0.18 28) | Hanya di admin: error |
| `--color-success` | oklch(55% 0.13 150) | Publik: titik status "Live"/"Available" dan langkah "Live"; admin: sukses simpan |

Semua kombinasi teks wajib lolos WCAG AA (≥ 4,5:1 body, ≥ 3:1 teks besar); nilai di atas adalah titik awal dan harus dicek dengan contrast checker saat implementasi, terutama teks putih di atas `--color-accent`.

**Tipografi**

| Peran | Font | Ukuran mobile / desktop | Line-height |
| --- | --- | --- | --- |
| Display (H1 hero) | Space Grotesk 600, tracking −0.03em | 40 / 68 px | 1.05 |
| Display CTA akhir (H2) | Space Grotesk 600, tracking −0.025em | 36 / 60 px | 1.08 |
| Heading 2 (judul section) | Space Grotesk 600 | 28 / 36 px | 1.2 |
| Heading 3 (judul card, tile sekunder) | Space Grotesk 600 | 20 / 22 px | 1.3 |
| Judul tile utama | Space Grotesk 600 | 24 / 30 px | 1.2 |
| Lead About | Space Grotesk 600 | 20 / 26 px | 1.4 |
| Body | IBM Plex Sans 400 | 17 / 18 px (subheadline hero 19 px desktop) | 1.6 |
| Small / caption / tag / baris meta | IBM Plex Sans 500 | 14 px | 1.4 |
| Label section (eyebrow) & label fakta | IBM Plex Sans 500, UPPERCASE, tracking 0.08em | 13 px | 1.4 |

Font di-self-host (woff2, subset Latin) lewat `next/font`, bukan link Google Fonts runtime. Heading pakai `text-wrap: balance`, lead About `text-wrap: pretty`, body dibatasi 65ch (lead About 62ch).

**Layout, spacing & bentuk**

- Spacing scale 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. Jarak antar section 64 px (mobile) / 96 px (desktop).
- Kontainer maks. 1200 px, gutter 16 px (mobile) / 32 px (desktop).
- Breakpoint: base 375 px → 768 → 1024 → 1200.
- Radius: card 12 px, tombol 10 px, badge/pill 999 px. Shadow tipis berlapis bernuansa hangat, bukan hitam pekat; saat hover card memakai shadow sedikit lebih dalam.
- **Hero** asimetris rata kiri (bukan center). Di ≥ 1024 px dua kolom (rasio 1.1 : 1, gap 56 px): kiri = byline badge (sedikit offset), H1, subheadline, CTA, baris meta; kanan = panel bukti rata kanan, lebar maks. 560 px. Di < 1024 px satu kolom, panel bukti turun ke bawah baris meta. Padding hero 24/64 px (mobile) dan 72/112 px (desktop).
- **Header section**: garis 1 px `--color-border` di atas, lalu label bernomor (angka warna teks, label muted), lalu H2; jarak ke konten 32 px.
- **Services**: tile 3 : 2 di ≥ 768 px; tile utama berborder amber 1,5 px + shadow, tile sekunder transparan berborder tipis.
- **About**: di ≥ 1024 px grid 1 : 2 (kiri label + H2, kanan lead, body, blok fakta); blok fakta 2 kolom di ≥ 768 px, tiap item dipisah garis atas tipis, baris "Stack" selebar penuh.
- **CTA akhir**: rata tengah (satu-satunya blok rata tengah di halaman), padding vertikal 112 px (mobile) / 176 px (desktop), tanpa tekstur atau dekorasi lain selain highlighter di judul; tombol primer lebih besar (tinggi 52 px). Footer bawah dipisah garis tipis.

**Signature motif**

- **Highlighter amber**: blok `--color-accent-soft` miring tipis di belakang kata kunci. Dipakai di tiga tempat saja: "Days"/"Hari" di H1, kata "launch"/"diluncurkan" di judul CTA akhir, dan maks. 2 kalimat kunci di About (versi marker setengah tinggi teks).
- **Tekstur grid di hero**: grid garis 32 px warna `--color-border` transparan, memudar ke tepi dengan radial mask; murni CSS, hanya di hero.
- **Panel bukti**: frame browser (bar dengan 3 titik, URL, status "Live") dengan kartu bayangan bertumpuk di belakangnya (offset 10 px), berisi thumbnail project featured.
- **Status dot hijau berdenyut** di "Available", "Live" (panel dan kartu), dan langkah "Live": titik 8 px dengan cincin yang membesar lalu memudar, menegaskan bahwa ini situs nyata.
- **Label section bernomor** `01`–`04` dengan garis tipis di atasnya, memberi ritme editorial.
- **Byline badge**: lingkaran 64 px (mobile) / 72 px (desktop), foto atau inisial "RR", + nama + "Web Developer", seperti tanda tangan penulis.

**Komponen inti:** Navbar (sticky, mengecil saat scroll), LanguageToggle, LanguageSuggestBanner, Button (primary/secondary/ghost + loading/disabled), BylineBadge, MetaRow, StatusDot, HeroProofPanel (frame + pengganti project + kontrol), SectionHeader (label bernomor + H2), ServiceTile, ProcessSteps, ProjectCard, AboutFacts, EmptyState, FooterCta, CookieConsentBanner, Footer. Admin: LoginForm, ProjectTable/List, ProjectForm (tab EN/ID), ImageUploader, Toggle, ConfirmDialog, Toast.

**Motion** (easing default `cubic-bezier(0.23, 1, 0.32, 1)`; hanya `transform`, `opacity`, dan satu `background-size` kecil; tanpa library):

| Elemen | Pemicu | Detail |
| --- | --- | --- |
| Tombol | tekan | `scale(0.98)`, 160 ms |
| Card project, frame panel bukti | hover | naik 2–3 px + shadow lebih dalam, 240 ms; thumbnail kartu `scale(1.03)` 400 ms |
| Panah ↗ / → di link | hover | geser 2–3 px, 200 ms |
| Highlighter H1 | sekali saat load | tergambar dari kiri (`scaleX` 0 → 1), 700 ms, delay 250 ms |
| Panel bukti | otomatis, tiap 6 s | crossfade 450 ms + `scale(1.015 → 1)`; URL dan judul memudar 200 ms; progress bar tombol aktif terisi linear selama 6 s |
| Status dot | terus-menerus | cincin `scale(1 → 2,8)` + `opacity(0,5 → 0)`, 2,2 s, infinite |
| Tekstur grid hero | scroll | bergeser turun 96 px selama 100vh pertama (parallax halus) |
| Kartu bayangan panel (≥ 1024 px) | scroll | bergeser dari −10 px ke +22 px selama 100vh pertama |
| Garis header section | masuk viewport | tergambar dari kiri (`scaleX`) |
| Tile service, kartu project, isi About | masuk viewport | naik 24 px + fade in; elemen kedua sedikit tertunda |
| Garis alur Brief → Build → Live | masuk viewport | terisi amber dari kiri |
| Highlight About & judul CTA akhir | masuk viewport | tergambar dari kiri |

Aturan motion:

- Animasi berbasis scroll memakai CSS scroll-driven animations (`animation-timeline: scroll()/view()`) di dalam `@supports`; browser tanpa dukungan menampilkan versi statis yang utuh. Tidak ada listener scroll JavaScript untuk animasi.
- H1, subheadline, dan panel bukti **tidak boleh** di-fade-in saat load (menunda LCP); hanya highlighter yang dianimasikan.
- `prefers-reduced-motion: reduce` mematikan semua animasi dan transisi, termasuk rotasi otomatis panel dan denyut titik; kontrol 01/02/03 tetap bisa dipakai.
- Rotasi panel wajib punya tombol pause/play (WCAG 2.2.2) dan berhenti sementara saat hover atau fokus keyboard di dalam panel.

**Mobile-first (wajib):** didesain dari 375 px dulu. Navbar mobile: nama + toggle bahasa + tombol email ikon (tanpa hamburger, karena cuma 2 link). Target sentuh ≥ 44 × 44 px dengan jarak ≥ 8 px. Service tile, project card, dan blok fakta menumpuk 1 kolom. Di baris meta, "Available" menempati baris sendiri. Panel bukti di bawah baris meta, dengan kartu bayangan tidak keluar dari gutter. Tidak ada horizontal scroll di lebar berapa pun.

## 9. Requirement SEO & bilingual (i18n)

SEO v1 = level **standard**: fondasi teknis yang benar untuk 2 bahasa, on-page per halaman, structured data personal brand, dan kesiapan untuk AI search. Link building dan konten blog di luar v1.

**Struktur URL & bahasa**

- Subfolder, bukan subdomain atau query param: EN di root, ID di `/id`. Slug tetap sama di kedua bahasa (`/work`, `/id/work`) supaya pemetaan padanan sederhana.
- Setiap halaman publik: `<link rel="canonical">` ke dirinya sendiri (bukan ke versi EN).
- hreflang dua arah + `x-default` → versi EN, di `<head>` dan di sitemap.
- Tidak ada redirect otomatis berbasis bahasa/lokasi (lihat F4); crawler dan manusia melihat konten yang sama untuk URL yang sama.

**Meta per halaman (draft, final di App Flow)**

| Halaman | Title (≤ 60 karakter) | Meta description (≤ 155 karakter) |
| --- | --- | --- |
| `/` | Rifaldi Radya Pratama — Fast Landing Page Developer | Landing pages that launch in days, not weeks. Web developer based in Indonesia, working with clients worldwide. See live work. |
| `/work` | Work — Landing Pages by Rifaldi Radya Pratama | Live landing pages built by Rifaldi Radya Pratama. Click through to see real, working sites. |
| `/id` | Rifaldi Radya Pratama — Jasa Landing Page Cepat | Landing page siap pakai dalam hitungan hari, bukan minggu. Web developer dari Indonesia. Lihat hasil kerjanya langsung. |
| `/id/work` | Hasil Kerja — Landing Page oleh Rifaldi Radya Pratama | Kumpulan landing page yang sudah live, dibuat oleh Rifaldi Radya Pratama. Klik dan lihat situs aslinya. |

**Keyword hipotesis** (belum divalidasi dengan tool riset keyword; cek volume via Google Keyword Planner/Search Console setelah 30 hari):

- EN: "freelance landing page developer", "fast landing page development", "hire landing page developer" + nama pribadi.
- ID: "jasa pembuatan landing page", "jasa landing page cepat", "jasa bikin landing page" + nama pribadi.
- Target realistis v1: ranking untuk **nama sendiri** (branded search) dan dipakai sebagai link bukti di Upwork. Ranking keyword generik kompetitif butuh konten + backlink di fase berikutnya.

**On-page**

- Satu H1 per halaman (headline hero di homepage), hierarki H2/H3 berurutan.
- Semua gambar via `next/image`: WebP/AVIF, ukuran responsif, `width`/`height` eksplisit (anti-CLS), lazy-load kecuali gambar di atas fold, alt text per bahasa.
- HTML semantik: `header`, `nav`, `main`, `section`, `footer`; link keluar ke project live pakai anchor text deskriptif.
- Open Graph + Twitter card per halaman per bahasa, `og:locale` = `en_US` / `id_ID` dengan `og:locale:alternate`.

**Structured data (JSON-LD)**

- Homepage: `Person` (name, url, jobTitle "Web Developer", email, knowsAbout: landing page development, web development, Next.js; `sameAs`: `https://www.linkedin.com/in/rifaldi-radya-070a44174/`; Upwork/GitHub ditambahkan saat profilnya siap) + `WebSite` (name, url, inLanguage).
- Halaman Work: `CollectionPage` dengan `ItemList` project (name, url situs live).
- Isi schema harus sama dengan konten yang terlihat di halaman.

**Teknis crawl & index**

- Rendering: halaman publik dirender statis (SSG) dengan revalidasi on-demand saat admin menyimpan, jadi HTML lengkap tersedia untuk crawler.
- `sitemap.xml` otomatis: 4 halaman publik + 2 halaman privacy, masing-masing dengan `xhtml:link` alternate hreflang dan `lastmod` dari update project terakhir.
- `robots.txt`: allow semua, disallow `/admin` dan `/api`, cantumkan URL sitemap. Crawler AI (GPTBot, ClaudeBot, PerplexityBot) diizinkan supaya profil bisa dikutip di AI search.
- Admin: `noindex, nofollow` via meta dan header.
- Halaman 404 custom per bahasa dengan link balik ke homepage dan Work.
- HTTPS wajib. Versi kanonik: `https://rifaldiradya.com` (non-www); `www.rifaldiradya.com` dan `http://` redirect 301 ke versi kanonik dengan path yang sama.

**Siap AI search (GEO dasar):** paragraf About ditulis faktual dan mudah dikutip: siapa, lokasi (Indonesia), layanan, stack, cara kontak, dalam kalimat utuh, bukan hanya ikon.

**Setelah launch:** verifikasi domain di Google Search Console, submit sitemap, cek coverage kedua bahasa dan laporan hreflang; cek Rich Results Test untuk schema.

## 10. Non-functional requirements

| Area | Requirement | Cara verifikasi |
| --- | --- | --- |
| Performance | Lighthouse mobile ≥ 90; LCP < 2,5 s, INP < 200 ms, CLS < 0,1; JS halaman publik seminimal mungkin (server components, tanpa library animasi); animasi hanya CSS (bagian 8), JS client panel bukti ≤ 2 KB gzip; gambar panel bukti pertama dimuat prioritas, gambar slide berikutnya dimuat setelah halaman idle | PageSpeed Insights di 4 halaman publik + Performance panel DevTools (tidak ada long task dari animasi) |
| Aksesibilitas | WCAG 2.2 AA: kontras, focus ring terlihat (`:focus-visible`), navigasi keyboard penuh, elemen native (`button`, `a`), target sentuh ≥ 44 px, `prefers-reduced-motion` dihormati, skip link ke konten | Lighthouse ≥ 95 + uji keyboard manual + axe DevTools |
| Responsif | Layout benar di 360, 375, 768, 1024, 1440 px; tanpa horizontal scroll | Uji manual di DevTools + 1 HP Android/iOS nyata |
| Browser | 2 versi terakhir Chrome, Safari (termasuk iOS), Firefox, Edge | Uji manual |
| Keamanan | HTTPS; password admin di-hash (bcrypt/argon2); sesi cookie httpOnly + secure; rate limit login; validasi input server-side; upload dibatasi tipe & ukuran; secret hanya di environment variable, tidak pernah di repo; security headers (CSP, X-Frame-Options, Referrer-Policy) | Review kode + cek header via securityheaders.com |
| Privasi | Tidak menyimpan data pribadi pengunjung di server; GA4 hanya aktif setelah consent; kebijakan privasi per bahasa | Uji: tolak consent → tidak ada cookie `_ga` |
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
| Penyimpanan gambar | Storage eksternal (kandidat: Cloudinary free tier), bukan filesystem server, supaya aman dari redeploy | Final prinsipnya; vendor dikunci di SDD |
| Database | Database terkelola kecil untuk data project + akun admin (kandidat dibandingkan di SDD: MySQL bawaan Hostinger vs Postgres terkelola seperti Supabase/Neon) | Diputuskan di SDD |
| Analytics | Google Analytics 4 + Consent Mode v2 | Final |
| Font | Space Grotesk + IBM Plex Sans, self-host via `next/font` | Final |
| Waktu kerja | 5–10 jam/minggu di luar kerja full-time | Final |
| Data sensitif | Hanya kredensial admin (hash) dan secret API; tidak ada data pembayaran; tidak ada data pribadi pengunjung selain cookie analytics berbasis consent | Final |

**Catatan penting dari dokumentasi Hostinger:** alur deploy Node.js membuat slot website baru untuk domain. Kalau rifaldiradya.com sudah terdaftar sebagai website (mis. WordPress) di paket hosting, website itu harus dihapus dulu sebelum deploy app Node.js di domain yang sama ([Hostinger docs](https://docs.hostinger.com/node.js/creating-an-app)). Cek dulu apakah subdomain `staging0`/`staging1` ikut terdampak sebelum menghapus apa pun.

Alur GitHub → build otomatis dan paket yang didukung: [Hostinger GitHub integration](https://docs.hostinger.com/node.js/github), [panduan deploy Next.js resmi Hostinger](https://github.com/hostinger/deploy-nextjs).

## 12. Dependensi konten (harus siap sebelum launch)

Portfolio gagal kalau kodenya jadi tapi isinya kosong. Semua item ini tanggung jawab Pal dan bisa dikerjakan paralel dengan coding.

- [ ] Copy About EN + ID (lead + body 80–150 kata per bahasa, maks. 2 kalimat kunci ber-highlight, transcreation, faktual) + isi blok fakta (zona waktu, bahasa, stack).
- [x] Status "Available for new projects" diputuskan: **on** saat launch (diputuskan 28 Sep 2026).
- [ ] Untuk tiap project (staging0, staging1): judul EN/ID, deskripsi singkat ≤ 160 karakter EN/ID, tag tech stack, screenshot thumbnail 1600 × 1000 px (16:10), alt text EN/ID.
- [ ] Diputuskan: 2 project demo sementara tetap di subdomain `staging*` untuk v1; ganti nama yang lebih meyakinkan bisa menyusul (nama "staging" terkesan belum jadi di mata klien).
- [ ] Gambar Open Graph 1200 × 630 px untuk EN dan ID.
- [ ] Favicon + ikon aplikasi (dari inisial "RR" dengan warna aksen).
- [ ] Teks kebijakan privasi singkat EN + ID (apa yang dilacak GA4, cara menolak, kontak).
- [ ] Teks cookie consent banner EN + ID.
- [ ] Foto profil (opsional untuk launch; v1 pakai inisial).
- [ ] Akun Google Analytics 4 + Google Search Console atas nama sendiri.
- [x] Konfigurasi email hello@rifaldiradya.com aktif dan lolos SPF/DKIM/DMARC, supaya balasan ke klien tidak masuk spam (dicek 28 Sep 2026; DMARC masih `p=none`).

## 13. Risiko, asumsi & open questions

**Risiko**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Portfolio hanya 2 landing page, terkesan tipis | Klien Upwork ragu | Copy jujur dan spesifik; kualitas > kuantitas; tambah project via admin begitu selesai |
| Scope creep (admin, bilingual, GA4) memperlambat launch | Rencana transisi 6 bulan mundur | Scope v1 dikunci di dokumen ini; item baru masuk tabel bagian 7 |
| Deploy Node.js di Hostinger bentrok dengan website WordPress lama di domain yang sama | Downtime atau subdomain demo terganggu | Cek daftar website di hPanel dulu; backup; uji di subdomain sementara sebelum pindah ke domain utama |
| Build di Hostinger gagal karena versi Node/konfigurasi | Deploy tertunda | Kunci versi Node di `package.json` (`engines`), uji build lokal sebelum push |
| Konten (About, deskripsi, screenshot) belum siap saat kode selesai | Launch tertunda | Kerjakan konten paralel sejak minggu pertama (bagian 12) |
| Copy terjemahan mesin terasa kaku | Trust turun, terutama di EN | Wajib revisi manual; minta 1 orang fasih EN membaca sebelum launch |
| Layanan gratis (storage/DB) mengubah kuota | Upload/admin gagal | Pilih vendor dengan free tier jauh di atas kebutuhan; halaman publik tetap statis |

**Asumsi**

- Paket Business Hostinger menampilkan menu Node.js Apps di hPanel akun Pal.
- Pal mengelola akun GitHub sendiri dan repo bisa private.
- Tidak ada klien atau kerjaan kantor yang ditampilkan (menghindari masalah NDA).
- Trafik awal kecil (< 1.000 kunjungan/bulan), jadi tier gratis semua layanan cukup.

**Open questions**

- [x] Apakah rifaldiradya.com saat ini masih terpasang sebagai website WordPress di Hostinger? **Ya, masih WordPress**, dan **tidak ada kontennya yang dibutuhkan** (dikonfirmasi 28 Sep 2026). WordPress tetap di-backup sebagai jaring pengaman, lalu diganti di Fase 4 setelah versi uji lolos QA (SDD bagian 10).
- [ ] Subdomain demo tetap `staging0/1` untuk v1 (diputuskan). Ganti nama nanti cukup edit URL project di admin.
- [x] Versi kanonik: **`rifaldiradya.com` (non-www)**, disetujui 28 Sep 2026.
- [x] Link sosial di footer: **LinkedIn** `https://www.linkedin.com/in/rifaldi-radya-070a44174/` (diputuskan 28 Sep 2026). GitHub menyusul jika diinginkan.
- [x] Zona waktu di blok fakta About: **GMT+7 (WIB)**, dikonfirmasi 28 Sep 2026.

## 14. Rencana rilis & milestone

Target: v1 live sekitar **4 minggu** setelah dokumen perencanaan selesai, dengan asumsi 5–10 jam/minggu (total kira-kira 20–40 jam). Ini estimasi, bukan komitmen; gate di bawah lebih penting daripada tanggal.

&#91;embedded content: rencana rilis v1 · 4 fase, 2 gate, 1 jalur konten paralel\]

Pipeline deploy diuji di minggu pertama dengan halaman kosong, supaya masalah Hostinger ketahuan sebelum fitur dibangun. Launch hanya jika semua acceptance criteria di bagian 6 tercentang dan metrik bagian 3 terpenuhi.

**Urutan dokumen perencanaan:** PRD (dokumen ini) → App Flow Document (layar, navigasi, flow langkah demi langkah, state, edge case, kontrak data/API) → SDD (arsitektur, pilihan DB/storage final, struktur repo, aturan kerja dengan coding AI). Eksekusi kode dilakukan terpisah dengan setup vibe-coding-builder.
