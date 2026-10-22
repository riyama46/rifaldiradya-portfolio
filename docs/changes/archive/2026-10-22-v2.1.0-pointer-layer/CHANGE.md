---
change: v2.1.0-pointer-layer
app: rifaldiradya.com
tier: full
bump: minor
base_version: 2.0.2
status: done
date: 2026-10-17
approved: 2026-10-18
---

# Change v2.1.0 — Lapisan pointer, preview admin, tema gelap default, dan perapian visual

> **Status: disetujui Pal 18 Okt 2026.** Bagian pointer sengaja ditunda dari v2.0.0 (D-27 di `docs/decisions/DECISIONS.md`; change v2.0.0 diarsipkan di `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/`). Tema gelap default ditambahkan atas permintaan Pal saat persetujuan.
>
> Prasyarat dicek 18 Okt 2026:
> 1. v2.0.0 sudah dirilis (tag `v2.0.0`, tag terakhir) dan sudah di-merge ke `docs/specs/`; verifikasi pasca-rilis D-29 selesai.
> 2. `base_version` = 2.0.0 saat disetujui; dinaikkan ke 2.0.2 saat build dimulai 22 Okt 2026 (v2.0.1 dan v2.0.2 adalah patch, tidak menyentuh scope change ini).
> 3. `data-cursor` masih ada di `components/site/SelectedWork.tsx` dan `components/site/CaseRow.tsx`; token cahaya `--gx`, `--gy`, `--glow`, `--k` masih ada di `styles/globals.css`.
> 4. Nomor keputusan digeser ke D-31..D-36 karena D-29 dan D-30 sudah dipakai di v2.0.0.
> 5. Key `cur.read`/`cur.visit` ternyata tidak ada di `i18n/*.json` (terhapus saat v2.0.0), jadi dicatat sebagai ADDED di bawah.
>
> Rujukan visual dan perilaku: JS dan CSS kursor di `docs/design/v2/option-b.html` (`.spot`, `.cur-dot`, `.cur-ring`, `.peek`, `.shot`) dan panel preview di `docs/design/v2/admin.html`. Kalau mockup berbeda dengan dokumen ini, dokumen ini yang menang.

## Why

Lapisan pointer adalah bagian desain yang diminta eksplisit (D-09) dan menunjukkan craft kepada pengunjung desktop. Lapisan ini ditunda karena mayoritas pengunjung memakai HP, merupakan satu-satunya JS tambahan, dan menjadi risiko terbesar untuk INP dan Lighthouse. Dengan v2.0.0 sudah live, lapisan ini bisa ditambahkan tanpa membongkar apa pun.

Tema: arah "Opsi B" dirancang gelap lebih dulu (PRD §8, "Mode gelap (default)"), tetapi D-23 mengikuti setelan perangkat, sehingga pengunjung yang perangkatnya disetel terang (sebagian besar HP dan laptop kantor) tidak pernah melihat tampilan utama kecuali menekan toggle. Kesan pertama recruiter dan klien sebaiknya sama di semua perangkat.

Masukan Pal setelah rilis (18 Okt 2026), ikut change ini:
- Titik latar terlihat terputus di batas tiap bab, karena tiap bab punya lapisan titik sendiri dengan mask pudar 18 % di atas dan bawah (sama dengan mockup). Hanya di Selected work (dipin) titiknya terasa menyambung.
- Favicon dan ikon aplikasi masih desain v1 ("RR" dengan sapuan stabilo amber), padahal amber sudah tidak ada di palet v2 (aksen cobalt).
- Perubahan dari admin baru tampak setelah ±1 menit, kadang lebih lama: `revalidatePath` hanya membersihkan cache Next, sedangkan CDN Hostinger menyimpan HTML sesuai `s-maxage=300` dan boleh menyajikan salinan basi sampai ±1 tahun (`stale-while-revalidate`); teramati `Age: 589` pada respons HIT. Ini juga penyebab laporan "proyek AI tidak muncul di /work".

