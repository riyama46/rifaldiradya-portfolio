---
change: v2.1.0-pointer-layer
app: rifaldiradya.com
tier: full
bump: minor
base_version: 2.0.0
status: proposed
date: 2026-10-17
---

# Change v2.1.0 — Lapisan pointer dan preview admin

> **Status: direncanakan, belum disetujui untuk build.** Bagian ini sengaja ditunda dari v2.0.0 (D-27 di `docs/decisions/DECISIONS.md`; change v2.0.0 diarsipkan di `docs/changes/archive/2026-10-18-v2.0.0-showcase-redesign/`). Mulai build setelah v2.0.0 live. Pal cukup bilang "approve dan build v2.1.0".
>
> Sebelum build, builder wajib:
> 1. memastikan v2.0.0 sudah dirilis dan sudah di-merge ke `docs/specs/`;
> 2. menyesuaikan `base_version` dengan tag terakhir (mis. 2.0.3);
> 3. mengecek ulang bahwa atribut `data-cursor` dan token cahaya dari v2.0.0 masih ada;
> 4. mengubah status jadi `approved`.
>
> Rujukan visual dan perilaku: JS dan CSS kursor di `docs/design/v2/option-b.html` (`.spot`, `.cur-dot`, `.cur-ring`, `.peek`, `.shot`) dan panel preview di `docs/design/v2/admin.html`. Kalau mockup berbeda dengan dokumen ini, dokumen ini yang menang.

## Why

Lapisan pointer adalah bagian desain yang diminta eksplisit (D-09) dan menunjukkan craft kepada pengunjung desktop. Lapisan ini ditunda karena mayoritas pengunjung memakai HP, merupakan satu-satunya JS tambahan, dan menjadi risiko terbesar untuk INP dan Lighthouse. Dengan v2.0.0 sudah live, lapisan ini bisa ditambahkan tanpa membongkar apa pun.

Lane MINOR: hanya menambah, tanpa perubahan struktur, URL, atau data.

## Scope

**In**

- Kursor kustom: titik + cincin yang tertinggal sedikit; cincin membesar di atas tautan/tombol; berlabel "Read" / "Visit" (`cur.read`, `cur.visit`) sesuai `data-cursor`; mengecil saat ditekan. Kursor bawaan disembunyikan hanya saat lapisan aktif.
- Cahaya yang mengikuti kursor (`.spot`, ±820 px) dengan warna dan kekuatan per bab (`data-zone` di `<html>`, ditentukan oleh bab yang sedang di tengah layar). Saat aktif, cahaya CSS statis per bab (`.depth .glow`) disembunyikan supaya tidak dobel.
- Preview di samping kursor (340 px, 16:10) saat hover judul Selected work dan baris Work: screenshot untuk `visual_type = screenshot`, kartu angka (`card_number` + caption) untuk `visual_type = number` (D-11 v2.0.0).
- Tilt screenshot di Selected work (`perspective` + `rotateX/Y` maks. sekitar 6°, transisi 500 ms).
- Admin S-12/S-13: panel preview di ≥ 1024 px, "Preview on the homepage" (meta, judul, deskripsi) dan "Preview next to the cursor" (screenshot atau kartu angka), diperbarui saat mengetik, EN dengan tombol ganti ke ID.

**Out**

- Perubahan copy, data, API, URL, atau tampilan di HP dan tablet.
- Library animasi atau dependency baru.

## Decisions

