# App Flow Document — rifaldiradya.com v1

Sep 27, 2026 · @Pal

> **Revisi 28 Sep 2026 — desain homepage v3.** Diperbarui: G2 (footer), S-01 (hero dua kolom, label section, alur Brief → Build → Live, About, CTA akhir), spesifikasi baru HeroProofPanel, UF-01, E-21 s.d. E-24, event `project_link_click`, kamus i18n, dan batasan coding AI bagian 12. Referensi visual: `docs/design/homepage-mockup.html`.

## 1. Cara pakai & aturan global

Dokumen ini adalah blueprint implementasi v1: setiap layar, elemen, flow, state, dan kontrak data yang boleh dibangun. **Kalau sesuatu tidak ada di sini, jangan dibangun; kalau ambigu, tanya dulu.** Sumber "apa & kenapa" ada di PRD; sumber "teknologi & arsitektur" ada di SDD.

**Konvensi ID:** layar `S-xx`, overlay `O-xx`, flow `UF-xx`, edge case `E-xx`, endpoint `API-xx`, fitur PRD `F1–F9`.

**G1 — Locale dari URL, bukan dari tebakan.**

- Locale ditentukan hanya dari path: diawali `/id` → `id`, selain itu → `en`.
- Server tidak pernah redirect berdasarkan `Accept-Language`, IP, atau cookie. `Accept-Language` hanya dipakai untuk memutuskan tampil/tidaknya banner saran (O-02).
- `<html lang>` = locale halaman. Semua string UI diambil dari kamus i18n per locale (bagian 11).

**G2 — Layout shell publik (semua S-01 s.d. S-04)**

1. Skip link "Skip to content" / "Langsung ke konten" (muncul saat fokus keyboard).
2. O-02 banner saran bahasa (kondisional, di atas navbar).
3. Navbar sticky: nama "Rifaldi Radya Pratama" (link ke home locale aktif) · link "Work"/"Hasil Kerja" · O-01 toggle EN|ID · tombol "Email me"/"Email saya" (mailto). Di < 768 px: nama disingkat "Rifaldi R.P.", link Work tetap tampil, tombol email jadi ikon dengan `aria-label`.
4. `<main id="content">` isi halaman.
5. Footer: blok CTA akhir (rata tengah: label `04 Contact`, H2 dengan highlighter, kalimat arahan, tombol mailto besar, lalu "or copy" + alamat `hello@rifaldiradya.com` + tombol Copy) · garis tipis · link Privacy · link "Cookie settings" (buka O-03) · link "LinkedIn" (tab baru, `rel="noopener noreferrer"`, `aria-label` "LinkedIn (opens in new tab)" / "LinkedIn (buka di tab baru)", ikon ↗) · © tahun berjalan. Blok CTA tampil di semua layar publik kecuali S-04.
6. O-03 cookie consent (kondisional, menempel di bawah layar).

**G3 — Layout shell admin (S-10 s.d. S-13):** header sederhana ("Portfolio Admin" · link "View site" tab baru · tombol Logout), tanpa footer publik, tanpa O-01/O-02/O-03, tanpa GA4. Bahasa UI admin: EN saja. Semua halaman admin mengirim `noindex, nofollow`.

**G4 — Cookies yang boleh ada**

| Cookie | Isi | Umur | Diset oleh |
| --- | --- | --- | --- |
| `lang_pref` | `en` \| `id` | 365 hari | O-01 klik, O-02 aksi apa pun |
| `consent` | `granted` \| `denied` | 180 hari | O-03 |
| `admin_session` | token sesi (httpOnly, secure, sameSite=lax) | 7 hari | API-01 |
| `_ga`, `_ga_*` | cookie GA4 | sesuai GA4 | GA4, hanya setelah `consent=granted` |

Tidak ada cookie lain dan tidak ada `localStorage` untuk state penting.

**G5 — Konten dinamis vs statis:** data project (judul, deskripsi, gambar, URL, tag, featured, urutan) selalu dari database. Copy hero, service, about, privacy, dan semua label UI dari kamus i18n di repo. Halaman publik dirender statis dan direvalidasi saat admin mengubah data.

## 2. Inventaris layar

v1 punya 8 layar publik (4 per bahasa), 4 layar admin, dan 3 overlay. Tidak ada layar lain.

| ID | Route EN | Route ID | Akses | Render | Tujuan | Fitur |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | `/` | `/id` | Publik | Statis + revalidasi | Homepage: jual promise, tunjukkan bukti, arahkan ke email | F1, F3, F5 |
| S-02 | `/work` | `/id/work` | Publik | Statis + revalidasi | Semua project published | F2, F3 |
| S-03 | `/privacy` | `/id/privacy` | Publik | Statis | Kebijakan privasi & cookie | F8 |
| S-04 | 404 (path tak dikenal) | 404 di bawah `/id/*` | Publik | Statis | Not found per bahasa | F9 |
| S-10 | `/admin/login` | — | Publik (noindex) | Dinamis | Form login | F6 |
| S-11 | `/admin` | — | Butuh sesi | Dinamis | Daftar project | F7 |
| S-12 | `/admin/projects/new` | — | Butuh sesi | Dinamis | Form buat project | F7 |
| S-13 | `/admin/projects/[id]` | — | Butuh sesi | Dinamis | Form edit + hapus project | F7 |
| O-01 | Toggle bahasa (navbar) |  | Publik | Client | Pindah ke halaman padanan | F4 |
| O-02 | Banner saran bahasa |  | Publik | Client | Tawarkan versi ID ke browser berbahasa Indonesia | F4 |
| O-03 | Cookie consent |  | Publik | Client | Minta izin analytics | F8 |

Aturan route tambahan:

- `www.rifaldiradya.com/*` → redirect 301 ke `https://rifaldiradya.com/*` (path dan query sama); versi non-www adalah kanonik.
- `/en` dan `/en/*` → redirect 301 ke path tanpa prefix (mis. `/en/work` → `/work`), supaya tidak ada duplikat.
- Trailing slash dihapus dengan redirect permanen (`/work/` → `/work`); bawaan Next.js memakai 308.
- Semua `/admin/*` kecuali `/admin/login` tanpa sesi valid → redirect 302 ke `/admin/login?next=<path>`.
- `/admin/login` dengan sesi valid → redirect ke `/admin`.
- `/admin/projects/[id]` dengan id tidak ada → S-11 dengan toast "Project not found".