Lane MINOR: hanya menambah dan mengubah satu perilaku default, tanpa perubahan struktur, URL, atau data.

## Scope

**In**

- Kursor kustom: titik + cincin yang tertinggal sedikit; cincin membesar di atas tautan/tombol; berlabel "Read" / "Visit" (`cur.read`, `cur.visit`) sesuai `data-cursor`; mengecil saat ditekan. Kursor bawaan disembunyikan hanya saat lapisan aktif.
- Cahaya yang mengikuti kursor (`.spot`, ±820 px) dengan warna dan kekuatan per bab (`data-zone` di `<html>`, ditentukan oleh bab yang sedang di tengah layar). Saat aktif, cahaya CSS statis per bab (`.depth .glow`) disembunyikan supaya tidak dobel.
- Preview di samping kursor (340 px, 16:10) saat hover judul Selected work dan baris Work: screenshot untuk `visual_type = screenshot`, kartu angka (`card_number` + caption) untuk `visual_type = number` (D-11 v2.0.0).
- Tilt screenshot di Selected work (`perspective` + `rotateX/Y` maks. sekitar 6°, transisi 500 ms).
- Admin S-12/S-13: panel preview di ≥ 1024 px, "Preview on the homepage" (meta, judul, deskripsi) dan "Preview next to the cursor" (screenshot atau kartu angka), diperbarui saat mengetik, EN dengan tombol ganti ke ID.
- Tema gelap jadi default untuk semua pengunjung yang belum memilih, di publik dan admin, dengan dan tanpa JS. Terang tetap tersedia lewat toggle (tersimpan di `rr-theme`) dan `?theme=light`.
- Titik latar menjadi satu bidang yang menyambung di seluruh halaman, dengan parallax pelan; cahaya per bab tetap.
- Favicon, `icon.png`, dan `apple-icon.png` baru dalam gaya v2.
- Cache HTML publik lebih pendek supaya perubahan admin tampak dalam ±1–2 menit dan salinan basi tidak bertahan lama.

**Out**

- Perubahan copy, data, API, atau URL; perubahan tampilan di HP dan tablet selain tema default, titik latar, dan ikon.
- Purge cache CDN Hostinger lewat API (tidak ada API resmi yang dipakai proyek ini).
- Library animasi atau dependency baru.

## Decisions

