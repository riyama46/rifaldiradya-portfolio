# DECISIONS.md

Catatan keputusan yang menyimpang dari atau melengkapi docs. Format: tanggal · keputusan · alasan.

| Tanggal | Keputusan | Alasan |
| --- | --- | --- |
| 2026-09-28 | Desain homepage v3 (panel bukti bergantian di hero, label section bernomor, Brief → Build → Live, About dengan highlight + blok fakta, CTA akhir dipusatkan, motion CSS). PRD, App Flow, SDD sudah diperbarui. | Versi awal terasa terlalu plain; semua tambahan tetap CSS-first supaya target Lighthouse ≥ 90 aman. |
| 2026-09-28 | Versi kanonik `https://rifaldiradya.com` (non-www); www → 301 lewat aturan 1 `proxy.ts`. | Konsisten dengan email dan semua docs; satu alamat untuk SEO. |
| 2026-09-28 | Zona waktu GMT+7, `availableForWork = true`, footer hanya LinkedIn. | Dikonfirmasi Pal. |
| 2026-09-28 | WordPress lama di rifaldiradya.com tidak dibutuhkan; tetap di-backup lalu diganti di Fase 4. | Dikonfirmasi Pal. |
| 2026-09-28 | T-02: `--color-success` digelapkan dari `oklch(55% 0.13 150)` ke `oklch(51% 0.13 150)`. | Cek kontras: L55 hanya 4,38:1 di bg dan 4,07:1 di surface (teks "Live" 14 px butuh 4,5:1). L51 = 5,19 / 4,82 / 5,41:1 di bg / surface / raised. Semua pasangan token lain sudah lolos AA (putih di amber 5,83:1). |
| 2026-09-28 | T-02: tema Tailwind memakai `--color-*: initial` (hanya warna token yang tersedia), skala tipe semantik (`text-display`, `text-heading`, `text-lead`, `text-eyebrow`, dll.), breakpoint `xl` = 1200 px. Motion khusus hero ditambahkan di T-08/T-09 bersama komponennya. | Menegakkan aturan "komponen hanya memakai token" di level tooling. |
| 2026-09-28 | T-01: Next.js 16.3.6 (terbaru saat init; naik ke 16.3.7 begitu security release keluar), React 19.2.8, Tailwind v4, ESLint 9 + `eslint-config-prettier`, Prettier 3. `globals.css` dipindah ke `styles/` sesuai SDD bagian 4. | `eslint-config-prettier` mematikan aturan ESLint yang bentrok dengan Prettier (tambahan kecil, tanpa kode runtime). |
| 2026-09-28 | Section Selected work di homepage menampilkan maks. 6 project published (grid ke bawah, 1/2/3 kolom), terpisah dari panel hero (featured, maks. 3). Tombol "View all work ({n})" jika total > 6. Tidak ada slide/marquee ke samping. | Disetujui Pal. Grid ke bawah membuat semua project terlihat tanpa interaksi; slide otomatis ditolak karena menyembunyikan project, sulit diklik, dan bersaing dengan rotasi di hero. |
| 2026-09-28 | Grid project (homepage dan `/work`) naik ke 3 kolom di ≥ 1200 px hanya jika ada ≥ 3 kartu; 1–2 kartu tetap 2 kolom lebar. Jumlah kolom ditentukan di server dari jumlah item. | Disetujui Pal. Mencegah kolom kosong yang membuat portfolio kecil terlihat tipis. |
| 2026-09-28 | Email `hello@rifaldiradya.com` sudah lolos syarat deliverability: SPF (`include:_spf.mail.hostinger.com`), DKIM (`hostingermail-a/b/c`), DMARC (`p=none`), MX Hostinger. Redirect www → non-www juga sudah aktif di level Hostinger. | Dicek via DNS dan HTTP. DMARC bisa diperketat ke `p=quarantine` setelah beberapa minggu tanpa masalah. |