## 3. Peta navigasi

Pengunjung hanya punya dua pintu keluar yang penting: situs project live dan email. Admin tidak pernah ditautkan dari halaman publik.

&#91;embedded content: peta navigasi v1 · publik dan admin terpisah\]

Navigasi yang tidak digambar supaya diagram tetap terbaca:

- Navbar & footer (G2) ada di semua layar publik: nama → S-01, Work → S-02, Privacy → S-03, toggle → halaman padanan di locale lain, email → email app.
- Kartu project di S-01 dan S-02 sama-sama keluar ke situs live.
- S-04 punya tombol ke S-01 dan S-02.
- S-12 dan S-13 kembali ke S-11 setelah Save, Cancel, atau Delete (S-13).
- Header admin: "View site" membuka `/` di tab baru; Logout → S-10.

## 4. Spesifikasi layar publik

Semua layar publik memakai shell G2. Teks di tanda kutip adalah copy EN; padanan ID ada di kamus i18n (bagian 11), dirujuk lewat key `[key]`.

### S-01 Homepage (`/`, `/id`)

Urutan section tetap; tidak boleh ada section tambahan. Section 2–5 diawali SectionHeader: garis tipis + label bernomor `[label.*]` (`01 Services`, `02 Work`, `03 About`, `04 Contact`) + H2. Label bersifat dekoratif-informatif, bukan heading (pakai `<p>`, bukan `<h*>`).

| # | Section | Elemen (urut) | Aturan |
| --- | --- | --- | --- |
| 1 | Hero `#top` | **Kolom kiri:** BylineBadge (avatar 64/72 px + "Rifaldi Radya Pratama" + "Web Developer") → H1 `[hero.title]` (highlighter amber pada "Days"/"Hari", "Not Weeks"/"Bukan Minggu" warna muted) → subheadline `[hero.subtitle]` → tombol primer `[hero.ctaPrimary]` "See the Work" → link sekunder `[hero.ctaSecondary]` "Email Me About Your Project" → MetaRow (`[meta.available]` dengan StatusDot jika flag aktif · `[meta.location]` · `[meta.remote]` · "EN / ID"). **Kolom kanan:** HeroProofPanel (lihat spesifikasi di bawah). | Rata kiri. Dua kolom di ≥ 1024 px, satu kolom di bawahnya (panel di bawah MetaRow). Tombol primer scroll halus ke `#work` dan memindahkan fokus ke heading `#work`. Avatar: foto jika aset ada, jika tidak inisial "RR" di lingkaran `--color-accent-soft`. Di 375 × 667, H1 + tombol primer harus terlihat tanpa scroll walau O-03 tampil. Latar hero bertekstur grid (dekoratif, `aria-hidden`). |
| 2 | Services `#services` | SectionHeader `01` + H2 `[services.title]` "What I build" → ServiceTile utama (badge `[services.primary.badge]` "Main focus", judul, deskripsi, ProcessSteps `[steps.1–3]` + keterangan `[steps.1d–3d]`) → ServiceTile sekunder (badge "For bigger projects", judul, deskripsi) | Tile utama lebih besar/menonjol (border aksen); di ≥ 768 px dua tile berdampingan rasio 3:2, di mobile menumpuk. Tile tidak bisa diklik. ProcessSteps berupa `<ol>` 3 kolom; langkah terakhir memakai StatusDot hijau. |
| 3 | Featured work `#work` | SectionHeader `02` + H2 `[work.featuredTitle]` "Selected work" → grid ProjectCard (0–3 item) → tombol `[work.viewAll]` "View all work" + ikon → ke S-02 locale aktif | Data: `published=true AND featured=true`, urut `sort_order` asc, lalu `created_at` desc, limit 3 (data yang sama dipakai HeroProofPanel). Jika 0 item → section tetap tampil dengan EmptyState (E-01). |
| 4 | About `#about` | SectionHeader `03` + H2 `[about.title]` "Who you'll work with" → lead `[about.lead]` → body `[about.body]` → AboutFacts (`<dl>`: `[facts.based*]`, `[facts.work*]`, `[facts.focus*]`, `[facts.lang*]`, Stack sebagai tag teks) | Grid 1:2 di ≥ 1024 px. Lead dan body boleh berisi penanda `<mark>` (maks. 2 per section) dan `<strong>` lewat rich-text i18n (SDD bagian 5). Maks lebar teks 62ch. Stack = teks, bukan logo. |
| 5 | CTA akhir (bagian footer) | Label `[label.contact]` → H2 `[cta.title]` "Have a page to launch?" (highlighter pada "launch"/"diluncurkan") → `[cta.sub]` → tombol mailto `[cta.button]` + ikon → → `[cta.or]` + alamat email teks + tombol Copy | Rata tengah, padding vertikal 112 px (mobile) / 176 px (desktop). Lihat perilaku email di UF-03. |

**HeroProofPanel (S-01 hero, kolom kanan)**

| Elemen | Sumber | Aturan |
| --- | --- | --- |
| Data | project `featured=true AND published=true`, urutan sama dengan Featured work, maks. 3 | Satu query dipakai bersama section 3. 0 item → panel tidak dirender (E-21); 1 item → statis tanpa kontrol (E-22). |
| Frame | statis | Bar: 3 titik dekoratif, URL `live_url` tanpa `https://`, StatusDot + "Live". Isi: thumbnail rasio 16:10, `alt_{locale}`. Kartu bayangan di belakang frame (dekoratif). Seluruh frame adalah satu `<a>` ke `live_url` (`target=_blank`, `rel="noopener noreferrer"`, `aria-label` = `[hero.proofAria]`). |
| Caption | `title_{locale}` | `[hero.proofLabel]` "Latest work" · judul project aktif · link `[card.visitShort]` "Visit" + ikon ↗ ke `live_url` (tab baru). |
| Kontrol | statis | Tombol `01`, `02`, `03` (`aria-pressed` = aktif) masing-masing dengan progress bar; tombol pause/play ikon dengan `aria-label` `[slider.pause]` / `[slider.play]`. Kontrol berada di luar elemen `<a>`. |
| Rotasi | client | Ganti ke project berikutnya setiap 6 detik (berputar kembali ke 01). Klik tombol nomor → langsung ke project itu dan timer mulai ulang. Hover atau fokus di dalam panel → jeda; pause → berhenti sampai play. `prefers-reduced-motion: reduce` → tidak ada rotasi otomatis, progress bar tampil penuh. Tidak ada `aria-live` (pergantian tidak diumumkan screen reader). |
| Gambar | Cloudinary | Gambar slide 1 dimuat prioritas (kandidat LCP desktop), `sizes="(min-width:1024px) 560px, 100vw"`. Gambar slide 2–3 dimuat setelah halaman idle, paling lambat sebelum rotasi pertama. Ruang frame dicadangkan dengan `aspect-ratio` (anti-CLS). |
| Analytics | — | Klik frame atau link Visit → `project_link_click` dengan `placement: hero_panel`. |

