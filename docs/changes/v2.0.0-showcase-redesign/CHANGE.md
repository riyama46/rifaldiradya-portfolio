---
change: v2.0.0-showcase-redesign
app: rifaldiradya.com
tier: full
bump: major
base_version: 1.0.1
status: approved
date: 2026-10-17
---

# Change v2.0.0 — Showcase software engineer (redesign)

> **Cara baca (untuk coding AI).** Dokumen ini adalah *delta* terhadap `docs/specs/` v1.0.0. Yang tidak disebut di sini tetap seperti v1. Kalau dokumen ini bertentangan dengan `docs/specs/`, dokumen ini yang menang. Rujukan visual dan interaksi: `docs/design/v2/option-b.html` (situs publik) dan `docs/design/v2/admin.html` (admin). **Aturan rujukan:** kalau mockup berbeda dengan dokumen ini, dokumen ini yang menang; kalau dokumen ini diam, ikuti mockup. Urutan build ada di `tasks.md` di folder yang sama.
>
> **Base version:** v1.0.0. Kalau PATCH v1.0.x (mis. ganti URL LinkedIn) dirilis lebih dulu, base menjadi versi PATCH itu; delta di sini tidak berubah.

## Why

Arah situs berubah: dari menjual landing page ke klien Upwork menjadi **showcase software engineer full-stack .NET untuk recruiter dan hiring manager**, dengan klien proyek sebagai audiens kedua. Pal sedang aktif melamar, dan pengunjung datang dari LinkedIn, Upwork, dan Fiverr, kebanyakan lewat HP.

Situs dirancang sebagai **funnel**: setiap bab mengarah ke satu aksi, yaitu menghubungi lewat email untuk posisi full-time atau proyek, dengan Download CV sebagai jalur kedua untuk recruiter.