- **D-31 — Lapisan pointer hanya untuk mouse.** Aktif hanya bila `(hover: hover) and (pointer: fine)` cocok dan event berasal dari `pointerType === "mouse"`. Bila media query berubah (mis. tablet dengan keyboard dicabut), lapisan dimatikan dan semua class dibersihkan. · Alasan: D-09. · Ditolak: aktif di layar sentuh.
- **D-32 — Satu client component, rAF yang berhenti saat diam.** Satu komponen `PointerLayer` (dimuat dengan dynamic import setelah idle, hanya bila media query cocok, sehingga JS-nya tidak ada di bundle HP). Satu loop `requestAnimationFrame` yang berhenti ketika titik, cincin, dan cahaya sudah mencapai posisi kursor (selisih < 0,4 px), lalu menyala lagi pada `pointermove`. Hanya `transform` dan `opacity`. · Alasan: INP dan baterai.
- **D-33 — Zona cahaya lewat IntersectionObserver** (`rootMargin: -45% 0 -45% 0`) yang menulis `data-zone`; tanpa listener `scroll`. · Alasan: aturan v2 "tanpa listener scroll".
- **D-34 — Reduced motion.** Dengan `prefers-reduced-motion: reduce`: titik dan cincin tetap (sebagai penanda), tetapi tanpa lag (langsung di posisi), tanpa tilt, cahaya tanpa transisi; preview tetap tampil tanpa animasi masuk. · Alasan: tetap informatif tanpa gerak.
- **D-35 — Aksesibilitas tidak bergantung pada lapisan ini.** Label "Read"/"Visit" dan preview bersifat `aria-hidden`; arti tautan tetap dari teksnya. Kursor bawaan kembali muncul saat fokus keyboard dipakai (`:focus-visible` di mana pun → lapisan disembunyikan sampai mouse bergerak lagi).
- **D-36 — Tema gelap default, tidak mengikuti setelan perangkat.** Urutan sebelum paint: `?theme=` → `rr-theme` → `dark`. Tanpa JS (E-07) dan saat `localStorage` diblokir (E-31) tema juga gelap. Berlaku untuk publik dan admin (satu `ThemeScript`). Menggantikan bagian `prefers-color-scheme` dari D-23; key, toggle, dan `?theme=` tetap. · Alasan: Opsi B dirancang gelap lebih dulu; kesan pertama sama di semua perangkat; pilihan terang tetap ada dan diingat. Kontras kedua tema sudah lolos WCAG AA dan PageSpeed (SDD §12). · Ditolak: mengikuti setelan perangkat (D-23 lama), karena mayoritas pengunjung tidak pernah melihat tampilan utama.
- **D-37 — Satu bidang titik untuk seluruh halaman.** Titik dipindah dari `.depth` tiap bab ke satu lapisan `position: fixed` di belakang semua konten (`aria-hidden`, `pointer-events: none`), tanpa mask per bab. Parallax CSS: lapisan sedikit lebih tinggi dari layar bergeser `translateY` pelan dengan `animation-timeline: scroll(root)` di dalam `@supports`; tanpa dukungan atau dengan reduced motion → diam. Hanya `transform`. Lapisan `.depth` tiap bab tinggal cahaya (dan drift cahaya yang sudah ada); animasi titik `work-drift` di Selected work dihapus. · Alasan: masukan Pal, titik terputus terbaca sebagai bug; satu lapisan juga lebih ringan daripada 5–7 lapisan. · Ditolak: mempertahankan mask per bab seperti mockup.
- **D-38 — Ikon v2.** Monogram "RR" dengan font Archivo di atas warna latar gelap v2 (`--bg` gelap) dengan aksen cobalt (`--accent`), dibuat ulang oleh `scripts/icons.mts` dari token yang sama; ukuran sama dengan v1 (ico 16/32/48, 512, 180). Builder menyiapkan 2 varian (mis. "RR" putih dengan garis bawah cobalt, dan "RR" cobalt) sebagai PNG untuk dipilih Pal sebelum PR. Menggantikan keputusan ikon 2026-09-30 ("B · highlighter"). · Alasan: amber sudah keluar dari palet v2.
- **D-39 — Cache HTML publik.** `export const revalidate = 60` di `/[lang]` dan `/[lang]/work` (sitemap dan robots tetap 300) dan `expireTime: 120` di `next.config.ts`, sehingga header menjadi `s-maxage=60, stale-while-revalidate=60`. Revalidasi on-demand saat admin menyimpan tetap. · Alasan: CDN tidak ikut dibersihkan `revalidatePath`; batas atas salinan basi turun dari tak terbatas praktis ke ±2 menit. Beban tambahan: paling banyak 1 render ulang per halaman per menit saat ada pengunjung, query ringan. · Ditolak: `revalidate = 0`/dinamis (kehilangan cache CDN dan ketahanan saat DB bermasalah).

## Delta: PRD

### ADDED

- **§8 Motion.** Baris tabel: kursor (titik + cincin berlabel), cahaya mengikuti kursor per bab, preview samping kursor, tilt screenshot, semuanya khusus mouse (D-31..D-35).
- **§10 NFR Performance.** JS lapisan pointer ≤ 3 KB gzip, dimuat terpisah dan hanya di perangkat mouse; tidak ada long task > 50 ms dari lapisan ini saat menggerakkan mouse di halaman Work (Performance panel); INP tetap < 200 ms.

### MODIFIED

- **§7 Out of scope.** Hapus baris "lapisan pointer + preview admin → v2.1.0". Previously: ditunda di v2.0.0. Why: dikerjakan di change ini.
- **§8 Visual.** "Mode gelap (default) dan terang dengan toggle, tanpa flash saat load (D-23)" menjadi "Mode gelap selalu default (tidak mengikuti setelan perangkat) dan terang lewat toggle yang diingat, tanpa flash saat load (D-23, D-36)". Previously: default gelap hanya bila perangkat tidak disetel terang. Why: D-36.