**ProjectCard (dipakai di S-01 dan S-02)**

| Elemen | Sumber | Aturan |
| --- | --- | --- |
| Thumbnail | `thumbnail.url`, alt `alt_{locale}` | Rasio 16:10, `object-fit: cover`, lazy kecuali 1 kartu pertama di S-02. Jika thumbnail gagal dimuat → blok warna `--color-surface` + judul (E-05). |
| Status | statis | StatusDot hijau berdenyut + "Live" / "Live". |
| Judul (H3) | `title_{locale}` | Maks 2 baris, sisanya dipotong dengan ellipsis. |
| Deskripsi | `summary_{locale}` | Maks 160 karakter (dijaga validasi, tidak dipotong di UI). |
| Tag | `tags[]` | Maks 4 pill, teks apa adanya (tidak diterjemahkan). |
| Tombol | `live_url` | `[card.visit]` "Visit live site" + ikon ↗, `target=_blank`, `rel="noopener noreferrer"`, `aria-label` = "Visit {title} (opens in new tab)". Seluruh kartu tidak dijadikan satu link besar; hanya tombol ini dan thumbnail yang bisa diklik (keduanya ke URL sama). Hover kartu: naik 3 px + shadow lebih dalam, thumbnail sedikit membesar. |

### S-02 Work (`/work`, `/id/work`)

1. H1 `[workPage.title]` "Work" + paragraf pendek `[workPage.intro]`.
2. Grid ProjectCard: 1 kolom < 768 px, 2 kolom ≥ 768 px, 3 kolom ≥ 1200 px, gap 24 px.
3. Data: `published=true`, urut `sort_order` asc lalu `created_at` desc, tanpa limit, tanpa paginasi, tanpa filter.
4. Di bawah grid: CTA "Like what you see?" + tombol email.
5. 0 project → EmptyState E-01.

### S-03 Privacy (`/privacy`, `/id/privacy`)

H1 + teks statis dari kamus i18n: apa yang dilacak (GA4, anonim, hanya dengan izin), cookie yang dipakai (tabel G4 versi ramah pembaca), cara mengubah pilihan (tombol "Cookie settings" yang membuka O-03), kontak email. Tidak ada data dinamis.

### S-04 Not found

Status HTTP 404. Locale mengikuti prefix path (`/id/xyz` → versi ID). Isi: H1 `[notFound.title]` "This page doesn't exist", satu kalimat, tombol ke S-01 dan S-02. Navbar dan footer tetap tampil. `noindex`.

## 5. Overlay global

Tiga overlay ini muncul di semua layar publik dan tidak pernah di admin. Banner bahasa dan GA4 hanya aktif kalau semua syaratnya terpenuhi.

&#91;embedded content: logika tampil O-02 dan O-03\]

### O-01 Toggle bahasa

- Tampilan: dua tombol teks EN dan ID dipisah garis tipis; yang aktif bergaya aksen dan diberi `aria-current`. Grup punya `aria-label` Language.
- Klik bahasa yang tidak aktif: set `lang_pref`, kirim event `language_switch` (jika consent), navigasi ke path padanan: `/` ↔ `/id`, `/work` ↔ `/id/work`, `/privacy` ↔ `/id/privacy`; hash anchor ikut dibawa (`/#work` → `/id#work`). Dari S-04 → homepage locale tujuan.
- Klik bahasa yang sudah aktif: tidak terjadi apa-apa.
- Toggle adalah link `<a href>` asli (bisa dibuka di tab baru, bisa di-crawl), bukan tombol JS saja.

### O-02 Banner saran bahasa

- Dievaluasi di client setelah halaman tampil, tanpa memblokir render dan tanpa menggeser layout (bar tinggi tetap 48 px di bawah navbar, ruangnya sudah dicadangkan atau muncul sebagai overlay).
- Syarat tampil (lihat diagram): path bukan `/id*`, cookie `lang_pref` tidak ada, dan `navigator.languages` berisi entri yang diawali `id`.
- Isi: Also available in Indonesian. + tombol Lihat versi Indonesia + tombol tutup (ikon silang, `aria-label` Dismiss).
- Lihat versi Indonesia → set `lang_pref=id` → buka halaman padanan ID. Tutup → set `lang_pref=en` → banner hilang. Keduanya permanen sampai cookie habis.
- Di mobile tidak tampil bersamaan dengan O-03: jika O-03 tampil, O-02 menunggu sampai O-03 ditutup.

### O-03 Cookie consent

- Muncul jika cookie `consent` belum ada. Posisi: bar di bawah layar (mobile full-width, desktop kartu kanan bawah maks 420 px). Tidak menutupi CTA hero di 375 × 667.
- Isi: 1–2 kalimat `[consent.body]` + link Privacy + tombol Accept dan Reject dengan bobot visual setara (tanpa dark pattern).
- Accept → `consent=granted` → update Consent Mode (`analytics_storage: granted`) → GA4 mengirim `page_view` halaman saat ini. Reject → `consent=denied`, GA4 tidak menyimpan cookie.
- Link footer Cookie settings dan tombol di S-03 membuka O-03 lagi dengan pilihan saat ini ditandai. Mengubah dari granted ke denied juga menghapus cookie `_ga*` yang ada.
- User mengabaikan banner: dianggap denied, banner muncul lagi di halaman berikutnya.