- **D-29 — Lapisan pointer hanya untuk mouse.** Aktif hanya bila `(hover: hover) and (pointer: fine)` cocok dan event berasal dari `pointerType === "mouse"`. Bila media query berubah (mis. tablet dengan keyboard dicabut), lapisan dimatikan dan semua class dibersihkan. · Alasan: D-09. · Ditolak: aktif di layar sentuh.
- **D-30 — Satu client component, rAF yang berhenti saat diam.** Satu komponen `PointerLayer` (dimuat dengan dynamic import setelah idle, hanya bila media query cocok, sehingga JS-nya tidak ada di bundle HP). Satu loop `requestAnimationFrame` yang berhenti ketika titik, cincin, dan cahaya sudah mencapai posisi kursor (selisih < 0,4 px), lalu menyala lagi pada `pointermove`. Hanya `transform` dan `opacity`. · Alasan: INP dan baterai.
- **D-31 — Zona cahaya lewat IntersectionObserver** (`rootMargin: -45% 0 -45% 0`) yang menulis `data-zone`; tanpa listener `scroll`. · Alasan: aturan v2 "tanpa listener scroll".
- **D-32 — Reduced motion.** Dengan `prefers-reduced-motion: reduce`: titik dan cincin tetap (sebagai penanda), tetapi tanpa lag (langsung di posisi), tanpa tilt, cahaya tanpa transisi; preview tetap tampil tanpa animasi masuk. · Alasan: tetap informatif tanpa gerak.
- **D-33 — Aksesibilitas tidak bergantung pada lapisan ini.** Label "Read"/"Visit" dan preview bersifat `aria-hidden`; arti tautan tetap dari teksnya. Kursor bawaan kembali muncul saat fokus keyboard dipakai (`:focus-visible` di mana pun → lapisan disembunyikan sampai mouse bergerak lagi).

## Delta: PRD

### ADDED

- **§8 Motion.** Baris tabel: kursor (titik + cincin berlabel), cahaya mengikuti kursor per bab, preview samping kursor, tilt screenshot, semuanya khusus mouse (D-29..D-33).
- **§10 NFR Performance.** JS lapisan pointer ≤ 3 KB gzip, dimuat terpisah dan hanya di perangkat mouse; tidak ada long task > 50 ms dari lapisan ini saat menggerakkan mouse di halaman Work (Performance panel); INP tetap < 200 ms.

### MODIFIED

- **§7 Out of scope.** Hapus baris "lapisan pointer + preview admin → v2.1.0". Previously: ditunda di v2.0.0. Why: dikerjakan di change ini.

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
- **§11 i18n.** Key `cur.read`, `cur.visit` sekarang dirender. Data kartu angka diambil dari database (bukan key `peek.*`).

## Delta: DESIGN_SPEC

Tidak ada file DESIGN_SPEC (konvensi v1/v2). Perubahan visual tercatat di Delta PRD §8.

## Delta: SDD

### ADDED

- **§4** `components/site/PointerLayer.tsx` (client, dynamic import) dan `components/admin/ProjectPreview.tsx` (client). Data preview dirender server sebagai markup tersembunyi di dalam `.peek`, bukan diambil lewat fetch.
- **§8 Motion** Aturan D-30..D-33; satu-satunya `requestAnimationFrame` di situs.

### MODIFIED

- **§13 AGENTS.md.** Aturan JS klien: tambah "`PointerLayer` (khusus mouse, dimuat terpisah)". Previously: lapisan pointer dilarang sampai v2.1.0.

## Impact checklist

- [ ] Screens: S-01, S-02 (atribut + lapisan), S-12/S-13 (panel preview). Route tidak berubah.
- [ ] Komponen: 2 komponen baru; tidak ada yang dihapus.
- [ ] URL/SEO: tidak berubah.
- [ ] Copy: hanya label kursor (sudah ada di kamus).
- [ ] Data/API: tidak ada.
- [ ] Breaking? Tidak.

## Acceptance checks

- **AC-1.** Given desktop dengan mouse, When kursor di atas judul "HR System", Then cincin berlabel "Read" dan preview kartu angka "13 · group companies on one HR system" tampil di samping kursor.
- **AC-2.** Given HP atau tablet sentuh, When halaman dimuat, Then tidak ada request untuk chunk `PointerLayer` dan tidak ada elemen kursor yang terlihat.
- **AC-3.** Given mouse diam, When diukur 2 detik di Performance panel, Then tidak ada frame rAF yang berjalan.
- **AC-4.** Given reduced motion, Then tidak ada tilt dan lag, dan semua tautan tetap bekerja.
- **AC-5.** Given navigasi keyboard, When Tab dipakai, Then kursor kustom tersembunyi dan focus ring terlihat.
- **AC-6.** Lighthouse mobile tetap ≥ 90 dan INP desktop < 200 ms di `/` dan `/work` kedua tema.
- **AC-7.** Given form admin di ≥ 1024 px, When judul atau angka diketik, Then panel preview berubah langsung tanpa menyimpan.

## Already implemented

Dari v2.0.0: atribut `data-cursor` pada judul dan tautan Selected work, token cahaya per bab (`--gx`, `--gy`, `--glow`, `--k`), data kartu angka di database dan admin.
