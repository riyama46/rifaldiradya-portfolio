# Brief untuk App Planner: rifaldiradya.com v2.0.0 (MAJOR)

> **Cara pakai.** Tempel seluruh dokumen ini ke project App Planner (vibe-coding-planner, mode Version Update), lalu upload `docs/specs/PRD.md`, `APP_FLOW.md`, dan `SDD.md` dari repo (v1.0.0, `status: current`). Mulai dengan kalimat:
> *"Ini app yang sudah rilis (v1.0.0). Aku mau rencanakan MAJOR v2.0.0. Brief arah dan keputusan desainnya di bawah; desainnya sudah final di mockup. Tolong brainstorm sisa keputusannya dengan aku, lalu buat CHANGE.md."*
>
> Brief ini bahan brainstorming, bukan CHANGE.md. Bagian "Keputusan" sudah disepakati di sesi desain (15–17 Okt 2026). Bagian "Masih terbuka" yang perlu dibahas.

---

## 1. Ringkasan v1 (yang sedang live)

- Portfolio bilingual EN/ID untuk **klien freelance Upwork**. Promise tunggal: "Landing Pages That Launch in Days, Not Weeks".
- 4 halaman publik (`/`, `/work`, `/id`, `/id/work`), privacy, dan admin single-user (S-10 sampai S-14: login, list project dengan ↑/↓, form edit, profile foto).
- Project: judul, summary 160 karakter, `live_url` wajib, tag, thumbnail wajib saat publish, featured (panel hero, maks. 3), published.
- Visual "cream/amber" dengan panel bukti berotasi di hero. Motion CSS-only, kecuali rotasi panel.
- Recruiter dan CV sengaja di luar scope v1. Case study dan filter Work juga ditunda.

## 2. Kenapa v2 (MAJOR)

Arah situs berubah. Dari **jualan landing page ke klien Upwork**, jadi **showcase software engineer untuk recruiter/hiring manager, sekaligus klien proyek**. Pengunjung datang dari LinkedIn, Upwork, dan Fiverr, mayoritas lewat HP.

Situs sekarang dirancang sebagai **funnel**: setiap bagian mengarah ke satu aksi, yaitu menghubungi lewat email untuk posisi full-time atau proyek.

Masuk lane MAJOR karena: positioning, audiens, information architecture, homepage, dan halaman Work berubah total. Model data project juga berubah, termasuk `live_url` yang tidak lagi wajib.