## 6. Spesifikasi layar admin

Semua layar admin memakai shell G3, satu kolom di < 768 px, input font ≥ 16 px, dan tombol aksi utama selalu terlihat tanpa scroll horizontal.

### S-10 Login (`/admin/login`)

| Elemen | Aturan |
| --- | --- |
| Heading | "Sign in" |
| Email | `type=email`, `autocomplete=username`, wajib |
| Password | `type=password`, `autocomplete=current-password`, wajib, tombol show/hide |
| Tombol | "Sign in"; saat submit → disabled + spinner, teks "Signing in…" |
| Error kredensial | Di atas form: "Email or password is incorrect." Field password dikosongkan, fokus ke password. |
| Error rate limit | "Too many attempts. Try again in {n} minutes." Tombol disabled sampai waktu habis. |
| Sukses | Redirect ke `next` (jika path `/admin*` yang valid) atau `/admin`. |

Tidak ada link "forgot password" dan "sign up". Reset password dilakukan manual lewat skrip/ENV (dijelaskan di SDD).

### S-11 Project list (`/admin`)

- Header halaman: "Projects" + jumlah ("2 projects") + tombol primer "New project" → S-12.
- Daftar baris (desktop: tabel; mobile: kartu bertumpuk), urut `sort_order` asc lalu `created_at` desc. Tiap baris: thumbnail 64 × 40 · judul EN (link ke S-13) · badge status "Published" / "Draft" · badge "Featured" jika true · angka urutan · tanggal update relatif ("2 days ago") · tombol "Edit".
- Tidak ada inline toggle, drag-and-drop, atau bulk action di v1; semua perubahan lewat S-13.
- Info kecil di bawah header: "Featured on homepage: {n}/3". Jika n > 3, tampilkan peringatan kuning "Only the first 3 featured projects appear on the homepage." (E-08).
- Empty state (0 project): "No projects yet. Add your first one to show it on the site." + tombol "New project".
- Toast sukses dari aksi sebelumnya ("Project created", "Changes saved", "Project deleted") tampil 4 detik, `role=status`.

### S-12 New project dan S-13 Edit project

Form yang sama. S-13 terisi data dan punya zona hapus.

| # | Field | Tipe UI | Validasi | Bantuan |
| --- | --- | --- | --- | --- |
| 1 | Title (EN) | text | wajib, 1–80 karakter | — |
| 2 | Title (ID) | text | wajib, 1–80 karakter | — |
| 3 | Summary (EN) | textarea + counter | wajib, 1–160 karakter | Tampil di kartu |
| 4 | Summary (ID) | textarea + counter | wajib, 1–160 karakter | — |
| 5 | Live URL | url | wajib, `https://`, URL valid, maks 300 | "Opens in a new tab on the site" |
| 6 | Tags | input chip (Enter/koma untuk tambah) | 0–4 tag, tiap tag 1–24 karakter, unik | Contoh: Next.js, Tailwind |
| 7 | Thumbnail | ImageUploader (drag/drop + pilih file) + preview 16:10 | JPG/PNG/WebP, ≤ 5 MB, min 1200 px lebar; wajib jika Published = on | "Recommended 1600 × 1000" |
| 8 | Thumbnail alt (EN) | text | wajib jika ada thumbnail, 1–140 | Deskripsikan isi gambar |
| 9 | Thumbnail alt (ID) | text | wajib jika ada thumbnail, 1–140 | — |
| 10 | Sort order | number | integer 0–999, default 100 | "Lower shows first" |
| 11 | Featured | switch | — | "Show on homepage (max 3)" |
| 12 | Published | switch | Publish butuh field 1–5, 7–9 valid | Off = draft, tidak tampil di situs |

- Layout: field EN dan ID berdampingan di ≥ 1024 px, bertumpuk (EN dulu) di bawahnya. Tidak memakai tab bahasa supaya kedua versi terlihat bersamaan.
- Tombol bawah (sticky di mobile): "Save" primer + "Cancel" sekunder. Save disabled saat upload berjalan.
- Validasi client saat blur + validasi server saat submit; pesan error di bawah field, menyebut cara memperbaiki (bagian 11). Saat submit gagal, fokus pindah ke field error pertama dan ringkasan error muncul di atas form.
- Cancel dengan perubahan belum disimpan → dialog "Discard changes?" (Discard / Keep editing). Navigasi browser keluar juga memicu peringatan `beforeunload`.
- ImageUploader: pilih file → validasi tipe & ukuran di client → upload langsung (API-06) dengan progress bar → preview → tombol "Replace" dan "Remove". Gambar lama di storage baru dihapus setelah project berhasil disimpan dengan gambar baru.
- **Zona hapus (S-13 saja):** di paling bawah, dipisah garis, tombol merah "Delete project" → ConfirmDialog "Delete {title EN}? This removes it from the site and deletes its image. This can't be undone." (Delete / Cancel). Fokus awal di Cancel.

## 7. User flows

10 flow di bawah adalah semua jalur yang harus berfungsi di v1. Setiap langkah menyebut layar dan hasil yang diharapkan.

### UF-01 Klien Upwork menilai portfolio (EN) — flow utama

1. Klien klik link rifaldiradya.com dari profil/proposal Upwork → S-01 `/`, tanpa banner O-02 (browser non-ID).
2. O-03 muncul di bawah; klien memilih Accept/Reject atau mengabaikannya. Hero tetap terbaca.
3. Klien membaca H1 + subheadline dan melihat panel bukti berganti antar project. Klien bisa langsung klik frame panel (situs live terbuka di tab baru, event `project_link_click` `placement: hero_panel`) atau klik "See the Work" → scroll ke `#work`.
4. Klien klik "Visit live site ↗" di kartu → situs project terbuka di tab baru (event `project_link_click` `placement: card`).
5. Klien kembali ke tab portfolio (posisi scroll tetap), lanjut ke About atau "View all work" → S-02.
6. Klien klik CTA email → lanjut UF-03.

### UF-02 Pengunjung lokal pindah ke versi Indonesia