## Delta: APP_FLOW

### ADDED

- **O-05 Lapisan pointer (publik, desktop mouse).**
  - Elemen `aria-hidden`: `.spot`, `.cur-dot`, `.cur-ring` (dengan label), `.peek` (screenshot atau kartu angka per proyek published yang tampil di halaman itu).
  - Pemicu: elemen dengan `data-cursor` (`read`|`visit`) memberi label; `a, button` lain membuat cincin membesar tanpa label; elemen `data-preview="<slug>"` (judul Selected work, `<summary>` baris Work) menampilkan preview proyek itu; `.shot` menerima tilt.
  - Keluar dari jendela → semua disembunyikan.
- **E-33** Proyek tanpa visual yang valid (screenshot hilang atau kartu angka kosong) → preview tidak ditampilkan untuk proyek itu; label kursor tetap.
- **E-34** Halaman dibuka dengan mouse lalu beralih ke sentuh → lapisan dimatikan pada `pointerType` pertama yang bukan mouse, dan dinyalakan lagi pada `pointermove` mouse berikutnya.

### MODIFIED

- **S-01 bab 2 dan S-02.** Judul Selected work dan `<summary>` baris Work mendapat `data-preview="<slug>"` (judul sudah punya `data-cursor` dari v2.0.0). Previously: hanya `data-cursor`. Why: preview.
- **S-12/S-13.** Tambah panel preview di ≥ 1024 px (Scope). Teks bantuan bagian Visual menjadi "Used for the homepage picture and the preview next to the cursor on the Work page." Previously: "…appear in the desktop preview from v2.1."
- **O-04 Toggle tema.** Urutan skrip inline menjadi `?theme=` → `rr-theme` → `dark`. Previously: `?theme=` → `rr-theme` → `prefers-color-scheme` → `dark`. Why: D-36.
- **E-07.** Tanpa JS tema selalu gelap (tidak ada lagi `@media (prefers-color-scheme: light)` untuk `:root:not([data-theme])`); toggle tema tetap tidak tampil. Previously: mengikuti setelan perangkat. Why: D-36.
- **E-31.** `localStorage` tidak tersedia → tema gelap; toggle tetap mengganti tema untuk sesi itu tanpa error. Previously: tema mengikuti perangkat. Why: D-36.
- **§11 i18n.** Data kartu angka diambil dari database (bukan key `peek.*`).

### ADDED (i18n)

- Key publik `cur.read` ("Read" / "Baca") dan `cur.visit` ("Visit" / "Kunjungi") di `i18n/en.json` dan `i18n/id.json`. Label admin panel preview ("Preview on the homepage", "Preview next to the cursor", tombol EN/ID) mengikuti cara admin v2.0.0 menyimpan teks UI (EN saja, G3).

## Delta: DESIGN_SPEC

Tidak ada file DESIGN_SPEC (konvensi v1/v2). Perubahan visual tercatat di Delta PRD §8.

## Delta: SDD

### ADDED

- **§4** `components/site/PointerLayer.tsx` (client, dynamic import) dan `components/admin/ProjectPreview.tsx` (client). Data preview dirender server sebagai markup tersembunyi di dalam `.peek`, bukan diambil lewat fetch.
- **§8 Motion** Aturan D-32..D-35; satu-satunya `requestAnimationFrame` di situs.
- **§8 Motion** Lapisan titik tetap (D-37) dengan `animation-timeline: scroll(root)`.

### MODIFIED

