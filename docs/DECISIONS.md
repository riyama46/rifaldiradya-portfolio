# DECISIONS.md

Catatan keputusan yang menyimpang dari atau melengkapi docs. Format: tanggal · keputusan · alasan.

| Tanggal | Keputusan | Alasan |
| --- | --- | --- |
| 2026-09-28 | Desain homepage v3 (panel bukti bergantian di hero, label section bernomor, Brief → Build → Live, About dengan highlight + blok fakta, CTA akhir dipusatkan, motion CSS). PRD, App Flow, SDD sudah diperbarui. | Versi awal terasa terlalu plain; semua tambahan tetap CSS-first supaya target Lighthouse ≥ 90 aman. |
| 2026-09-28 | Versi kanonik `https://rifaldiradya.com` (non-www); www → 301 lewat aturan 1 `proxy.ts`. | Konsisten dengan email dan semua docs; satu alamat untuk SEO. |
| 2026-09-28 | Zona waktu GMT+7, `availableForWork = true`, footer hanya LinkedIn. | Dikonfirmasi Pal. |
| 2026-09-28 | WordPress lama di rifaldiradya.com tidak dibutuhkan; tetap di-backup lalu diganti di Fase 4. | Dikonfirmasi Pal. |
| 2026-09-28 | T-01: Next.js 16.3.6 (terbaru saat init; naik ke 16.3.7 begitu security release keluar), React 19.2.8, Tailwind v4, ESLint 9 + `eslint-config-prettier`, Prettier 3. `globals.css` dipindah ke `styles/` sesuai SDD bagian 4. | `eslint-config-prettier` mematikan aturan ESLint yang bentrok dengan Prettier (tambahan kecil, tanpa kode runtime). |