**Positioning baru:** Software engineer, full-stack .NET (C#, ASP.NET, SQL Server, Azure). Sejak Nov 2022 membangun dan menjaga HRMS yang dipakai 13 perusahaan grup PT Panasonic Manufacturing Indonesia. Panasonic boleh disebut. Layar HRMS internal, jadi tidak ditampilkan.

## 3. Sumber kebenaran desain (dibawa sampai build)

Desain sudah final dan menjadi **referensi visual dan interaksi utama** untuk build v2:

| File | Isi |
| --- | --- |
| `docs/design/v2/option-b.html` | Situs publik lengkap: home 5 bab, halaman Work (`#/work` di mockup), EN/ID, gelap/terang, semua motion, kamus copy EN/ID di objek `T`. **Copy final ada di sini.** |
| `docs/design/v2/admin.html` | Admin v2: Sign in, Projects, Edit project, Profile. |
| `docs/design/v2/assets/` | Foto profil (320 dan 640 px), screenshot SwiftPay dan Bloom Studio. |
| Kanvas Claude Design: https://claude.ai/artifact/95orKJvQoP44VvsvvT3R5y | Board EN/ID, gelap/terang, desktop/HP, halaman Work, dan admin. Tiap frame di-scroll di dalam. |

Aturan untuk builder, mengikuti pola v1:
- Kalau mockup berbeda dengan CHANGE.md atau docs, **docs yang menang**.
- Kalau docs diam, ikuti mockup.
- `docs/design/homepage-mockup.html` (v1) pindah ke `docs/design/archive/`.
- AGENTS.md "Sumber kebenaran #4" diarahkan ke dua file v2 di atas.
- Folder `docs/design/v2/` masih untracked. Commit lewat PR ke `staging` sebelum build dimulai.

## 4. Keputusan yang sudah diambil (D-xxx untuk CHANGE.md)

| # | Keputusan | Alternatif yang ditolak, dan kenapa |
| --- | --- | --- |
| D-01 | Positioning: software engineer full-stack .NET, showcase untuk recruiter dan klien proyek, situs sebagai funnel ke email. | Tetap jualan landing page (tidak sesuai karier sekarang). |
| D-02 | Arah visual "Opsi B": gaya bouayaben.com, banyak white space, satu adegan per layar. | Opsi A "Hex & Orange" (gaya nikolaradeski.com) dan "Forest & Ochre". Keduanya ditolak dan file-nya sudah dihapus. |
| D-03 | Font Archivo saja. Aksen **cobalt** (`#7b93ff` gelap, `#2f4fe0` terang) di satu kata miring per judul. Mode gelap (default) dan terang dengan toggle. | Oranye (ditolak 16 Okt), lime, mint. Inter. |
| D-04 | Home jadi 5 bab dengan scroll snap: Hero → Selected work (dipin, 5 langkah, penghitung 01/05, rail nama proyek) → About (satu layar) → Highlight SSO (satu layar) → Contact. | Satu adegan per proyek tanpa pengelompokan. |
| D-05 | Halaman Work: judul besar "Work", filter (All, Panasonic, Websites, AI tools), baris yang dibuka untuk melihat case (What it is, What I did, Stack, Status, tombol). | Halaman case study terpisah per proyek. Baris yang dibuka sudah cukup dan tanpa route baru. |
| D-06 | Judul proyek di Selected work bisa diklik ke case-nya. Hover halus: garis aksen menyapu dari kiri, panah masuk. | Tautan "Read the case" terpisah (dihapus, terlalu ramai). |
| D-07 | Funnel: "Email me" di bar dan hero, kalimat jembatan setelah Highlight, Contact dengan dua tombol mailto (posisi full-time / proyek) yang subject dan isinya sudah terisi. Proyek Panasonic punya tombol "Email to ask for a walkthrough". | Form kontak (tetap tanpa penyimpanan data, sama seperti v1). |
| D-08 | Motion: parallax per bab (lapisan titik dan cahaya), fokus blur/fade per bab, statement About terisi baris per baris, "five passwords" dicoret lalu angka menghitung, progress bar. Semua CSS scroll-driven (`view()`/`scroll()`), dengan fallback tumpukan biasa untuk browser lama dan reduced motion. | Parallax global yang hampir tidak terlihat (versi awal). |
| D-09 | **Pengecualian JS (melanggar aturan v1 "CSS only")**: kursor kustom (titik dan cincin berlabel "Read"/"Visit"), cahaya yang mengikuti kursor dengan warna per bab, preview di samping kursor di halaman Work, tilt screenshot. Hanya untuk mouse (`hover: hover` dan `pointer: fine`). Di layar sentuh, cahaya per bab tetap jalan dengan CSS saja. | Tanpa kursor kustom. Pal secara eksplisit minta. |
| D-10 | H1 hero tetap punya animasi masuk (naik dan fade 900 ms). **Bertentangan dengan aturan v1** "tanpa fade-in di H1". Perlu dikonfirmasi ulang, karena aturan v1 dibuat untuk LCP. | — |
| D-11 | Proyek tanpa screenshot (internal Panasonic) memakai **kartu angka**: angka nyata dan caption, misalnya "13 · group companies on one HR system". | Screenshot HRMS yang diblur (masih bisa ditambah nanti). |
| D-12 | `live_url` jadi opsional. Tombol di case dipilih per proyek: buka situs / email minta walkthrough / tanpa tombol. | `live_url` wajib (proyek internal tidak bisa tampil). |
| D-13 | Bahasa admin tetap EN saja. Sumber copy situs tetap kamus i18n di repo. | — |

## 5. Copy final (ringkas; teks lengkap di objek `T` di option-b.html)

Aturan copy: tanpa em dash, tanpa pola "Not X. Y.", tanpa kata klise, tombol menyebut persis apa yang terjadi, EN dan ID ditulis terpisah (transcreation), tanpa angka atau testimoni karangan.

| Elemen | EN | ID |
| --- | --- | --- |
| Bar | Rifaldi Radya Pratama · Work · About · EN/ID · tema · Email me | … · Karya · Tentang · … · Kirim email |
| Label hero | Software engineer · Full-stack .NET · Jakarta, Indonesia | … · Jabodetabek |
| Status | Open to full-time roles and projects | Terbuka untuk posisi full-time dan proyek |
| H1 | Building HR software / for *thousands.* | Membangun software HR / untuk *ribuan karyawan.* |
| Sub | Four years building and running the HR system of 13 Panasonic group companies: hundreds of HR users, thousands of employee records. | Empat tahun membangun dan menjaga sistem HR 13 perusahaan grup Panasonic: ratusan pengguna HR, ribuan data karyawan. |
| Stack | C# · ASP.NET · SQL Server · Azure · Power Automate · Next.js · TypeScript | sama |
| Highlight | One login instead of ~~five passwords.~~ · 5 → 1 · ~200 · 13 | ~~Lima password~~ jadi satu login. · ±200 |
| Contact H2 | Tell me what you're *building.* | Ada posisi atau *proyek?* |
| Tombol | Email about a full-time role · Email about a project | Email soal posisi full-time · Email soal proyek |

**Angka yang dipakai, dan sumbernya** (CV v1.0, Drive `01_Personal Docs/Current/Career`, 16 Okt 2026):
- HRMS dipakai 13 perusahaan grup, dan Pal memegang 6.
- Pengguna HRMS ratusan staf HR/admin. Data karyawannya ribuan, sekitar 2.000 di site utama.
- SSO: 4–5 password jadi 1, untuk sekitar 200 staf, live sejak awal 2023.
- Teams approval: dari sekitar 57 menit jadi 4. Ini **masih usulan** dan selalu ditulis "projected".
- Tim 3 orang. Tugas mencakup audit SOX, training pengguna, dan membimbing anak magang.
- Pendidikan: MM SDM Universitas Pancasila (target lulus 2027, tesis presenteeism/WLB/burnout), S1 Informatika Telkom 2022, D3 IPB 2018.
- Sertifikasi: BNSP Junior Web Programmer 2019, Digital Skola UI/UX 2022.

**Proyek (7):** HR System, Single Sign-On, Teams Approvals (Panasonic) · SwiftPay, Bloom Studio, rifaldiradya.com (Websites) · AI workflow automation (AI tools). Selected work di home menampilkan 5 yang pertama.

## 6. Yang bisa diubah lewat admin

**Prinsip:** konten yang berubah setiap kali ada pekerjaan baru masuk admin. Copy yang hanya berubah kalau karier berubah tetap di kamus i18n dan diubah lewat PATCH.

**Masuk admin (sudah ada di mockup `admin.html`):**
1. **Proyek, semua isi** (EN/ID berdampingan):
   - judul, grup (Panasonic / Websites / AI tools), meta line, deskripsi singkat untuk home;
   - isi case: What it is, What I did (daftar maksimal 8 baris), Stack (chip), Status;
   - tombol case (buka situs / email walkthrough / tanpa tombol) dan `live_url` opsional;
   - visual: screenshot dengan alt EN/ID, atau kartu angka (angka dan caption EN/ID);
   - Published.
2. **Selected work di home:** saklar per proyek, maksimal 5. Urutannya mengikuti daftar (↑/↓, sama seperti v1). Ini menggantikan "Featured" (panel hero tidak ada lagi).
3. **Profile:** foto (minimal 640 px) dan **Availability**: saklar tampil/sembunyi serta teksnya dalam EN/ID. Availability ini usulan baru. Di v1 baris ini diatur lewat flag konfigurasi.

**Tetap di kamus i18n (PATCH):** hero, About, pendidikan, sertifikasi, Highlight, Contact, label UI.

**Masih terbuka untuk dibahas di Planner:**
- Highlight dijadikan "pilih satu proyek + 3 angka" di admin?
- Pendidikan dan sertifikasi diedit lewat admin?
- Tombol "Download CV" (PDF) untuk recruiter? Trigger roadmap v1 "CV ATS-friendly selesai" sekarang sudah terpenuhi.

## 7. Dampak per dokumen (bahan delta CHANGE.md)

**PRD**
- *Diubah:*
  - §1–§4: positioning, persona (recruiter/hiring manager primer, klien proyek sekunder), goals, non-goals (recruiter sekarang masuk scope), metrik (klik email per jenis: role/project/walkthrough), seluruh tabel copy.
  - §5 IA: home 5 bab dan halaman Work baru.
  - §6: F1 (home), F2 (Work dengan filter dan case), F3 (kartu diganti baris case dan judul yang bisa diklik), F5 (dua jenis mailto dan walkthrough; tombol "Copy email" v1 tidak ada di mockup, jadi perlu diputuskan tetap atau dihapus), F7 (field baru, featured diganti Selected work), F8 (event baru).
  - §8 visual: diganti Opsi B.
- *Ditambah:* tema gelap/terang, kursor dan cahaya (JS, khusus mouse), kartu angka.
- *Dihapus:* panel bukti berotasi di hero, service block dua tier, alur Brief → Build → Live, highlighter amber.
- *Out of scope v1 yang sekarang masuk:* filter Work, konten case per proyek, recruiter.

**APP_FLOW**
- S-01 dan S-02 ditulis ulang (bab, state pin/fallback, routing case).
- Usulan route case: `/work#case-hrms` dan `/id/work#case-hrms` (tanpa route baru, aman untuk SEO).
- Overlay baru: toggle tema (simpan pilihan, tanpa flash saat load).
- S-11, S-13, S-14 sesuai admin v2.
- Data model Project:
  - field baru: `group`, `meta_en/id`, `case_is_en/id`, `case_did_en/id[]`, `status_en/id`, `case_action`, `visual_type`, `card_number`, `card_caption_en/id`, `show_on_home`;
  - `live_url` jadi nullable;
  - `featured` diganti `show_on_home`;
  - `summary` dipakai sebagai deskripsi singkat untuk home.
- Profile: `availability_on`, `availability_en/id`.
- Kontrak API-03/04/09 berubah.
- Event analytics: `contact_email_click` dengan `kind`, `case_open`, `theme_switch`.

**SDD**
- §5 routing tetap.
- Migrasi DB: kolom baru dan `live_url` nullable.
- §8 design system: token baru (cobalt, gelap/terang, `--k` kekuatan cahaya).
- Aturan motion v2:
  - scroll-driven CSS dengan `@supports` dan fallback;
  - satu client component untuk kursor/cahaya/preview (rAF, berhenti saat diam, hanya mouse);
  - kontradiksi D-09 dan D-10 dicatat di DECISIONS.
- Tanpa dependency baru.
- Gate Lighthouse mobile ≥ 90 tetap berlaku, dan perlu dicek ulang karena ada blur, filter, dan font.

**AGENTS.md**
- Sumber kebenaran #4 menunjuk ke mockup v2.
- Aturan "Animasi hanya CSS" diganti dengan aturan motion v2.

## 8. Yang belum sempurna di mockup (diperbaiki saat build/QA)

- **Admin:** ↑/↓, "+ Add a line", hapus chip/baris, upload file, dan Delete masih tampilan saja, belum berfungsi. Tab filter, saklar, pilihan visual, dan preview live sudah jalan.
- **Situs:**
  - Tautan Privacy dan Cookie settings masih placeholder.
  - Routing mockup memakai hash `#/work`. Di build harus memakai route asli `/work` dan `/id/work`.
  - Klik tautan di dalam kanvas belum teruji. Di file HTML sudah jalan.
- **Cek QA di build:**
  - tampilan reduced-motion dan browser tanpa `animation-timeline` (Firefox);
  - Safari untuk scroll-driven animation;
  - mode terang di semua bab;
  - snap Work di HP;
  - kontras teks soft di kedua tema;
  - focus ring di baris case.

## 9. Konten yang harus siap sebelum rilis

- Foto profil minimal 1200 px (sekarang 320 px).
- Konfirmasi teks hero dan About terakhir (Pal boleh revisi).
- Opsional: screenshot HRMS yang diblur, kalau mau mengganti kartu angka.

## 10. Lane, nama, dan alur

- Lane **MAJOR**: `v1.0.0` → `v2.0.0`. Nama change: `v2.0.0-showcase-redesign`.
- Tier tetap **full**: CHANGE.md + `tasks.md` (build lebih dari 5 langkah). Keputusan D-01…D-13 juga dicatat di `docs/decisions/DECISIONS.md`.
- Setelah CHANGE.md di-approve:
  1. Simpan ke `docs/changes/v2.0.0-showcase-redesign/CHANGE.md` lewat Claude Code.
  2. Commit, lalu PR ke `staging`.
  3. Build dengan vibe-coding-builder ("build active change").
  4. Cek di devstaging.
  5. PR `staging` → `main`.
  6. Rilis tag `v2.0.0`.