- **§8 Token tema.** Hapus `@media (prefers-color-scheme: light) :root:not([data-theme])`; `:root` tanpa `data-theme` memakai token gelap. `lib/theme.ts` `resolveTheme(query, stored)` tanpa argumen setelan perangkat. Previously: fallback tanpa JS mengikuti perangkat (E-07). Why: D-36.
- **§3/§5 Render & cache.** Tabel render: `revalidate = 300` menjadi `60` untuk `/[lang]` dan `/[lang]/work`, plus `expireTime: 120` (D-39). Previously: 300 tanpa `expireTime` (SWR ±1 tahun dari default Next). Why: D-39.
- **§4** `scripts/icons.mts` memakai token v2; file ikon di `app/` diganti (D-38).
- **§11 Testing.** E2E "tema tanpa flash" ditambah kasus perangkat `colorScheme: light` tanpa pilihan → gelap; unit `resolveTheme` disesuaikan.
- **§13 AGENTS.md.** Aturan JS klien: tambah "`PointerLayer` (khusus mouse, dimuat terpisah)". Previously: lapisan pointer dilarang sampai v2.1.0.

## Impact checklist

- [ ] Screens: S-01, S-02 (atribut + lapisan), S-12/S-13 (panel preview); semua layar publik dan admin (tema default). Route tidak berubah.
- [ ] Komponen: 2 komponen baru; `lib/theme.ts`, `styles/globals.css` (fallback tema, lapisan titik), `next.config.ts`, `revalidate` dua halaman, `scripts/icons.mts` + ikon `app/` diubah; tidak ada yang dihapus.
- [ ] URL/SEO: tidak berubah.
- [ ] Copy: label kursor `cur.read`/`cur.visit` (key baru) dan label panel preview admin.
- [ ] Data/API: tidak ada.
- [ ] Breaking? Tidak. Pengunjung yang sudah menyimpan pilihan tema tidak terpengaruh.

## Acceptance checks

- **AC-1.** Given desktop dengan mouse, When kursor di atas judul "HR System", Then cincin berlabel "Read" dan preview kartu angka "13 · group companies on one HR system" tampil di samping kursor.
- **AC-2.** Given HP atau tablet sentuh, When halaman dimuat, Then tidak ada request untuk chunk `PointerLayer` dan tidak ada elemen kursor yang terlihat.
- **AC-3.** Given mouse diam, When diukur 2 detik di Performance panel, Then tidak ada frame rAF yang berjalan.
- **AC-4.** Given reduced motion, Then tidak ada tilt dan lag, dan semua tautan tetap bekerja.
- **AC-5.** Given navigasi keyboard, When Tab dipakai, Then kursor kustom tersembunyi dan focus ring terlihat.
- **AC-6.** Lighthouse mobile tetap ≥ 90 dan INP desktop < 200 ms di `/` dan `/work` kedua tema.
- **AC-7.** Given form admin di ≥ 1024 px, When judul atau angka diketik, Then panel preview berubah langsung tanpa menyimpan.
- **AC-8.** Given perangkat disetel terang dan belum ada `rr-theme`, When membuka `/`, `/work`, atau `/admin/login`, Then frame pertama sudah gelap (tanpa flash); setelah toggle ke terang dan reload, tetap terang; `?theme=light` tetap terang.
- **AC-9.** Given JavaScript mati dan perangkat disetel terang, When membuka `/`, Then tema gelap dan semua konten tetap terbaca.
- **AC-10.** Given scroll pelan melewati batas bab di `/` dan `/work` (1280 dan 375 px, kedua tema), Then pola titik menyambung tanpa celah atau pudar di batas bab; dengan reduced motion titik diam; tidak ada CLS dan Performance tetap ≥ 90.
- **AC-11.** Tab browser, hasil Google, dan ikon layar utama memakai ikon v2 pilihan Pal; tidak ada amber.
- **AC-12.** Given proyek disimpan di admin produksi, When `/work` dibuka ulang setelah 2 menit, Then perubahan tampak; header `Cache-Control` HTML publik = `s-maxage=60, stale-while-revalidate=60`.

## Already implemented

Dari v2.0.0: atribut `data-cursor` pada judul dan tautan Selected work, token cahaya per bab (`--gx`, `--gy`, `--glow`, `--k`), data kartu angka di database dan admin, toggle tema + `rr-theme` + `?theme=`.