Positioning: software engineer full-stack .NET (C#, ASP.NET, SQL Server, Azure). Sejak Nov 2022 membangun dan menjaga HRMS yang dipakai 13 perusahaan grup PT Panasonic Manufacturing Indonesia. Panasonic boleh disebut. Layar HRMS internal dan tidak ditampilkan.

Lane MAJOR karena positioning, audiens, information architecture, homepage, halaman Work, dan model data project berubah, termasuk `live_url` yang tidak lagi wajib.

## Scope

**In (v2.0.0)**

- Positioning, persona, copy EN/ID baru (sumber copy: objek `T` di `option-b.html`, dengan pengecualian di bagian Decisions).
- Home 5 bab dengan scroll snap: Hero → Selected work (dipin, maks. 5) → About → Highlight SSO → Contact.
- Halaman Work baru: judul besar, filter grup, baris case yang bisa dibuka (`/work#case-<slug>`).
- Tema gelap/terang dengan toggle, tanpa flash saat load.
- Motion CSS scroll-driven per bab, dengan fallback tumpukan statis.
- Funnel email: mailto dengan subject dan isi terisi untuk 4 jenis (umum, posisi, proyek, walkthrough), tombol Copy email kecil, Download CV (PDF).
- Model data project baru (grup, meta, isi case EN/ID, tombol case, visual, saklar Selected work) dan `live_url` opsional; admin S-11/S-13/S-14 sesuai `admin.html`.
- Availability: saklar tampil/sembunyi di admin Profile.
- SEO (meta, JSON-LD, OG) dan event analytics baru.

**Out (non-goals v2.0.0)**

- **Ditunda ke v2.1.0 (MINOR, sudah direncanakan di `docs/changes/v2.1.0-pointer-layer/CHANGE.md`):** kursor kustom (titik + cincin berlabel Read/Visit), cahaya yang mengikuti kursor, preview di samping kursor (screenshot atau kartu angka), tilt screenshot, dan preview live di form admin. Di v2.0.0 desktop tampil seperti versi layar sentuh di mockup.
- Highlight, pendidikan, dan sertifikasi lewat admin (tetap di kamus i18n, diubah lewat PATCH).
- Teks availability lewat admin (tetap di kamus i18n; admin hanya saklar).
- Link GitHub tampil (field disiapkan, tidak dirender selama kosong).
- Halaman case study terpisah per proyek, form kontak, blog, testimoni.
- Menghapus kolom database apa pun.

## Decisions

Keputusan D-01 s.d. D-13 disepakati di sesi desain 15–17 Okt 2026; D-14 dst. disepakati di sesi planner 17 Okt 2026. Builder menyalin semua baris ini ke `docs/decisions/DECISIONS.md` saat merge (format: tanggal · keputusan · alasan, ditandai `[v2.0.0]`).

- **D-01 — Positioning.** Software engineer full-stack .NET, showcase untuk recruiter dan klien proyek, situs sebagai funnel ke email. · Ditolak: tetap jualan landing page (tidak sesuai karier sekarang). · Konsekuensi: PRD §1–§4 ditulis ulang; non-goal v1 "recruiter" dicabut.
- **D-02 — Arah visual "Opsi B".** Gaya bouayaben.com: banyak white space, satu adegan per layar. · Ditolak: "Hex & Orange" (gaya nikolaradeski.com) dan "Forest & Ochre"; file-nya sudah dihapus.
- **D-03 — Font dan aksen.** Archivo saja. Aksen cobalt (`#7b93ff` gelap, `#2f4fe0` terang) di satu kata miring per judul. Mode gelap dan terang dengan toggle. · Ditolak: oranye (16 Okt), lime, mint, Inter.
- **D-04 — Home 5 bab dengan scroll snap.** Hero → Selected work (dipin, 5 langkah, penghitung 01/05, rail nama proyek) → About → Highlight SSO → Contact. · Ditolak: satu adegan per proyek tanpa pengelompokan.
- **D-05 — Halaman Work.** Judul besar "Work", filter (All, Panasonic, Websites, AI tools), baris yang dibuka untuk melihat case (What it is, What I did, Stack, Status, tombol). · Ditolak: halaman case study terpisah per proyek (baris cukup, tanpa route baru).
- **D-06 — Judul proyek di Selected work bisa diklik** ke case-nya (`/work#case-<slug>`). Hover: garis aksen menyapu dari kiri, panah masuk. · Ditolak: tautan "Read the case" terpisah (terlalu ramai).
- **D-07 — Funnel.** "Email me" di bar dan hero, kalimat jembatan setelah Highlight, Contact dengan dua tombol mailto (posisi full-time / proyek) yang subject dan isinya terisi. Proyek internal punya tombol "Email to ask for a walkthrough". · Ditolak: form kontak (tetap tanpa penyimpanan data pengunjung, sama seperti v1).
- **D-08 — Motion.** Parallax per bab (lapisan titik dan cahaya), fokus blur/fade per bab, statement About terisi baris per baris, "five passwords" dicoret lalu angka menghitung, progress bar. Semua CSS scroll-driven (`view()`/`scroll()`), dengan fallback tumpukan biasa untuk browser lama dan reduced motion. · Ditolak: parallax global yang hampir tidak terlihat.
- **D-09 — Pengecualian JS untuk lapisan pointer (melanggar aturan v1 "CSS only").** Kursor kustom, cahaya yang mengikuti kursor dengan warna per bab, preview di samping kursor, tilt screenshot; hanya untuk mouse (`hover: hover` dan `pointer: fine`). **Status: disetujui, dibangun di v2.1.0** (lihat D-27). Di v2.0.0 cahaya per bab berjalan dengan CSS saja untuk semua perangkat, persis perilaku layar sentuh di mockup.
- **D-10 — H1 hero (direvisi).** H1 tetap punya animasi masuk naik 900 ms, **tanpa fade**: hanya `transform`, `opacity` 1 sejak frame pertama. · Ditolak: fade 900 ms seperti mockup (elemen dengan opacity 0 tidak dihitung sebagai LCP sampai terlihat, jadi fade bisa menggeser LCP hampir 1 detik); fade pendek 300 ms. · Konsekuensi: aturan v1 "tanpa fade-in di H1" tetap berlaku; animasi naik diizinkan.
- **D-11 — Kartu angka (direvisi).** Proyek tanpa screenshot memakai kartu angka (angka nyata + caption, mis. "13 · group companies on one HR system"). Datanya disimpan mulai v2.0.0; di mockup kartu angka hanya muncul di preview samping kursor, jadi **tampil di situs mulai v2.1.0**. Di v2.0.0 proyek bervisual kartu angka tampil tanpa gambar di Selected work (sama seperti mockup di layar sentuh). · Ditolak: screenshot HRMS yang diblur (bisa ditambah nanti).
- **D-12 — `live_url` opsional.** Tombol di case dipilih per proyek: buka situs / email minta walkthrough / tanpa tombol. · Ditolak: `live_url` wajib (proyek internal tidak bisa tampil).
- **D-13 — Bahasa admin tetap EN saja.** Copy situs tetap di kamus i18n repo.
- **D-14 — Download CV masuk v2.0.0.** Satu PDF statis, varian "Software Engineer" (CV v1.0, 16 Okt 2026), versi web **tanpa nomor HP**, bahasa Inggris untuk halaman EN dan ID. Tautan di Contact dan About. Diganti lewat PATCH. · Alasan: recruiter adalah persona primer dan biasanya mencari CV dulu; positioning .NET tidak bisa dibuktikan lewat proyek yang bisa diklik (HRMS internal), jadi CV dan walkthrough yang menutup celah itu. · Ditolak: CV lewat admin (berubah hanya saat karier berubah); varian "AI Software Engineer" (dipakai untuk lamaran tertentu saja).
- **D-15 — Highlight, pendidikan, sertifikasi tetap di kamus i18n.** · Alasan: hanya berubah saat karier berubah; prinsip brief "konten yang berubah setiap ada pekerjaan baru masuk admin, sisanya PATCH". · Ditolak: Highlight "pilih satu proyek + 3 angka" di admin; edukasi/sertifikasi di admin (tabel, form, migrasi untuk sesuatu yang berubah setahun sekali).
- **D-16 — Availability: saklar di admin, teks di i18n.** S-14 punya saklar "Show availability"; teks EN/ID tetap di kamus. · Alasan: situs menyebut Panasonic dan "Open to full-time roles"; Pal perlu bisa menyembunyikan baris itu dalam hitungan detik dari HP tanpa deploy. Teksnya jarang berubah. · Menyimpang dari `admin.html` (yang punya field teks EN/ID); dokumen ini yang menang. · Menggantikan flag v1 `availableForWork` di `lib/site-config.ts`.
- **D-17 — Tombol Copy email dipertahankan, kecil, hanya di Contact.** · Alasan: mailto sering gagal di laptop tanpa mail client; recruiter dari LinkedIn banyak memakai webmail. Komponen v1 sudah ada. · Menyimpang dari mockup (tidak ada Copy email).
- **D-18 — Urutan Selected work diatur lewat admin.** Saklar `show_on_home` + urutan ↑/↓ yang sama dengan v1; tidak ada urutan di kode. Isi awal yang disarankan (konten, bukan kode): HR System, Single Sign-On, rifaldiradya.com, SwiftPay, Bloom Studio; Teams Approvals hanya di halaman Work. · Alasan: Teams Approvals berstatus "Proposal, not live" dan angkanya proyeksi, sedangkan rifaldiradya.com adalah bukti full-stack yang benar-benar live.
- **D-19 — Tautan sosial.** LinkedIn = `https://www.linkedin.com/in/rifaldiradya` (menggantikan URL v1). Field GitHub disiapkan di `lib/site-config.ts` tetapi **kosong = tidak dirender**, sampai profil GitHub punya repo publik yang layak (bukan sekadar repo tugas kuliah). · Alasan: profil publik saat ini hanya punya satu repo lama; recruiter yang membuka profil kosong membaca sinyal negatif.
- **D-20 — Meta line dipecah dua field.** `meta` (kolom tengah baris Work) dan `side` (kolom kanan baris Work: tahun, status, atau alat utama). Label di Selected work = `meta · side`. · Alasan: di mockup, label home (`w*.m`) dan baris Work (`r*.m` + `r*.y`) berbeda, sedangkan `admin.html` hanya punya satu field "Meta line"; dua field ini menghasilkan kedua tampilan tanpa duplikasi. · Konsekuensi: label home SSO menjadi "Panasonic · about 200 staff · 2023" (mockup: "Panasonic · Live since early 2023"); diterima.
- **D-21 — `live_url` jadi nullable: pengecualian aturan "migrasi hanya menambah".** · Alasan: proyek internal tidak punya URL. · Konsekuensi: rollback kode ke v1 setelah ada proyek tanpa URL tidak aman tanpa restore database; prosedur rollback v2 = revert merge **dan** restore backup database yang dibuat tepat sebelum rilis (lihat Delta SDD §10).
- **D-22 — `show_on_home` kolom baru; `featured` dipensiunkan.** Kolom `featured` tetap ada (aturan tidak menghapus kolom), tidak dibaca dan tidak ditulis kode v2, ditandai deprecated di skema. · Ditolak: memakai ulang kolom `featured` dengan makna baru (nama kolom menyesatkan dan kode v1 yang di-rollback akan menafsirkannya sebagai panel hero).
- **D-23 — Penyimpanan tema.** `localStorage` key `rr-theme` (`dark` | `light`). Urutan penentuan sebelum paint: query `?theme=` (untuk tangkapan layar/QA) → pilihan tersimpan → setelan perangkat (`prefers-color-scheme`) → `dark`. · Alasan: preferensi tampilan, tidak dikirim ke server, sama dengan mockup. Bukan "state penting" menurut G4.
- **D-24 — Baris case memakai `<details>`/`<summary>` native.** JS hanya untuk filter grup, membuka baris dari hash URL, dan event. · Alasan: baris tetap bisa dibuka tanpa JS (E-07), lebih sedikit JS, aksesibel bawaan. · Menyimpang dari markup mockup (`button` + `aria-expanded`); tampilan dan perilaku sama.
- **D-25 — Subject email walkthrough menyebut proyeknya.** EN "Walkthrough: {title}", ID "Walkthrough: {title}". · Alasan: tombol yang sama dipakai di HR System, SSO, dan Teams Approvals; mockup memakai "HRMS walkthrough" untuk semuanya.
- **D-26 — Meta description tidak menyebut status ketersediaan.** · Alasan: kalau availability disembunyikan lewat admin (D-16), meta yang ter-cache di Google tetap akan menyebut "open to roles".
- **D-27 — Rilis dibagi v2.0.0 dan v2.1.0.** v2.0.0 berisi semua yang menentukan struktur, data, dan tampilan; v2.1.0 (MINOR) hanya menambah lapisan pointer JS dan preview admin. · Alasan: Pal sedang aktif melamar, jadi situs perlu live lebih cepat; mayoritas pengunjung memakai HP sehingga tidak melihat lapisan pointer; lapisan itu satu komponen terisolasi dan risiko terbesar untuk INP/Lighthouse dan QA lintas browser. Atribut `data-cursor` dan token cahaya per bab sudah dipasang di v2.0.0, jadi v2.1.0 tidak membongkar apa pun.
- **D-28 — Dokumen desain.** Tidak ada `DESIGN_SPEC.md` terpisah (konvensi v1: visual di PRD §8). PRD §8 v2 merujuk token dan komponen dari mockup v2; nilai token tercatat di Delta PRD §8.

## Delta: PRD

### MODIFIED

- **Header dan judul.** "PRD — rifaldiradya.com Portfolio v2". Previously: v1. Why: versi mayor.
- **§1 Ringkasan produk.** Baru: portfolio bilingual (EN default, ID sekunder) yang menampilkan Pal sebagai software engineer full-stack .NET, dengan bukti utama HRMS 13 perusahaan grup Panasonic; situs adalah funnel ke email (posisi full-time atau proyek) plus Download CV; admin single-user tetap untuk mengelola proyek. Problem: recruiter dan hiring manager membandingkan banyak kandidat dalam beberapa detik, kebanyakan di HP; pekerjaan utama Pal bersifat internal sehingga tidak bisa diklik, jadi situs harus menjelaskannya dengan angka nyata, isi case, CV, dan tawaran walkthrough. Previously: menjual landing page cepat ke klien Upwork. Why: D-01.
- **§2 Persona.** Baru:
  - P1 Recruiter / hiring manager (primer): EN atau ID, datang dari LinkedIn/Upwork/Fiverr, mayoritas HP; mencari peran, stack, skala sistem, bukti, cara menghubungi; aksi: baca hero → Selected work/Work → Download CV atau "Email about a full-time role".
  - P2 Klien proyek (sekunder): butuh sistem HR atau aplikasi internal; aksi: "Email about a project".
  - P3 Admin (Pal): tetap.

  Previously: P1 klien Upwork, P2 klien lokal, recruiter di luar target. Why: D-01.
- **§3 Goals.** Baru: (1) recruiter paham peran, stack, dan skala kerja Pal dari layar pertama di HP; (2) setiap bab mengarah ke email atau CV; (3) pekerjaan internal bisa dinilai tanpa layarnya (angka nyata, isi case, walkthrough); (4) Pal bisa menambah dan mengatur proyek, termasuk proyek tanpa URL, tanpa menyentuh kode; (5) SEO dua bahasa tidak turun. Previously: goals Upwork. Why: D-01.
- **§3 Non-goals.** Baru: form kontak dan penyimpanan data pengunjung; halaman case study per proyek; blog, testimoni; lapisan pointer dan preview admin (v2.1.0); multi-user admin. Dicabut: "menarik recruiter/HR" dan "CV dipisah dari situs". Why: D-01, D-14, D-27.
- **§3 Success metrics.** Baru (selain metrik teknis v1 yang tetap: Lighthouse mobile ≥ 90, a11y & SEO ≥ 95, 4 halaman terindex, tambah proyek < 5 menit):

  | Metrik | Target | Cara ukur |
  | --- | --- | --- |
  | Email posisi full-time yang berujung interview | ≥ 1 dalam 60 hari setelah rilis v2.0.0 | Dicatat manual oleh Pal |
  | `contact_email_click` per `kind` | Baseline 30 hari pertama | GA4 |
  | `cv_download` | Baseline 30 hari pertama (sinyal awal minat recruiter) | GA4 |
  | Core Web Vitals | LCP < 2,5 s · INP < 200 ms · CLS < 0,1 | PageSpeed / Search Console |

  Previously: klik CTA email sebagai satu-satunya metrik konversi. Why: D-01, D-14.
- **§4 Positioning, promise & copy (ditulis ulang).** Positioning: D-01. Sumber copy final EN/ID = objek `T` di `option-b.html`, dipindah ke `i18n/en.json` dan `i18n/id.json` dengan key baru (lihat Delta APP_FLOW §11). Pengecualian terhadap `T`: D-10 (tidak ada perubahan teks), D-16 (teks availability tetap di i18n), D-17 (label Copy email), D-25 (subject walkthrough), dan copy baru yang tidak ada di mockup: Download CV, Copy email, meta SEO (Delta PRD §9). Aturan copy: tanpa em dash, tanpa pola "Not X. Y.", tanpa kata klise, tombol menyebut persis apa yang terjadi, EN dan ID ditulis terpisah (transcreation), tanpa angka atau testimoni karangan, angka proyeksi selalu ditulis "projected"/"perkiraan". Ringkasan:

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
  | Download CV (baru) | Download CV (PDF) | Unduh CV (PDF) |
  | Copy email (tetap dari v1) | Copy email → Copied | Salin email → Tersalin |

  Angka dan sumbernya (CV v1.0, Drive `01_Personal Docs/Current/Career`, dicek ulang 17 Okt 2026): 13 perusahaan grup, Pal memegang 6; ratusan staf HR/admin, ribuan data karyawan, ±2.000 di site utama; SSO 4–5 password → 1 untuk ±200 staf, live sejak awal 2023; Teams approval ±57 → 4 menit **proyeksi** (tahap usulan); tim 3 orang. Previously: copy landing page v1 (tabel hero, service block, About, CTA akhir). Why: D-01.
- **§5 Information architecture.** URL tetap: `/`, `/work`, `/privacy`, `/id`, `/id/work`, `/id/privacy`, `/admin/*`. Home: bar → Hero `#top` → Selected work `#work` → About `#about` → Highlight `#highlight` → Contact `#contact` → footer. Work: bar → judul + filter + baris case (`#case-<slug>`) → Contact penutup `#more` → footer. Tanpa label section bernomor. Previously: navbar → hero dua kolom → 01 Services → 02 Selected work → 03 About → 04 CTA. Why: D-04, D-05.
- **§6 F1 Homepage.** Acceptance baru:
  - [ ] Urutan bab sesuai §5; tiap bab satu layar (`100svh`) dengan scroll snap `y proximity`; reduced motion → snap dimatikan.
  - [ ] Layar pertama di 390 × 844 dan 375 × 667 memuat label peran, H1, dan tombol "Email me", termasuk saat banner consent tampil.
  - [ ] Baris availability hanya tampil bila `availability_on` (S-14) aktif.
  - [ ] Selected work menampilkan proyek `published AND show_on_home`, urut `sort_order`, maks. 5, dengan penghitung "0n / 0N" dan rail nama proyek; judul proyek menaut ke `/work#case-<slug>` (locale aktif).
  - [ ] Proyek dengan `case_action = site` menampilkan tautan "Open the live site ↗"; proyek bervisual screenshot menampilkan screenshot yang menaut ke `live_url` bila ada, selain itu ke case.
  - [ ] About: statement, dua paragraf, Pendidikan, Sertifikasi, tautan Download CV.
  - [ ] Highlight SSO: statement dengan "five passwords" dicoret, tiga angka (5 → 1, ~200, 13), catatan HRMS internal, kalimat jembatan ke Contact.
  - [ ] Contact: dua tombol mailto (role, project), email sebagai tautan + tombol Copy email, LinkedIn, Download CV, jam GMT+7; GitHub hanya bila terisi (D-19).

  Previously: hero dua kolom dengan HeroProofPanel berotasi, service block, grid 6 kartu, CTA akhir dipusatkan. Why: D-04, D-06, D-07.
- **§6 F2 Halaman Work.** Acceptance baru:
  - [ ] H1 "Work" dengan jumlah proyek published.
  - [ ] Filter All / Panasonic / Websites / AI tools (dengan jumlah per grup); filter hanya di klien, tanpa JS semua baris tampil.
  - [ ] Semua proyek published sebagai baris (judul · meta · side), urut `sort_order`.
  - [ ] Baris dibuka untuk melihat What it is, What I did (1–8 poin), Stack, Status, dan tombol sesuai `case_action`.
  - [ ] `/work#case-<slug>` membuka dan menggulir ke baris itu.
  - [ ] Bab Contact penutup "Have a project like *these?*".

  Previously: grid kartu, tanpa filter. Why: D-05.
- **§6 F3 Project card → Case row.** Kartu v1 diganti baris case (F2) dan item Selected work (F1); tag tech stack menjadi "Stack" (maks. 6). Previously: kartu dengan thumbnail, deskripsi, tag, tombol "Visit live site". Why: D-05, D-06.
- **§6 F5 Kontak.** Acceptance baru:
  - [ ] Semua tombol email adalah `mailto:hello@rifaldiradya.com` dengan subject dan body terisi per jenis: `general` (bar, hero), `role`, `project` (Contact), `walkthrough` (case dengan `case_action = walkthrough`, subject menyebut judul proyek), per bahasa halaman (Delta APP_FLOW §11).
  - [ ] Copy email hanya di Contact (D-17).
  - [ ] Download CV di About dan Contact.
  - [ ] Event `contact_email_click` dengan `kind`, `cv_download` (bila consent).
  - [ ] Tidak ada form dan tidak ada data pengunjung di server (tetap).

  Previously: satu jenis mailto, tombol Copy di footer. Why: D-07, D-14, D-17.
- **§6 F7 Admin CRUD.** Field baru dan aturan publish mengikuti Delta APP_FLOW S-12/S-13; Featured diganti "Show in Selected work" (maks. 5); urutan ↑/↓ tetap. Previously: field v1 + featured maks. 3. Why: D-12, D-18, D-22.
- **§6 F8 GA4.** Event: `page_view`, `contact_email_click` (dengan `kind`), `project_link_click` (placement baru), `case_open`, `theme_switch`, `cv_download`, `language_switch`. Key event: `contact_email_click` dan `cv_download`. Previously: 4 event. Why: funnel D-07.
- **§7 Out of scope.** Diperbarui: dicabut dari daftar tunda (sekarang masuk v2.0.0): filter Work, isi case per proyek, tombol CV, recruiter. Tetap ditunda: halaman case study per URL, form kontak, testimoni, blog, layanan non-engineering, link Upwork/Fiverr. Ditambah: lapisan pointer + preview admin → v2.1.0 (trigger: v2.0.0 live; sudah direncanakan); link GitHub (trigger: profil GitHub punya repo publik yang layak); screenshot HRMS diblur (trigger: Pal mendapat izin dan ingin mengganti kartu angka).
- **§8 Arah visual (diganti penuh).** Arah "Opsi B" (D-02): hitam/putih hangat dengan banyak ruang, satu adegan per layar, aksen cobalt hanya di satu kata miring per judul, tombol primer, garis/hover aksen, dan cahaya bab. Rujukan nilai: blok `:root` di `option-b.html`, dipindah apa adanya ke lapisan token (Delta SDD §8):

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

  Tipografi: Archivo (400, 500, 600, italic 500/600), self-host lewat `next/font`. Motion: D-08 dan D-10; tabel motion lengkap mengikuti mockup. Komponen: Delta SDD §4. Previously: cream/amber, Space Grotesk + IBM Plex, highlighter, label bernomor, status dot berdenyut. Why: D-02, D-03.
- **§9 SEO.** Meta baru (panjang sudah dihitung):

  | Halaman | Title | Description |
  | --- | --- | --- |
  | `/` | Rifaldi Radya Pratama, Software Engineer (Full-Stack .NET) | Software engineer building the HR system 13 Panasonic group companies run on. C#, ASP.NET, SQL Server and Azure. Based in Jakarta, Indonesia. |
  | `/work` | Work: HR Systems, Websites, AI Tools \| Rifaldi Radya Pratama | HR systems inside Panasonic, websites and AI tools by Rifaldi Radya Pratama. Open a row for what it is, what I did and the stack. |
  | `/id` | Rifaldi Radya Pratama, Software Engineer (Full-Stack .NET) | Software engineer yang membangun sistem HR 13 perusahaan grup Panasonic. C#, ASP.NET, SQL Server, dan Azure. Berbasis di Jabodetabek. |
  | `/id/work` | Karya: Sistem HR, Website, Alat AI \| Rifaldi Radya Pratama | Sistem HR di Panasonic, website, dan alat AI karya Rifaldi Radya Pratama. Buka satu baris untuk melihat apa itu, yang saya kerjakan, dan stack-nya. |

  Meta tidak menyebut availability (D-26). JSON-LD `Person`: `jobTitle` "Software Engineer", `worksFor` PT Panasonic Manufacturing Indonesia, `knowsAbout` C#, ASP.NET, SQL Server, Microsoft Azure, Next.js, TypeScript; `sameAs` LinkedIn baru (+ GitHub bila terisi). Halaman Work: `ItemList` memakai `live_url` bila ada, selain itu URL case `…/work#case-<slug>`. Keyword hipotesis: "software engineer .NET Jakarta", "full-stack .NET developer", "ASP.NET developer Indonesia" + nama. Previously: meta landing page, `jobTitle` "Web Developer", LinkedIn lama. Why: D-01, D-19.
- **§10 NFR Performance.** JS klien halaman publik (di luar runtime Next.js dan GA4) hanya: toggle tema, filter + hash Work, Copy email, jam GMT+7, consent, banner bahasa; target gabungan ≤ 6 KB gzip. LCP = teks H1. Animasi scroll hanya CSS; tidak ada listener `scroll`. Previously: ≤ 2 KB untuk panel hero. Why: D-08, D-27.
- **§10 NFR Privasi.** Tetap tanpa data pengunjung di server. Tambahan: `localStorage` `rr-theme` (preferensi tampilan, tidak dikirim ke mana pun), disebut di halaman Privacy. Why: D-23.
- **§11 Constraints.** Font: Archivo. Previously: Space Grotesk + IBM Plex Sans. Why: D-03.
- **§12 Dependensi konten (v2).**
  - [ ] Isi 7 proyek di admin staging (teks EN/ID dari `T` di mockup: `w*`, `r*`, `c*`, `peek.*`), atur `show_on_home` dan urutan (D-18).
  - [ ] PDF CV versi web: varian Software Engineer tanpa nomor HP, diekspor dari DOCX, dibersihkan metadata generator, nama `rifaldi-radya-pratama-cv.pdf`.
  - [ ] Foto profil ≥ 640 × 640 px diunggah ulang di S-14 (yang sekarang 320 px).
  - [ ] Konfirmasi akhir teks hero dan About.
  - [ ] Opsional: screenshot HRMS diblur.
- **§13 Risiko.** Tambah:
  - Rekan kerja melihat "Open to full-time roles" → saklar availability (D-16) dan meta tanpa availability (D-26).
  - Scroll-driven animation berbeda di Safari/Firefox → fallback tumpukan statis + QA wajib.
  - Rollback setelah ada proyek tanpa URL → restore backup DB (D-21).
  - Blur/filter dan font menurunkan skor mobile → gate Lighthouse diuji di staging sebelum rilis.

  Hapus risiko "portfolio hanya 2 landing page" (diganti 7 proyek). Ubah asumsi "Tidak ada klien atau kerjaan kantor yang ditampilkan" menjadi: pekerjaan Panasonic boleh disebut (dikonfirmasi Pal); layar internal tidak ditampilkan.
- **§14 Rilis.** v2.0.0 dirakit di `staging`, dirilis lewat PR `staging` → `main`; v2.1.0 menyusul sebagai MINOR. Urutan di `tasks.md`.

### REMOVED

- HeroProofPanel (rotasi), BylineBadge, MetaRow, service block dua tier, alur Brief → Build → Live, highlighter amber, label section bernomor, status dot berdenyut, tekstur grid hero, CTA akhir dipusatkan. Why: D-02, D-04.
- F3 project card v1. Why: diganti baris case (D-05).
- Flag `availableForWork` di site-config. Why: D-16.

### ADDED

- Tema gelap/terang dengan toggle (D-03, D-23).
- Halaman Work dengan filter dan baris case (D-05).
- Download CV (D-14).
- Highlight SSO (D-04).
- Data kartu angka, tampil di v2.1.0 (D-11).

## Delta: APP_FLOW

### MODIFIED

- **§1 Konvensi.** Fitur PRD `F1–F9` tetap (F3 sekarang = baris case). Edge case baru mulai E-25.
- **§1 G2 Layout shell publik.** Baru:
  1. skip link;
  2. bar sticky (nama → home, Work, About, toggle EN|ID O-01, toggle tema O-04, tombol "Email me" mailto `general`; di < 768 px mengikuti mockup);
  3. progress bar baca tipis di atas (CSS `scroll()`);
  4. `<main>`;
  5. footer kecil: © tahun, Privacy, Cookie settings (O-03), "Back to top ↑" (home) / "Back to home ↑" (Work);
  6. O-02, O-03.

  Setiap bab punya lapisan dekoratif `aria-hidden` (titik + cahaya) dan atribut `data-zone` untuk warna cahaya. Previously: navbar + footer dengan blok CTA akhir. Why: D-04.
- **§1 G3 Admin shell.** Tambah toggle tema (O-04) di header admin; nama "Rifaldi Radya Pratama Admin". Lainnya tetap.
- **§1 G4 Cookies & storage.** Tambah baris: `localStorage` `rr-theme` (`dark`|`light`, diset O-04). Tidak ada cookie baru.
- **§1 G5 Konten dinamis vs statis.** Dari database: semua field proyek (Delta §9) dan `availability_on`. Dari kamus i18n: hero, About, pendidikan, sertifikasi, Highlight, Contact, mailto, label UI. Dari repo (statis): PDF CV di `public/cv/`.
- **§2 Inventaris layar.** S-01, S-02 ditulis ulang (di bawah). Tambah O-04 Toggle tema (publik + admin, client). Overlay O-01..O-03 tetap.
- **§3 Peta navigasi.** Pintu keluar penting: mailto (4 jenis), Download CV, situs live (bila ada), LinkedIn. Judul proyek di S-01 → S-02 `#case-<slug>`. Admin tetap tidak ditautkan dari publik.
- **§4 S-01 Homepage (ditulis ulang).**

  | # | Bab | Elemen (urut) | Aturan |
  | --- | --- | --- | --- |
  | 1 | Hero `#top` | foto bulat (avatar S-14, tanpa foto → inisial "RR") → label `[hero.role]` + `[hero.loc]` → baris availability (titik + `[hero.open]`) bila `availability_on` → H1 dua baris `[hero.l1]` / `[hero.l2]` (satu kata `<em>` aksen) → `[hero.sub]` → baris Stack → tombol "Email me" (`general`) → tautan "Scroll ↓" ke `#work` | H1 naik 900 ms tanpa fade (D-10); tidak ada gambar prioritas selain avatar kecil dengan `width`/`height` eksplisit; LCP = H1. |
  | 2 | Selected work `#work` | H2 `[work.h]` + penghitung "0n / 0N" → item proyek: label `0n / 0N · {meta} · {side}`, H3 judul (tautan ke case, panah →), deskripsi (`summary`), tautan "Open the live site ↗" bila `case_action = site`, screenshot bila `visual_type = screenshot` → rail nama proyek (anchor `#w1..#wN`) → "See all work →" ke S-02 | Data: `published AND show_on_home`, urut `sort_order`, maks. 5. Dipin: tiap item satu langkah scroll (sticky + snap); tanpa dukungan scroll-driven atau reduced motion → daftar bertumpuk biasa. 0 item → E-25. Tautan dan screenshot memakai atribut `data-cursor` (`read`/`visit`) untuk v2.1.0. |
  | 3 | About `#about` | H2 `[about.h]` → statement `[about.s]` (terisi baris per baris saat scroll) → `[about.p1]`, `[about.p2]` → Pendidikan (`e1..e3`) → Sertifikasi → tautan Download CV | Statement tanpa dukungan scroll-driven tampil penuh. |
  | 4 | Highlight `#highlight` | label `[case.meta]` → statement `[case.t]` (bagian `<s>` dicoret saat masuk) → 3 angka (5 → 1, ~200, 13; angka menghitung naik via CSS) + label → catatan `[case.blur]` → kalimat jembatan `[bridge.q]` + tautan `[bridge.go]` ke `#contact` | Angka asli selalu ada di DOM (teks `sr`) sehingga pembaca layar dan browser tanpa dukungan membaca nilai akhir. |
  | 5 | Contact `#contact` | label `[ct.label]` → H2 `[ct.h]` → `[ct.pitch]` → tombol `role` (primer) + `project` (sekunder) → baris jangkauan: email (mailto `general`) + Copy email, LinkedIn ↗, Download CV, GitHub ↗ (bila terisi), jam `HH:mm GMT+7` → footer | Jam: teks statis "GMT+7" sebelum JS; setelah mount `HH:mm` zona `Asia/Jakarta`, `tabular-nums`, tanpa layout shift. |

  Dihapus: HeroProofPanel, ProjectCard di home, Services, CTA akhir. Previously: lihat v1 S-01. Why: D-04, D-06, D-07, D-14.
- **§4 S-02 Work (ditulis ulang).**
  1. Label `[wp.label]` → H1 `[nav.work]` + jumlah proyek published (`<sup>`) → `[wp.sub]`.
  2. Filter `[wp.filter]` (grup `role="group"`): tombol All / Panasonic / Websites / AI tools dengan jumlah; aktif ditandai `aria-pressed`. Tanpa JS filter tidak dirender dan semua baris tampil. Grup kosong tidak punya tombol.
  3. Daftar `<ol>` baris: `<details id="case-<slug>">` dengan `<summary>` berisi judul · meta · side · ikon +/−; isi: What it is (`case_is`), What I did (`<ul>` dari `case_did`), Stack (`tags` digabung " · "), Status, lalu tombol sesuai `case_action`: `site` → "Open the live site ↗" (`live_url`, tab baru); `walkthrough` → "Email to ask for a walkthrough" (mailto `walkthrough` dengan judul proyek); `none` → tanpa tombol.
  4. Hash `#case-<slug>` saat load atau saat hash berubah → buka baris itu, gulir ke sana, fokus ke `<summary>`, kirim `case_open` (`source: hash`). Membuka baris lewat klik → `case_open` (`source: row`). Filter yang menyembunyikan baris target di-reset ke All.
  5. Bab Contact penutup `#more` dengan H2 `[ct.h.more]` "Have a project like *these?*" dan dua tombol mailto; footer dengan "Back to home ↑".
  6. Data: `published=true`, urut `sort_order`, tanpa limit. 0 proyek → E-01 (teks baru, tombol ke Contact).

  Previously: grid ProjectCard tanpa filter. Why: D-05, D-24.
- **§4 S-03 Privacy.** Tambah: penyimpanan `rr-theme` di browser; PDF CV adalah file statis tanpa pelacakan selain event `cv_download` bila consent. Teks EN/ID ditulis ulang mengikuti aturan copy v2.
- **§4 S-04 Not found.** Gaya v2; isi dan perilaku tetap.
- **§5 Overlay.** O-01 dipindah ke bar v2 (perilaku tetap). O-02/O-03 gaya v2, posisi dan logika tetap.
- **§6 S-11 Project list.** Kolom: # posisi · Visual (thumbnail 64 × 40 atau angka kartu) · Judul EN + meta kecil · Grup · Status (Published/Draft) · Tampil (Homepage / Work page only) · Diperbarui · ↑/↓ · Edit. Info: "{n} projects · {p} published · {d} drafts", "Selected work on the homepage: {k} of 5. Turn one off before adding another." (kuning bila k = 5), "The order here is the order on the site. Use ↑ and ↓ to move a project." Filter grup (client-only, tidak mengubah urutan). Dihapus: info featured dan E-08 (featured > 3). Previously: kolom v1 + badge Featured.
- **§6 S-12 / S-13 Form proyek (ditulis ulang).** Bagian dan field:

  | # | Bagian | Field | Tipe UI | Validasi | Wajib untuk Publish |
  | --- | --- | --- | --- | --- | --- |
  | 1 | Basics | Title EN / ID | text + counter | 1–80 | ya |
  | 2 | Basics | Group | segmented: Panasonic / Websites / AI tools | enum `panasonic`\|`web`\|`ai` | ya (default `web`) |
  | 3 | Basics | Meta line EN / ID | text + counter | 1–40, mis. "Panasonic · 13 companies" | ya |
  | 4 | Basics | Side EN / ID | text + counter | 0–20, mis. "2022–now", "WordPress"; bantuan: "Right column on the Work page, and the end of the homepage label." | tidak |
  | 5 | Homepage | Short description EN / ID | textarea + counter | 1–160 (kolom `summary`) | ya |
  | 6 | Homepage | Show in Selected work | switch | maks. 5 proyek dengan saklar on (termasuk draft); ke-6 → E-26 | tidak |
  | 7 | Case | What it is EN / ID | textarea + counter | 1–220 | ya |
  | 8 | Case | What I did EN / ID | daftar baris (+ Add a line, × hapus, urutan tetap) | 1–8 baris per bahasa, tiap baris 1–160; baris kosong dibuang saat simpan | ya (≥ 1 baris per bahasa) |
  | 9 | Case | Stack | chip (Enter/koma) | 0–6 item, 1–24 karakter, unik (kolom `tags`) | tidak |
  | 10 | Case | Status EN / ID | text | 1–40, mis. "Live, 2022–now" | ya |
  | 11 | Button on the case | Case action | radio: Open the live site / Email to ask for a walkthrough / No button | enum `site`\|`walkthrough`\|`none` | ya (default `site`) |
  | 12 | Button on the case | Live URL | url, "optional" | kosong atau `https://` valid maks. 300; **wajib bila case action = site** | kondisional |
  | 13 | Visual | Visual type | segmented: Screenshot / Number card | enum `screenshot`\|`number` | ya (default `screenshot`) |
  | 14 | Visual | Screenshot + alt EN/ID | ImageUploader v1 (16:10) + text | aturan v1; wajib bila type = screenshot | kondisional |
  | 15 | Visual | Number + Caption EN/ID | text + counter | number 1–12 (mis. "13", "5 → 1"); caption 1–60; wajib bila type = number | kondisional |
  | 16 | Publishing | Published | switch | Publish butuh semua kolom "ya" + kondisional valid | — |

  - Bantuan bagian Visual di v2.0.0: "Screenshots appear on the homepage. Number cards are saved now and appear in the desktop preview from v2.1." Data screenshot dan number boleh tersimpan bersamaan; yang dipakai mengikuti `visual_type`.
  - Saat Live URL kosong dan case action = site → error "Add a live URL, or choose another button."
  - Layout, Save/Cancel, dialog discard, `beforeunload`, zona hapus, perilaku ImageUploader: tetap v1.
  - Preview live di form: **tidak di v2.0.0** (v2.1.0).

  Dihapus: field Featured. Previously: 11 field v1.
- **§6 S-14 Profile.**
  - Photo: minimal 640 × 640 px, dicrop persegi, dikompres ke 320 dan 640 px; bantuan "Shown as a small circle next to your role in the hero. Upload at least 640 × 640 px so it stays sharp." Foto 320 px lama tetap tampil sampai diganti.
  - Availability (baru): satu switch "Show availability" + bantuan "Hide it when you are not taking new work, or when you'd rather people at work didn't see it." Tidak ada field teks (D-16).
  - Save → API-09 → revalidasi semua halaman publik.

  Previously: foto 160/320 px saja.
- **§7 UF-01 (ditulis ulang): Recruiter menilai Pal (EN).**
  1. Recruiter membuka tautan dari LinkedIn di HP → S-01; O-03 tampil.
  2. Membaca label peran, H1, sub, stack.
  3. Gulir ke Selected work; tap judul "HR System" → S-02 `#case-hr-system` terbuka (`case_open` source `home_title`).
  4. Membaca case; tap "Email to ask for a walkthrough" → mail app dengan subject "Walkthrough: HR System" dan body terisi (`contact_email_click` kind `walkthrough`, location `case`).
  5. Alternatif: kembali ke home → About → Download CV (`cv_download` location `about`), atau Contact → "Email about a full-time role" (kind `role`).
- **§7 UF-03 Email.** Empat jenis mailto (Delta §11), Copy email di Contact, E-09 tetap.
- **§7 UF-07 / UF-08.** Field mengikuti S-12/S-13 baru; saklar Featured diganti Show in Selected work.
- **§8 Edge case.** E-01 teks baru: "New work is on the way. Meanwhile, here's how to reach me." + tombol ke `#contact`. E-03: Selected work maks. 5; sisanya tetap di S-02. E-07: tanpa JS → tema mengikuti setelan perangkat lewat `@media (prefers-color-scheme: light)` di CSS (`dark` bila tidak ada setelan) dan toggle tema tidak tampil; baris case tetap bisa dibuka, filter tidak tampil, jam statis "GMT+7", Copy email tidak tampil. E-20: tetap (EN/ID panjang tidak merusak bab satu layar; bab boleh lebih tinggi dari satu layar bila isinya panjang).
- **§9 Data model Project.** Field baru dan berubah:

  | Field | Tipe | Wajib | Aturan |
  | --- | --- | --- | --- |
  | `group` | enum `panasonic`\|`web`\|`ai` | ya | default `web` |
  | `meta_en` / `meta_id` | string atau null | publish | 1–40 |
  | `side_en` / `side_id` | string atau null | tidak | 0–20 |
  | `case_is_en` / `case_is_id` | string atau null | publish | 1–220 |
  | `case_did_en` / `case_did_id` | string[] atau null | publish | 1–8 item, tiap 1–160 |
  | `status_en` / `status_id` | string atau null | publish | 1–40 |
  | `case_action` | enum `site`\|`walkthrough`\|`none` | ya | default `site` |
  | `live_url` | string atau **null** | bila `case_action = site` | `https`, maks. 300 |
  | `visual_type` | enum `screenshot`\|`number` | ya | default `screenshot` |
  | `card_number` | string atau null | bila `visual_type = number` | 1–12 |
  | `card_caption_en` / `card_caption_id` | string atau null | bila `visual_type = number` | 1–60 |
  | `thumbnail` + alt | tetap v1 | bila `visual_type = screenshot` | aturan v1 |
  | `tags` | string[] | tidak | **0–6** (v1: 0–4); tampil sebagai "Stack" |
  | `summary_en` / `summary_id` | tetap | ya | dipakai sebagai deskripsi singkat di Selected work |
  | `show_on_home` | boolean | ya | default false; maks. 5 bernilai true |
  | `featured` | boolean | — | **deprecated**, tidak dibaca/ditulis (D-22) |

  Aturan turunan: Selected work = `published AND show_on_home` urut `sort_order`, maks. 5. Proyek published v1 yang belum diisi field v2 tetap valid dan tampil di S-02 dengan bagian case yang kosong disembunyikan (E-27), sampai diedit. DTO publik v2: `{ id, slug, group, title, meta, side, summary, caseIs, caseDid[], stack[], status, caseAction, liveUrl|null, visual: { type:'screenshot', url, width, height, alt } | { type:'number', number, caption }, showOnHome }`.
- **§9 Pengaturan situs (baru).** `availability_on` boolean, default true bila belum pernah disimpan.
- **§10 Kontrak API.**
  - API-03/04 `ProjectInput`: tambah `group`, `meta_en/id`, `side_en/id`, `case_is_en/id`, `case_did_en/id`, `status_en/id`, `case_action`, `visual_type`, `card_number`, `card_caption_en/id`, `show_on_home`; `live_url` boleh `null`; `featured` diabaikan bila dikirim; `tags` maks. 6. Error tambahan `422 VALIDATION_FAILED` dengan `fields.show_on_home` = "Selected work already has 5 projects. Turn one off first." (E-26).
  - API-09: request `{ photo_public_id?: string|null, availability_on?: boolean }` (field yang tidak dikirim tidak berubah); respons `200 { photo, availability_on, revalidated }`; avatar varian 320/640.
  - API-06 `kind=avatar`: minimal 640 × 640.
  - API-01/02/05/07/08: tetap.
- **§11 Event GA4 (diganti).**

  | Event | Kapan | Parameter |
  | --- | --- | --- |
  | `page_view` | otomatis | tetap |
  | `contact_email_click` | klik mailto atau Copy email | `kind`: `general`\|`role`\|`project`\|`walkthrough`; `location`: `bar`\|`hero`\|`contact`\|`work_contact`\|`case`; `method`: `mailto`\|`copy`; `language`; `project_slug` (hanya kind walkthrough) |
  | `cv_download` | klik Download CV | `location`: `about`\|`contact`; `language` |
  | `case_open` | baris case dibuka | `project_slug`; `source`: `home_title`\|`row`\|`hash`; `language` |
  | `project_link_click` | klik situs live | `project_slug`; `page`: `home`\|`work`; `placement`: `home`\|`case`; `language` |
  | `theme_switch` | klik O-04 | `to`: `dark`\|`light` |
  | `language_switch` | tetap | tetap |

  Key event: `contact_email_click`, `cv_download`. Dihapus: `placement: hero_panel`, `location: navbar|footer|work_page`.
- **§11 String i18n.** Kamus v2 = key `T` di `option-b.html` (`skip`, `nav.*`, `cta`, `hero.*`, `work.*`, `w.*`, `w1..w5.*`, `about.*`, `e1..e3*`, `case.*`, `st*`, `bridge.*`, `ct.*`, `wp.*`, `c.*`, `mail.*`, `ft.*`), dengan tambahan dan perubahan:

  | Key | EN | ID |
  | --- | --- | --- |
  | `ct.h.more` | Have a project like *these?* | (Pal menulis padanan ID; draf: Punya proyek seperti *ini?*) |
  | `cv.download` | Download CV (PDF) | Unduh CV (PDF) |
  | `email.copy` / `email.copied` | Copy email / Copied | Salin email / Tersalin |
  | `mail.walk.s` | Walkthrough: {title} | Walkthrough: {title} |
  | `work.empty` | New work is on the way. Meanwhile, here's how to reach me. | Karya baru sedang disiapkan. Sementara itu, ini cara menghubungi saya. |
  | `theme.toDark` / `theme.toLight` | Switch to dark mode / Switch to light mode | Ganti ke mode gelap / Ganti ke mode terang |
  | `group.panasonic` / `group.web` / `group.ai` | Panasonic / Websites / AI tools | Panasonic / Website / Alat AI |

  Key `cur.*`, `peek.*`, `w.case` disimpan di kamus untuk v2.1.0 tetapi belum dirender. Teks proyek (`w1..w5`, `r*`, `c*`, `peek.*`) **bukan** key kamus: itu isi awal untuk admin (konten database). Key v1 yang tidak dipakai lagi dihapus (`meta.*`, `hero.proof*`, `slider.*`, `label.*`, `services.*`, `steps.*`, `card.*`, `facts.*`, `cta.*`, `nav.email`). Tag rich-text yang diizinkan: `<em>` (kata aksen miring), `<s>` (teks dicoret), `<strong>`. Previously: `<hl>`, `<dim>`, `<mark>`, `<strong>`.
- **§12 Traceability & batasan coding AI.** Ganti:
  - "Animasi hanya yang terdaftar" → motion D-08 + D-10, CSS saja di v2.0.0; JS klien hanya untuk daftar di Delta PRD §10.
  - "dark mode" dihapus dari daftar larangan (sekarang fitur).

  Tambah:
  - Jangan membangun lapisan pointer atau preview admin di v2.0.0.
  - Jangan merender link GitHub bila kosong.
  - Jangan memakai `--calm` atau `--faint` untuk teks.
  - Jangan membaca/menulis kolom `featured`.

### ADDED

- **O-04 Toggle tema (publik + admin).** Tombol ikon + label teks tersembunyi (`aria-label` `theme.toLight`/`theme.toDark` sesuai tema sekarang). Klik → set `data-theme` di `<html>`, simpan `rr-theme`, event `theme_switch`. Skrip inline di `<head>` (sebelum paint) menerapkan urutan D-23; tidak ada flash tema salah. Transisi warna 300 ms; reduced motion → seketika.
- **E-25** Selected work 0 proyek (`show_on_home` kosong) → bab Selected work tidak dirender; Hero "Scroll ↓" menuju `#about`; S-02 tetap menampilkan semua proyek.
- **E-26** Saklar Show in Selected work ke-6 → saklar nonaktif di UI dengan teks bantuan; server menolak dengan 422 bila tetap dikirim.
- **E-27** Proyek published dari v1 tanpa field v2 → baris S-02 tampil dengan judul + summary; bagian case kosong disembunyikan; tanpa tombol bila `live_url` kosong; tetap valid sampai diedit, saat Save wajib melengkapi field publish.
- **E-28** `case_action = site` tetapi `live_url` kosong (data lama/rusak) → perlakukan sebagai `none`, catat peringatan di log server.
- **E-29** `#case-<slug>` tidak ada atau proyeknya draft → halaman Work dibuka di atas, tanpa error.
- **E-30** Browser tanpa `animation-timeline` (Firefox saat ini) atau reduced motion → semua bab tampil sebagai tumpukan statis dalam keadaan akhir (statement penuh, angka akhir, "five passwords" sudah dicoret), Selected work sebagai daftar biasa, scroll snap mati saat reduced motion.
- **E-31** `localStorage` tidak tersedia (mode privat, diblokir) → tema mengikuti perangkat; toggle tetap mengganti tema untuk sesi itu tanpa error.
- **E-32** Avatar belum diganti (320 px) → tetap tampil; tidak ada peringatan publik; S-14 menampilkan "Current file is 320 px. A larger one is recommended."

### REMOVED

- HeroProofPanel dan E-21 s.d. E-24 (perilaku panel). Why: D-04.
- ProjectCard v1 di S-01/S-02. Why: D-05.
- Info featured dan E-08 di S-11. Why: D-22.

## Delta: DESIGN_SPEC

Tidak ada `DESIGN_SPEC.md` di v1 (visual ada di PRD §8). Perubahan desain tercatat di Delta PRD §8 (token, tipografi, aturan kontras) dan Delta SDD §8 (token di kode). Tidak ada file baru (D-28).

## Delta: SDD

### MODIFIED

- **§2 Stack.** Font: `next/font/google` → `Archivo` (`subsets: ['latin','latin-ext']`, `display: 'swap'`, `variable: '--font-archivo'`, bobot 400/500/600 + italic 500/600, file variabel). **Tanpa dependency baru.** Previously: Space Grotesk + IBM Plex Sans.
- **§3 Skema `projects` (migrasi `0004_v2_showcase.sql`).**
  - Kolom baru: `group` varchar(12) not null default `'web'` · `meta_en`, `meta_id` varchar(40) null · `side_en`, `side_id` varchar(20) null · `case_is_en`, `case_is_id` varchar(220) null · `case_did_en`, `case_did_id` JSON null · `status_en`, `status_id` varchar(40) null · `case_action` varchar(12) not null default `'site'` · `visual_type` varchar(10) not null default `'screenshot'` · `card_number` varchar(12) null · `card_caption_en`, `card_caption_id` varchar(60) null · `show_on_home` boolean not null default false.
  - Ubah: `live_url` menjadi NULL-able (pengecualian D-21).
  - Data: `UPDATE projects SET show_on_home = featured WHERE published = 1` hanya sebagai nilai awal (Pal merapikan di admin).
  - Index tambahan: (`published`, `show_on_home`, `sort_order`).
  - Kolom `featured` tetap, diberi komentar `-- deprecated v2.0.0, not read`.
  - Charset `utf8mb4_unicode_ci` eksplisit seperti migrasi sebelumnya; `npm run db:generate` lalu `npm run db:embed`.
  - `site_settings`: key baru `availability_on` (`'1'`/`'0'`), tanpa migrasi (tabel key-value).

  Previously: skema v1. Why: D-12, D-20, D-22.
- **§3 Gambar.** Avatar: minimal 640 × 640, varian 320 dan 640 (v1: 160/320). Validasi server untuk `kind=avatar` disesuaikan; avatar 320 lama tetap bisa disajikan.
- **§4 Struktur repo.**
  - Komponen publik baru di `components/site/`: `SiteBar`, `ThemeToggle` (client), `ThemeScript` (inline head), `ScrollProgress`, `ChapterDepth` (lapisan titik + cahaya), `Hero`, `SelectedWork`, `AboutChapter`, `HighlightChapter`, `ContactChapter`, `MailtoLink` (server, membangun mailto dari kamus + jenis), `CopyEmailButton` (dari v1), `CvLink`, `LocalClock` (client), `WorkFilter` (client), `CaseRow`, `Footer`.
  - Dihapus: `Navbar`, `HeroProofPanel`, `BylineBadge`, `MetaRow`, `SectionHeader`, `ServiceTile`, `ProcessSteps`, `ProjectCard`, `AboutFacts`, `FooterCta`, versi berdenyut `StatusDot`. Komponen v1 dihapus di task yang menggantinya, bukan dibiarkan sebagai kode mati.
  - Admin: `ProjectForm` disusun ulang per bagian; komponen baru `LinesInput` (What I did), `SegmentedControl`, `CaseActionField`, `VisualField`; `ProjectList` dengan filter grup; S-14 dengan switch availability.
  - File statis: `public/cv/rifaldi-radya-pratama-cv.pdf`.
  - `docs/design/homepage-mockup.html` dipindah ke `docs/design/archive/`.
- **§5 Routing.** Tetap (URL, proxy, rewrite). `public/cv/*.pdf` dilayani oleh aturan 2 proxy (path berekstensi).
- **§5 i18n.** `richText`: tag yang diizinkan `<em>` → `<em class="ac">`, `<s>` → `<s>`, `<strong>`. Unit test diperbarui (tag lama ditolak). Kamus mengikuti Delta APP_FLOW §11.
- **§5 Rendering.** Homepage memanggil `getPublishedProjects()` sekali lalu menurunkan `selectedWork` (`show_on_home`, maks. 5) di memori; Work memakai daftar penuh. `getSiteSettings()` (foto, availability) dibaca saat render statis dan ikut direvalidasi oleh API-09. Previously: turunan `featured` (maks. 3) + grid 6.
- **§6 Keamanan.** CSP tetap (font self-host, tanpa host baru). Skrip tema inline sudah tercakup `'unsafe-inline'` yang ada. Mailto dibangun dengan `encodeURIComponent` untuk subject/body; judul proyek di subject walkthrough di-encode. `live_url` hanya dirender bila `https:`.
- **§7 SEO & analytics.**
  - `buildMetadata` memakai key meta baru; JSON-LD `personJsonLd` sesuai Delta PRD §9.
  - `collectionJsonLd` memakai URL case untuk proyek tanpa `live_url`.
  - Gambar OG dibuat ulang dengan `scripts/og-images.mts` memakai token v2 (tema gelap) dan Archivo.
  - Tidak ada lagi gambar prioritas di S-01 dan S-02 (tidak ada thumbnail di atas fold); screenshot di Selected work `loading="lazy"`.
  - `lib/analytics/events.ts`: tipe event sesuai Delta APP_FLOW §11; atribut `data-track` + `data-kind`, `data-location`, `data-slug`, `data-source`.
- **§8 Design system di kode (diganti).**
  - `styles/globals.css` memakai **dua lapis**:
    - token tema di `:root, :root[data-theme="dark"]` dan `:root[data-theme="light"]`, nilai persis Delta PRD §8 (nama `--bg`, `--ink`, `--soft`, `--faint`, `--accent`, `--accent-ink`, `--calm`, `--k`, `--dot`, `--avatar-ring`);
    - pemetaan ke `@theme` Tailwind (`--color-bg: var(--bg)`, `--color-text: var(--ink)`, `--color-text-muted: var(--soft)`, `--color-border: var(--faint)`, `--color-accent: var(--accent)`, `--color-on-accent: var(--accent-ink)`, `--color-success`/`--color-danger` khusus admin).
  - Komponen hanya memakai token; tidak ada hex mentah.
  - Token v1 (`--color-accent-soft`, `--font-display`, `--shadow-card*`, `--slide-ms`, `--ease-pulse`, highlighter) dihapus; grep harus bersih.
  - `--font-sans: var(--font-archivo)`. Ukuran, spasi, radius, dan easing mengikuti mockup (`--gutter: clamp(20px, 2.8vw, 40px)`, `--ease: cubic-bezier(0.23, 1, 0.32, 1)`, `--win: 100svh`).
  - Focus ring: 2 px `--accent`, offset 2 px, kedua tema.
  - Previously: token amber satu tema.
- **§8 Motion di kode (diganti).**
  - Semua motion scroll di `@supports (animation-timeline: view())` + `@media (prefers-reduced-motion: no-preference)`: parallax lapisan per bab, blur/fade fokus per bab, statement About terisi per baris, coret + hitung angka Highlight (`@property` integer counter), progress bar `scroll(root)`, langkah Selected work dipin, hover garis aksen judul.
  - Scroll snap `y proximity` di `html`, mati saat reduced motion.
  - H1: animasi `transform: translateY` 900 ms `--ease`, **tanpa opacity** (D-10).
  - Transisi tema 300 ms pada `background-color`/`color`.
  - Larangan: listener `scroll`, library animasi, rotasi/timer JS, fade-in pada H1/sub, JS pointer (v2.1.0).
  - Previously: tabel motion v1 + rotasi HeroProofPanel.
- **§9 Konfigurasi.** `lib/site-config.ts`:
  - `social.linkedin = 'https://www.linkedin.com/in/rifaldiradya'`;
  - tambah `social.github = ''` (kosong = tidak dirender);
  - tambah `contactEmail = 'hello@rifaldiradya.com'` dan `cvPath = '/cv/rifaldi-radya-pratama-cv.pdf'`;
  - hapus `availableForWork` (diganti `availability_on`);
  - `timezoneLabel` tetap.

  Tidak ada env baru.
- **§10 Rilis & rollback v2.0.0.**
  - Semua kerja di `feat/v2-<task>` → PR ke `staging`.
  - Sebelum PR rilis `staging` → `main`: backup database produksi di hPanel (wajib, D-21).
  - Migrasi `0004` jalan otomatis saat start.
  - Tag `v2.0.0` + GitHub Release; `package.json` `version` 2.0.0; `check-deploy.mts` diperbarui (halaman v2, `/cv/…pdf` 200, meta baru).
  - **Rollback:** revert merge commit rilis di `main` **dan** restore backup database pra-rilis (kode v1 tidak menangani `live_url` null atau proyek tanpa thumbnail).

  Previously: rollback cukup revert karena migrasi aditif.
- **§11 Testing.**
  - Unit: skema Zod proyek v2 (setiap aturan kondisional: site ↔ live_url, screenshot ↔ thumbnail+alt, number ↔ number+caption, batas `case_did`, maks. 6 stack), batas 5 `show_on_home`, builder mailto (4 jenis × 2 bahasa, encoding), `richText` tag baru, kamus EN/ID identik, urutan penentuan tema.
  - Integrasi: migrasi `0004` pada dump v1 (baris lama valid, default terisi), API-03/04 aturan kondisional + E-26, API-09 availability.
  - E2E (Edge desktop 1280 + mobile 375): UF-01 v2, filter + hash Work, tema tanpa flash (screenshot frame pertama), tanpa JS (E-07), reduced motion + tanpa scroll-driven (E-30), axe di kedua tema.
  - QA manual: Safari iOS nyata, Firefox, snap Work di HP, kontras teks soft di kedua tema, focus ring baris case, Lighthouse mobile ≥ 90 di 4 halaman.
- **§12 Urutan build.** Task v2.0.0 di `docs/changes/v2.0.0-showcase-redesign/tasks.md` (T-23 dst.). Saat merge, task tercentang dipindah ke §12 seperti T-01..T-22.
- **§13 AGENTS.md (isi baru yang relevan).**
  - Sumber kebenaran #4 → `docs/design/v2/option-b.html` (publik) dan `docs/design/v2/admin.html` (admin); "kalau mockup berbeda dengan docs, docs yang menang; kalau docs diam, ikuti mockup".
  - Aturan "Animasi hanya CSS kecuali rotasi HeroProofPanel" → "Motion scroll hanya CSS (`@supports` + fallback statis); JS klien hanya untuk komponen di PRD §10; tanpa fade-in pada H1".
  - Penanda rich-text → `<em>`, `<s>`, `<strong>`.
  - Tambah: "Token tema dari `styles/globals.css`; `--calm`/`--faint` bukan untuk teks".
  - Tambah: "Kolom `featured` deprecated: jangan dipakai".

## Impact checklist

- [ ] Screens/routes: S-01, S-02 ditulis ulang; S-03, S-04 gaya baru; S-11, S-13, S-14 berubah; O-04 baru. Route tidak berubah.
- [ ] Komponen: lihat Delta SDD §4 (dihapus vs baru); `ui/*` (Button, Field, Toggle, Toast) di-skin ulang dengan token v2, nama tetap.
- [ ] URL/SEO: URL, canonical, hreflang, sitemap (6 URL) tidak berubah; meta, JSON-LD, OG berubah; tidak ada redirect.
- [ ] Copy: seluruh kamus EN/ID; isi 7 proyek di admin; halaman Privacy.
- [ ] Data/API: migrasi `0004` (kolom baru + `live_url` nullable), `site_settings.availability_on`, API-03/04/06/09.
- [ ] **Breaking?** Ya, untuk rollback: kode v1 tidak kompatibel dengan proyek tanpa URL (D-21). Tidak ada perubahan URL publik.
- [ ] Deprecation: kolom `featured` (hapus paling cepat di MAJOR berikutnya, lewat CHANGE.md sendiri).

## Acceptance checks

Requirement ID merujuk ke daftar acceptance di Delta PRD (F1, F2, F5, F7, F8) dan edge case di Delta APP_FLOW.

- **AC-1 (F1, D-04, D-10).** Given HP 375 × 667 dengan banner consent, When membuka `/`, Then label peran, H1, dan "Email me" terlihat tanpa scroll, dan LCP adalah H1 tanpa animasi opacity.
- **AC-2 (F1, D-18).** Given 7 proyek published dengan 5 `show_on_home`, When membuka `/`, Then Selected work menampilkan tepat 5 sesuai urutan admin dengan penghitung 01/05…05/05.
- **AC-3 (F1, D-06).** Given item "HR System" di Selected work, When judul diklik, Then `/work#case-hr-system` terbuka dengan baris itu terbuka dan terfokus, dan `case_open` (source `home_title`) terkirim bila consent.
- **AC-4 (F2, D-05, D-24).** Given halaman Work, When filter "Panasonic" dipilih, Then hanya 3 baris Panasonic tampil dan tombol aktif `aria-pressed=true`; Given JS mati, Then semua baris tampil dan bisa dibuka.
- **AC-5 (F5, D-07, D-25).** Given case Single Sign-On (`walkthrough`), When tombol diklik, Then mailto berisi subject "Walkthrough: Single Sign-On" dan body sesuai bahasa halaman.
- **AC-6 (F5, D-14).** Given About atau Contact, When Download CV diklik, Then PDF varian web (tanpa nomor HP) terunduh, status 200, dan `cv_download` terkirim bila consent.
- **AC-7 (F7, E-26).** Given 5 proyek dengan `show_on_home`, When saklar proyek ke-6 dicoba, Then saklar nonaktif di UI dan API menolak dengan 422.
- **AC-8 (F7, D-12).** Given proyek dengan case action `site` tanpa Live URL, When Save dengan Published on, Then error "Add a live URL, or choose another button." dan tidak tersimpan.
- **AC-9 (D-16).** Given availability dimatikan di S-14, When Save, Then baris availability hilang dari `/` dan `/id` dalam ≤ 60 detik, dan meta description tidak berubah.
- **AC-10 (O-04, D-23, E-31).** Given perangkat bertema terang tanpa pilihan tersimpan, When membuka `/`, Then frame pertama sudah terang (tanpa flash); When toggle diklik, Then pilihan bertahan setelah reload; Given `localStorage` diblokir, Then toggle tetap bekerja tanpa error.
- **AC-11 (E-30).** Given Firefox atau reduced motion, When menggulir home, Then semua bab terbaca penuh dalam keadaan akhir, tanpa elemen tersembunyi.
- **AC-12 (NFR).** PageSpeed mobile ≥ 90 dan CLS < 0,1 di `/`, `/work`, `/id`, `/id/work` di staging dalam kedua tema; axe tanpa pelanggaran serius di kedua tema.
- **AC-13 (D-19).** Given `social.github` kosong, Then tidak ada tautan GitHub di HTML; LinkedIn menuju `linkedin.com/in/rifaldiradya` di halaman dan JSON-LD.
- **AC-14 (migrasi, D-21).** Given dump database v1, When `0004` dijalankan, Then semua baris lama valid dengan default v2, dan migrasi idempotent (CI dua kali).
- **AC-15 (visual).** Setiap bab dibandingkan dengan `option-b.html` di 375 px dan 1280 px dalam kedua tema; perbedaan hanya yang tercatat di Decisions (D-10, D-16, D-17, D-20, D-24, D-25, lapisan pointer D-27).

## Already implemented

Belum ada. Folder `docs/design/v2/` (mockup, aset, brief) sudah di-commit di branch `docs/v2-design-mockups`; `screens-option-b/` masih untracked dan ikut di-commit di T-23.