1. Pengunjung dengan browser berbahasa Indonesia membuka `/` → S-01 EN + O-02 muncul (jika O-03 tidak sedang tampil di mobile).
2. Klik "Lihat versi Indonesia" → `lang_pref=id` → `/id`.
3. Kunjungan berikutnya ke `/`: O-02 tidak muncul lagi (cookie ada); pengunjung tetap bisa pakai toggle.
4. Alternatif: klik tutup di O-02 → `lang_pref=en`, tetap di EN.

### UF-03 Menghubungi via email

1. Klik tombol email (navbar, hero sekunder, CTA footer, atau S-02) → event `contact_email_click` dengan `location` → browser membuka `mailto:hello@rifaldiradya.com?subject=...` sesuai locale.
2. Jika tidak ada mail client, pengunjung memakai tombol "Copy email" di footer → alamat tersalin → label berubah jadi "Copied" 2 detik (`aria-live=polite`).
3. Jika Clipboard API gagal (E-09) → alamat teks terseleksi otomatis supaya bisa disalin manual.

### UF-04 Ganti bahasa lewat toggle

1. Di halaman mana pun, klik bahasa yang tidak aktif di O-01.
2. `lang_pref` diset → pindah ke path padanan (termasuk hash) → halaman tujuan tampil di locale baru; O-02 tidak muncul.

### UF-05 Mengatur consent

1. Kunjungan pertama → O-03 tampil.
2. Accept → GA4 aktif mulai halaman ini. Reject → tidak ada GA4.
3. Kapan pun: footer "Cookie settings" → O-03 dengan pilihan saat ini → ubah → berlaku langsung tanpa reload.

### UF-06 Admin login

1. Pal membuka `/admin` → tidak ada sesi → redirect `/admin/login?next=/admin`.
2. Isi email + password → Sign in → API-01.
3. Sukses → cookie sesi → redirect ke `next`. Gagal → pesan error (S-10), tetap di halaman.

### UF-07 Tambah project baru

&#91;embedded content: UF-07 tambah project · 6 langkah, 1 validasi server\]

1. Di S-11 klik "New project" → S-12 kosong, Published off, Featured off, sort order 100.
2. Isi judul + summary EN dan ID, live URL, tag.
3. Upload thumbnail → API-06 → preview tampil; isi alt EN dan ID.
4. Nyalakan Published (dan Featured bila perlu) → Save → API-03.
5. Server menolak (422) → error per field, semua input tetap, fokus ke error pertama; perbaiki lalu Save lagi.
6. Server menerima → simpan → revalidasi `/`, `/work`, `/id`, `/id/work` → redirect S-11 + toast "Project created".
7. Buka situs publik: project tampil di S-02 (dan S-01 jika featured) dalam ≤ 60 detik.

### UF-08 Edit atau unpublish project

1. S-11 → klik judul/Edit → S-13 terisi.
2. Ubah field (mis. matikan Published untuk menyembunyikan) → Save → API-04 → revalidasi 4 halaman → S-11 + toast "Changes saved".
3. Project unpublished hilang dari situs publik dalam ≤ 60 detik, tetap ada di S-11 dengan badge Draft.

### UF-09 Hapus project

1. S-13 → "Delete project" → ConfirmDialog.
2. Delete → API-05 → data dan gambar dihapus → revalidasi → S-11 + toast "Project deleted". Cancel → dialog tertutup, tidak ada perubahan.

### UF-10 Logout & sesi habis

1. Klik Logout → API-02 → cookie sesi dihapus → S-10.
2. Sesi habis saat mengisi form → Save mengembalikan 401 → form tidak dikosongkan, muncul pesan "Your session expired. Sign in again in a new tab, then save." dengan link login `target=_blank` (E-11).

## 8. State & edge case

Setiap edge case di bawah wajib ditangani persis seperti kolom "Perilaku"; tidak boleh ada layar kosong, error mentah, atau stack trace yang terlihat pengunjung.

| ID | Layar | Kondisi | Perilaku |
| --- | --- | --- | --- |
| E-01 | S-01, S-02 | 0 project published (atau 0 featured di S-01) | S-01: section Work tetap ada, teks "New work is on the way. Meanwhile, tell me what you need." + tombol email; tombol View all disembunyikan. S-02: teks serupa + tombol email. |
| E-02 | S-01, S-02 | Database tidak bisa diakses saat revalidasi | Halaman statis terakhir tetap disajikan; error dicatat di log server. Build pertama tanpa DB → render E-01, bukan gagal build. |
| E-03 | S-01 | Featured > 3 | Tampilkan 3 teratas menurut urutan; sisanya hanya di S-02. |
| E-04 | S-01, S-02 | Hanya 1 project | Grid tetap rata kiri, kartu tidak melar selebar layar (lebar maks = 1 kolom grid). |
| E-05 | ProjectCard | Thumbnail gagal dimuat | Placeholder `--color-surface` + judul; tombol tetap berfungsi. |
| E-06 | ProjectCard | Situs live sedang down | Di luar kendali situs; tidak ada pengecekan otomatis di v1. Pal menonaktifkan Published secara manual jika perlu. |
| E-07 | Semua publik | JavaScript mati | Semua konten, link, toggle (link biasa), dan mailto tetap berfungsi; O-02, O-03, GA4, Copy email tidak muncul. |
| E-08 | S-11 | Featured > 3 | Peringatan kuning (lihat S-11), tidak memblokir simpan. |
| E-09 | Footer | Clipboard API tidak tersedia/ditolak | Alamat email terseleksi otomatis + tooltip "Press Ctrl/Cmd+C to copy". |
| E-10 | S-10 | 5 login gagal dalam 15 menit | 429 + pesan rate limit; tombol disabled sampai waktu habis. |
| E-11 | S-12, S-13 | Sesi habis saat submit | 401, input dipertahankan, pesan + link login di tab baru (UF-10). |
| E-12 | S-12, S-13 | Upload gagal (jaringan, file rusak, > 5 MB, tipe salah) | Pesan spesifik di bawah uploader (bagian 11), tombol Retry; field lain tidak terganggu; Save disabled selama upload berjalan. |
| E-13 | S-12, S-13 | Save gagal karena error server (500) | Toast merah "Couldn't save. Your changes are still here — try again.", input dipertahankan. |
| E-14 | S-13 | Project sudah dihapus di tab lain | Save/Delete mengembalikan 404 → redirect S-11 + toast "This project no longer exists." |
| E-15 | S-13 | Dua tab mengedit project yang sama | v1: last write wins (hanya 1 admin). Tidak ada locking. |
| E-16 | S-12, S-13 | Published on tapi field wajib publish belum lengkap | Validasi menolak dengan pesan di field terkait; saran "Turn off Published to save as draft." |
| E-17 | S-12, S-13 | Draft disimpan tanpa thumbnail | Diizinkan; di S-11 tampil placeholder abu. |
| E-18 | Semua publik | Path tak dikenal | S-04 dengan status 404 di locale sesuai prefix. |
| E-19 | Revalidasi | Revalidasi gagal setelah simpan | Data tetap tersimpan; toast kuning "Saved, but the site may take a few minutes to update."; halaman tetap bisa revalidasi berbasis waktu (maks 1 jam) sebagai jaring pengaman. |
| E-20 | Semua | Teks ID jauh lebih panjang dari EN | Layout tidak boleh pecah: judul kartu maks 2 baris dengan ellipsis, tombol boleh turun baris, tidak ada teks terpotong di hero, caption panel bukti boleh turun baris. |
| E-21 | S-01 hero | 0 project featured | HeroProofPanel tidak dirender; hero jadi satu kolom rata kiri. Section Work tetap menampilkan E-01. |
| E-22 | S-01 hero | Hanya 1 project featured | Panel statis: tanpa tombol nomor, tanpa pause, tanpa rotasi. |
| E-23 | S-01 hero | Thumbnail panel gagal dimuat | Frame tetap tampil dengan blok `--color-surface` + judul project (seperti E-05); link tetap berfungsi; rotasi tetap jalan. |
| E-24 | S-01 hero | JavaScript mati (bagian dari E-07) | Panel menampilkan project pertama secara statis; kontrol nomor dan pause disembunyikan; link tetap berfungsi. |

## 9. Data model

v1 hanya punya satu entitas bisnis: **Project**. Kredensial admin dan sesi adalah data teknis; mekanisme penyimpanannya (tabel vs environment variable) diputuskan di SDD, tapi perilakunya dikunci di sini.

### Project

| Field | Tipe | Wajib | Aturan | Dipakai di |
| --- | --- | --- | --- | --- |
| `id` | string (UUID/cuid) | ya | dibuat server, tidak bisa diubah | route S-13, API |
| `slug` | string | ya | dibuat otomatis dari `title_en` (kebab-case, unik, ditambah `-2` jika bentrok); tidak ditampilkan di UI v1 | event analytics, schema, masa depan (case study) |
| `title_en` / `title_id` | string | ya | 1–80 karakter, di-trim | kartu, admin, schema |
| `summary_en` / `summary_id` | string | ya | 1–160 karakter, di-trim, teks biasa (tanpa HTML/markdown) | kartu |
| `live_url` | string | ya | URL valid, skema `https`, maks 300 | tombol kartu, schema |
| `tags` | string\[\] | tidak | 0–4 item, tiap item 1–24 karakter, unik (case-insensitive) | pill di kartu |
| `thumbnail` | objek atau null | wajib jika published | `{ public_id, url, width, height }` dari storage gambar | kartu, admin |
| `thumbnail_alt_en` / `thumbnail_alt_id` | string atau null | wajib jika ada thumbnail | 1–140 karakter | alt gambar |
| `sort_order` | integer | ya | 0–999, default 100 | urutan semua daftar |
| `featured` | boolean | ya | default false | S-01 |
| `published` | boolean | ya | default false | filter publik |
| `created_at` / `updated_at` | datetime (UTC) | ya | diisi server | urutan sekunder, `lastmod` sitemap, S-11 |

**Aturan turunan**

- Publik hanya melihat `published = true`. Draft tidak pernah bocor ke HTML, sitemap, schema, atau API publik.
- Urutan standar: `sort_order` asc, lalu `created_at` desc.
- Menghapus project juga menghapus `thumbnail.public_id` di storage. Mengganti thumbnail menghapus gambar lama setelah simpan berhasil.
- `lastmod` sitemap = `max(updated_at)` dari project published.

**DTO publik (bentuk data yang diterima komponen publik, per locale)**

```json
{
  "id": "clx123",
  "slug": "coffee-shop-landing",
  "title": "Coffee Shop Landing Page",
  "summary": "One-page site with menu, location, and WhatsApp order button.",
  "liveUrl": "https://staging0.rifaldiradya.com",
  "tags": ["Next.js", "Tailwind"],
  "thumbnail": { "url": "https://...", "width": 1600, "height": 1000, "alt": "Homepage of a coffee shop site" },
  "featured": true
}
```

Contoh di atas hanya ilustrasi bentuk; isi project asli diisi Pal lewat admin.

### Admin credential & sesi (perilaku)

- Tepat satu admin. Email + hash password (bcrypt/argon2) disimpan di sisi server, tidak pernah di repo atau client.
- Sesi: token acak atau token bertanda tangan di cookie `admin_session` (G4), berlaku 7 hari, dicabut saat logout.
- Rate limit login: 5 gagal / 15 menit / IP.

## 10. Kontrak API admin

Hanya admin yang menulis data; halaman publik membaca langsung di server saat render, jadi v1 tidak punya API publik. Kontrak di bawah berlaku apakah SDD mengimplementasikannya sebagai Route Handler atau Server Action: input, output, dan kode error harus sama.

**Aturan umum**

- Semua endpoint di bawah `/api/admin/*`; semua kecuali API-01 butuh cookie `admin_session` valid → jika tidak: `401 UNAUTHENTICATED`.
- Request tulis wajib same-origin (header `Origin` = domain situs) → jika tidak: `403 FORBIDDEN_ORIGIN`.
- Body JSON kecuali API-06 (multipart). Validasi di server memakai aturan yang sama dengan bagian 6 dan 9.
- Bentuk error selalu:

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Some fields need attention.", "fields": { "live_url": "URL must start with https://" } } }
```

| ID | Method & path | Request | Sukses | Error |
| --- | --- | --- | --- | --- |
| API-01 | `POST /api/admin/login` | `{ email, password }` | `200 { ok: true }` + Set-Cookie sesi | `400 VALIDATION_FAILED` · `401 INVALID_CREDENTIALS` · `429 RATE_LIMITED` + `retryAfterSeconds` |
| API-02 | `POST /api/admin/logout` | — | `204` + cookie dihapus | — (selalu sukses) |
| API-03 | `POST /api/admin/projects` | `ProjectInput` | `201 { project, revalidated: boolean }` | `401` · `422 VALIDATION_FAILED` + `fields` · `500 SERVER_ERROR` |
| API-04 | `PATCH /api/admin/projects/:id` | `ProjectInput` parsial | `200 { project, revalidated }` | `401` · `404 NOT_FOUND` · `422` · `500` |
| API-05 | `DELETE /api/admin/projects/:id` | — | `200 { revalidated }` (gambar ikut dihapus) | `401` · `404` · `500` |
| API-06 | `POST /api/admin/uploads` | multipart `file` | `201 { public_id, url, width, height }` | `401` · `413 FILE_TOO_LARGE` · `415 UNSUPPORTED_TYPE` · `422 IMAGE_TOO_SMALL` · `502 UPLOAD_FAILED` |
| API-07 | `DELETE /api/admin/uploads/:public_id` | — | `204` | `401` · `404` (dianggap sukses oleh UI) |

**`ProjectInput`**

```json
{
  "title_en": "string", "title_id": "string",
  "summary_en": "string", "summary_id": "string",
  "live_url": "https://...",
  "tags": ["string"],
  "thumbnail": { "public_id": "string", "url": "string", "width": 1600, "height": 1000 },
  "thumbnail_alt_en": "string", "thumbnail_alt_id": "string",
  "sort_order": 100, "featured": false, "published": true
}
```

- `thumbnail` boleh `null` saat `published = false`.
- `revalidated: false` → UI menampilkan E-19.
- API-07 dipanggil saat user klik Remove/Replace pada gambar yang belum pernah tersimpan, atau Cancel form dengan upload baru. Gambar yang sudah tersimpan hanya dihapus lewat API-04/05.
- Daftar project di S-11 dan data S-13 dibaca langsung di server (bukan lewat endpoint publik), tetap dilindungi sesi.

**Revalidasi (efek samping API-03/04/05):** `/`, `/work`, `/id`, `/id/work`, dan `sitemap.xml`.

## 11. Kontrak analytics & string i18n

### Event GA4

Hanya 4 event ini yang dikirim, semuanya hanya setelah `consent=granted`. Nama event format `object_action`, huruf kecil.

| Event | Kapan | Parameter |
| --- | --- | --- |
| `page_view` | Otomatis GA4 tiap halaman publik | `page_location`, `language` (`en`/`id`) |
| `contact_email_click` | Klik mailto atau tombol Copy email | `location`: `navbar` \| `hero` \| `footer` \| `work_page`; `method`: `mailto` \| `copy`; `language` |
| `project_link_click` | Klik thumbnail/tombol kartu, atau frame/link Visit di panel bukti hero | `project_slug`, `page`: `home` \| `work`, `placement`: `hero_panel` \| `card`, `language` |
| `language_switch` | Klik O-01 atau aksi O-02 | `from`, `to`, `source`: `toggle` \| `banner` |

Tandai `contact_email_click` sebagai key event (konversi) di GA4. Admin tidak memuat GA4 sama sekali.

### String i18n

Semua label UI tinggal di dua file kamus (`en`, `id`) dengan key yang sama. Copy hero dan service mengikuti PRD bagian 4. Tabel ini mengunci string fungsional yang sering terlupa.

| Key | EN | ID |
| --- | --- | --- |
| `nav.work` | Work | Hasil Kerja |
| `nav.email` | Email me | Email saya |
| `nav.skip` | Skip to content | Langsung ke konten |
| `hero.title` | Landing Pages That Launch in `<hl>`Days`</hl>`, `<dim>`Not Weeks`</dim>` | Landing Page Siap Pakai dalam Hitungan `<hl>`Hari`</hl>`, `<dim>`Bukan Minggu`</dim>` |
| `hero.ctaPrimary` | See the Work | Lihat Hasil Kerja |
| `hero.ctaSecondary` | Email Me About Your Project | Kirim Brief via Email |
| `meta.available` | Available for new projects | Menerima project baru |
| `meta.location` | Based in Indonesia | Berbasis di Indonesia |
| `meta.remote` | Works remotely | Kerja remote |
| `hero.proofLabel` | Latest work | Karya terbaru |
| `hero.proofAria` | Visit {title} (opens in new tab) | Lihat {title} (buka di tab baru) |
| `slider.pause` / `slider.play` | Pause slideshow / Play slideshow | Jeda slideshow / Putar slideshow |
| `label.services` / `label.work` / `label.about` / `label.contact` | Services / Work / About / Contact | Layanan / Hasil Kerja / Tentang / Kontak |
| `services.title` | What I build | Yang saya kerjakan |
| `services.primary.badge` | Main focus | Fokus utama |
| `services.secondary.badge` | For bigger projects | Untuk proyek lebih besar |
| `steps.1` / `steps.1d` | Brief / You send the goal | Brief / Kamu kirim tujuannya |
| `steps.2` / `steps.2d` | Build / I design and code | Pengerjaan / Saya desain dan coding |
| `steps.3` / `steps.3d` | Live / Online, ready to share | Live / Online, siap dibagikan |
| `work.featuredTitle` | Selected work | Karya pilihan |
| `work.viewAll` | View all work (+ ikon →) | Lihat semua karya (+ ikon →) |
| `work.empty` | New work is on the way. Meanwhile, tell me what you need. | Karya baru sedang disiapkan. Sementara itu, ceritakan kebutuhanmu. |
| `workPage.title` | Work | Hasil Kerja |
| `card.live` | Live | Live |
| `card.visit` | Visit live site (+ ikon ↗) | Lihat situs (+ ikon ↗) |
| `card.visitShort` | Visit (+ ikon ↗) | Lihat (+ ikon ↗) |
| `about.title` | Who you'll work with | Siapa yang akan bekerja denganmu |
| `about.lead` / `about.body` | Lihat PRD bagian 4 (boleh berisi `<mark>`, `<strong>`) | Lihat PRD bagian 4 |
| `facts.basedLabel` / `facts.based` | Based in / Indonesia (GMT+7) | Berbasis di / Indonesia (GMT+7) |
| `facts.workLabel` / `facts.work` | Works with / Clients worldwide, remotely | Bekerja dengan / Klien dari mana saja, secara remote |
| `facts.focusLabel` / `facts.focus` | Focus / Landing pages, web apps & dashboards | Fokus / Landing page, web app & dashboard |
| `facts.langLabel` / `facts.lang` | Languages / English, Indonesian | Bahasa / Indonesia, Inggris |
| `cta.title` | Have a page to `<hl>`launch`</hl>`? | Punya halaman yang mau `<hl>`diluncurkan`</hl>`? |
| `cta.sub` | Send a short brief: what the page is for and when you need it. I'll reply with the next steps. | Kirim brief singkat: halamannya untuk apa dan kapan dibutuhkan. Saya akan balas dengan langkah selanjutnya. |
| `cta.button` | Email me about your project (+ ikon →) | Kirim brief via email (+ ikon →) |
| `cta.or` | or copy | atau salin |
| `email.subject` | Project inquiry from rifaldiradya.com | Tanya project dari rifaldiradya.com |
| `email.copy` / `email.copied` | Copy email / Copied | Salin email / Tersalin |
| `langBanner.text` | Also available in Indonesian. | (tidak dipakai, banner hanya di EN) |
| `langBanner.action` | Lihat versi Indonesia | — |
| `consent.body` | I use Google Analytics to see which pages are useful. It only runs if you allow it. | Saya memakai Google Analytics untuk melihat halaman mana yang berguna. Hanya aktif jika kamu izinkan. |
| `consent.accept` / `consent.reject` | Accept / Reject | Terima / Tolak |
| `footer.privacy` / `footer.cookies` | Privacy / Cookie settings | Privasi / Pengaturan cookie |
| `notFound.title` | This page doesn't exist | Halaman ini tidak ada |
| `notFound.home` / `notFound.work` | Back to home / See the work | Kembali ke beranda / Lihat hasil kerja |

Tag `<hl>`, `<dim>`, `<mark>`, dan `<strong>` di nilai kamus adalah penanda rich-text yang dirender helper i18n menjadi elemen yang sudah ditentukan (SDD bagian 5), bukan HTML mentah. Tag lain tidak diizinkan. Ikon panah (↗, →) bukan bagian dari string; dirender komponen supaya bisa dianimasikan.

**Pesan error admin (EN saja)**

| Kondisi | Pesan |
| --- | --- |
| Field wajib kosong | {Field} is required. |
| Terlalu panjang | Keep it under {n} characters ({current} now). |
| URL tidak valid | URL must start with https:// and be a full address. |
| Tag > 4 | Use up to 4 tags. |
| File > 5 MB | This image is {size} MB. Upload one under 5 MB. |
| Tipe salah | Use a JPG, PNG, or WebP image. |
| Lebar < 1200 px | This image is {w} px wide. Use one at least 1200 px wide. |
| Upload gagal | Upload failed. Check your connection and try again. |
| Publish belum lengkap | Add a thumbnail and alt text to publish, or turn off Published to save as draft. |

Copy ID di tabel ini adalah draft awal dan boleh direvisi Pal saat penulisan konten; key-nya tidak boleh berubah.

## 12. Traceability & batasan untuk coding AI

Setiap fitur PRD punya layar, flow, dan edge case yang bisa dites. Fitur dianggap selesai hanya jika semua acceptance criteria PRD-nya lolos dan flow terkaitnya jalan end-to-end.

| Fitur PRD | Layar / overlay | Flow | Edge case | API / kontrak |
| --- | --- | --- | --- | --- |
| F1 Homepage | S-01, HeroProofPanel | UF-01 | E-01, E-03, E-04, E-07, E-20, E-21 s.d. E-24 | DTO publik |
| F2 Work | S-02 | UF-01 | E-01, E-04 | DTO publik |
| F3 Project card | S-01, S-02 | UF-01 | E-05, E-06 | `project_link_click` |
| F4 Bilingual | O-01, O-02, semua publik | UF-02, UF-04 | E-07, E-18, E-20 | G1, G4, `language_switch` |
| F5 CTA email | Navbar, S-01, S-02, footer | UF-03 | E-09 | `contact_email_click` |
| F6 Admin login | S-10, G3 | UF-06, UF-10 | E-10, E-11 | API-01, API-02 |
| F7 Admin CRUD | S-11, S-12, S-13 | UF-07, UF-08, UF-09 | E-08, E-11 s.d. E-17, E-19 | API-03 s.d. API-07 |
| F8 GA4 + consent | O-03, S-03 | UF-05 | E-07 | Event GA4, G4 |
| F9 SEO | Semua publik, S-04 | — | E-18 | PRD bagian 9 |

**Jangan ditebak atau ditambahkan oleh coding AI**

- Jangan menambah layar, section, field, filter, pencarian, paginasi, dark mode, atau form kontak.
- Animasi hanya yang terdaftar di tabel Motion PRD bagian 8. Satu-satunya konten yang berganti otomatis adalah HeroProofPanel; jangan membuat carousel lain, library animasi, parallax berbasis JavaScript, atau fade-in pada H1/subheadline/panel hero.
- Jangan auto-redirect berdasarkan bahasa browser, IP, atau cookie.
- Jangan memuat GA4 atau cookie analytics sebelum `consent=granted`.
- Jangan menyimpan gambar di filesystem server atau di repo.
- Jangan hardcode data project di komponen; jangan menampilkan project `published=false` di mana pun di sisi publik.
- Jangan menerjemahkan otomatis di runtime; semua teks berasal dari kamus i18n atau field database per bahasa.
- Jangan membuat akun admin kedua, halaman register, atau reset password publik.
- Jangan mengganti font, warna, atau copy yang sudah dikunci di PRD tanpa persetujuan.
- Jika dokumen ini, PRD, dan SDD tidak menjawab sebuah pertanyaan implementasi: berhenti dan tanya, jangan mengarang.

**Urutan dokumen:** PRD (apa & kenapa) → dokumen ini (layar, flow, state, kontrak) → SDD (arsitektur, library, struktur repo, deploy ke Hostinger via GitHub, aturan kerja dengan coding AI).
