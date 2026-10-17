---
doc: APP_FLOW
app: rifaldiradya.com
tier: full
version: 2.0.0
status: current
last_updated: 2026-10-18
last_change: changes/archive/2026-10-18-v2.0.0-showcase-redesign
---

# App Flow Document — rifaldiradya.com v2

Sep 27, 2026 · @Pal

> **v2.0.0 (18 Okt 2026).** Home 5 bab dengan scroll snap, halaman Work dengan filter dan baris case, tema gelap/terang, funnel email 4 jenis + Download CV, model data project v2. Rujukan visual: `docs/design/v2/option-b.html` (publik) dan `docs/design/v2/admin.html` (admin); kalau mockup berbeda dengan dokumen ini, dokumen ini yang menang. Keputusan: D-01..D-30 di `docs/decisions/DECISIONS.md`.

## 1. Cara pakai & aturan global

Dokumen ini adalah blueprint implementasi: setiap layar, elemen, flow, state, dan kontrak data yang boleh dibangun. **Kalau sesuatu tidak ada di sini, jangan dibangun; kalau ambigu, tanya dulu.** Sumber "apa & kenapa" ada di PRD; sumber "teknologi & arsitektur" ada di SDD.

**Konvensi ID:** layar `S-xx`, overlay `O-xx`, flow `UF-xx`, edge case `E-xx`, endpoint `API-xx`, fitur PRD `F1–F9` (F3 = baris case). Edge case v2 mulai E-25.

**G1 — Locale dari URL, bukan dari tebakan.**

- Locale ditentukan hanya dari path: diawali `/id` → `id`, selain itu → `en`.
- Server tidak pernah redirect berdasarkan `Accept-Language`, IP, atau cookie. `Accept-Language` hanya dipakai untuk memutuskan tampil/tidaknya banner saran (O-02).
- `<html lang>` = locale halaman. Semua string UI diambil dari kamus i18n per locale (bagian 11).

**G2 — Layout shell publik (semua S-01 s.d. S-04)**

1. Skip link "Skip to content" / "Langsung ke konten" (muncul saat fokus keyboard).
2. Bar sticky: nama → home, Work, About, toggle EN|ID (O-01), toggle tema (O-04), tombol "Email me" (mailto `general`); di < 768 px mengikuti mockup.
3. Progress bar baca tipis di atas (CSS `scroll()`).
4. `<main id="content">` isi halaman.
5. Footer kecil: © tahun, Privacy, Cookie settings (O-03), "Back to top ↑" (home) / "Back to home ↑" (Work).
6. O-02 banner saran bahasa dan O-03 cookie consent (kondisional).

Setiap bab punya lapisan dekoratif `aria-hidden` (titik + cahaya) dan atribut `data-zone` untuk warna cahaya.

**G3 — Layout shell admin (S-10 s.d. S-14):** header sederhana ("Rifaldi Radya Pratama Admin" · link "View site" tab baru · toggle tema O-04 · tombol Logout), tanpa footer publik, tanpa O-01/O-02/O-03, tanpa GA4. Bahasa UI admin: EN saja. Semua halaman admin mengirim `noindex, nofollow`.

**G4 — Cookies yang boleh ada**

| Cookie | Isi | Umur | Diset oleh |
| --- | --- | --- | --- |
| `lang_pref` | `en` \| `id` | 365 hari | O-01 klik, O-02 aksi apa pun |
| `consent` | `granted` \| `denied` | 180 hari | O-03 |
| `admin_session` | token sesi (httpOnly, secure, sameSite=lax) | 7 hari | API-01 |
| `_ga`, `_ga_*` | cookie GA4 | sesuai GA4 | GA4, hanya setelah `consent=granted` |

Tidak ada cookie lain. `localStorage` hanya `rr-theme` (`dark` | `light`, diset O-04): preferensi tampilan, tidak dikirim ke mana pun, bukan state penting.

**G5 — Konten dinamis vs statis:** dari database: semua field proyek (bagian 9) dan `availability_on`. Dari kamus i18n: hero, About, pendidikan, sertifikasi, Highlight, Contact, mailto, privacy, dan semua label UI. Dari repo (statis): PDF CV di `public/cv/`. Halaman publik dirender statis dan direvalidasi saat admin mengubah data.

## 2. Inventaris layar

Ada 8 layar publik (4 per bahasa), 5 layar admin, dan 4 overlay. Tidak ada layar lain.

| ID | Route EN | Route ID | Akses | Render | Tujuan | Fitur |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | `/` | `/id` | Publik | Statis + revalidasi | Homepage: peran, bukti, funnel ke email/CV | F1, F3, F5 |
| S-02 | `/work` | `/id/work` | Publik | Statis + revalidasi | Semua project published sebagai baris case + filter grup | F2, F3, F5 |
| S-03 | `/privacy` | `/id/privacy` | Publik | Statis | Kebijakan privasi & cookie | F8 |
| S-04 | 404 (path tak dikenal) | 404 di bawah `/id/*` | Publik | Statis | Not found per bahasa | F9 |
| S-10 | `/admin/login` | — | Publik (noindex) | Dinamis | Form login | F6 |
| S-11 | `/admin` | — | Butuh sesi | Dinamis | Daftar project | F7 |
| S-12 | `/admin/projects/new` | — | Butuh sesi | Dinamis | Form buat project | F7 |
| S-13 | `/admin/projects/[id]` | — | Butuh sesi | Dinamis | Form edit + hapus project | F7 |
| S-14 | `/admin/profile` | — | Butuh sesi | Dinamis | Foto profil di hero + saklar availability | F1, F7 |
| O-01 | Toggle bahasa (bar) |  | Publik | Client | Pindah ke halaman padanan | F4 |
| O-02 | Banner saran bahasa |  | Publik | Client | Tawarkan versi ID ke browser berbahasa Indonesia | F4 |
| O-03 | Cookie consent |  | Publik | Client | Minta izin analytics | F8 |
| O-04 | Toggle tema (bar publik + header admin) |  | Publik + admin | Client | Ganti tema gelap/terang | F1 |

Aturan route tambahan:

- `www.rifaldiradya.com/*` → redirect 301 ke `https://rifaldiradya.com/*` (path dan query sama); versi non-www adalah kanonik.
- `/en` dan `/en/*` → redirect 301 ke path tanpa prefix (mis. `/en/work` → `/work`), supaya tidak ada duplikat.
- Trailing slash dihapus dengan redirect permanen (`/work/` → `/work`); bawaan Next.js memakai 308.
- Semua `/admin/*` kecuali `/admin/login` tanpa sesi valid → redirect 302 ke `/admin/login?next=<path>`.
- `/admin/login` dengan sesi valid → redirect ke `/admin`.
- `/admin/projects/[id]` dengan id tidak ada → S-11 dengan toast "Project not found".

## 3. Peta navigasi

Pintu keluar yang penting: mailto (4 jenis), Download CV, situs live (bila ada), LinkedIn. Judul proyek di S-01 → S-02 `#case-<slug>`. Admin tidak pernah ditautkan dari halaman publik.

&#91;embedded content: peta navigasi v1 · publik dan admin terpisah\]

Navigasi yang tidak digambar supaya diagram tetap terbaca:

- Bar & footer (G2) ada di semua layar publik: nama → S-01, Work → S-02, About → S-01 `#about`, Privacy → S-03, toggle → halaman padanan di locale lain, email → email app.
- Item Selected work di S-01 menaut ke baris case di S-02; tautan situs live di S-01 dan S-02 keluar ke tab baru.
- S-04 punya tombol ke S-01 dan S-02.
- S-12 dan S-13 kembali ke S-11 setelah Save, Cancel, atau Delete (S-13).
- Header admin: "View site" membuka `/` di tab baru; Logout → S-10.

## 4. Spesifikasi layar publik

Semua layar publik memakai shell G2. Teks di tanda kutip adalah copy EN; padanan ID ada di kamus i18n (bagian 11), dirujuk lewat key `[key]`.

### S-01 Homepage (`/`, `/id`)

Urutan bab tetap; tidak boleh ada bab tambahan. Tiap bab satu layar (`100svh`) dengan scroll snap `y proximity` (mati saat reduced motion); bab boleh lebih tinggi bila isinya panjang. Tanpa label section bernomor.

| # | Bab | Elemen (urut) | Aturan |
| --- | --- | --- | --- |
| 1 | Hero `#top` | foto bulat (avatar S-14, tanpa foto → inisial "RR") → label `[hero.role]` + `[hero.loc]` → baris availability (titik + `[hero.open]`) bila `availability_on` → H1 dua baris `[hero.l1]` / `[hero.l2]` (satu kata `<em>` aksen) → `[hero.sub]` → baris Stack → tombol "Email me" (`general`) → tautan "Scroll ↓" ke `#work` | H1 naik 900 ms tanpa fade (D-10); tidak ada gambar prioritas selain avatar kecil dengan `width`/`height` eksplisit; LCP = H1. |
| 2 | Selected work `#work` | H2 `[work.h]` + penghitung "0n / 0N" → item proyek: label `0n / 0N · {meta} · {side}`, H3 judul (tautan ke case, panah →), deskripsi (`summary`), tautan "Open the live site ↗" bila `case_action = site`, screenshot bila `visual_type = screenshot` → rail nama proyek (anchor `#w1..#wN`) → "See all work →" ke S-02 | Data: `published AND show_on_home`, urut `sort_order`, maks. 5. Dipin: tiap item satu langkah scroll (sticky + snap); tanpa dukungan scroll-driven atau reduced motion → daftar bertumpuk biasa. 0 item → E-25. Tautan dan screenshot memakai atribut `data-cursor` (`read`/`visit`) untuk v2.1.0. |
| 3 | About `#about` | H2 `[about.h]` → statement `[about.s]` (terisi baris per baris saat scroll) → `[about.p1]`, `[about.p2]` → Pendidikan (`e1..e3`) → Sertifikasi → tautan Download CV | Statement tanpa dukungan scroll-driven tampil penuh. |
| 4 | Highlight `#highlight` | label `[case.meta]` → statement `[case.t]` (bagian `<s>` dicoret saat masuk) → 3 angka (5 → 1, ~200, 13; angka menghitung naik via CSS) + label → catatan `[case.blur]` → kalimat jembatan `[bridge.q]` + tautan `[bridge.go]` ke `#contact` | Angka asli selalu ada di DOM (teks `sr`) sehingga pembaca layar dan browser tanpa dukungan membaca nilai akhir. |
| 5 | Contact `#contact` | label `[ct.label]` → H2 `[ct.h]` → `[ct.pitch]` → tombol `role` (primer) + `project` (sekunder) → baris jangkauan: email (mailto `general`) + Copy email, LinkedIn ↗, Download CV, GitHub ↗ (bila terisi), jam `HH:mm GMT+7` → footer | Jam: teks statis "GMT+7" sebelum JS; setelah mount `HH:mm` zona `Asia/Jakarta`, `tabular-nums`, tanpa layout shift. |

### S-02 Work (`/work`, `/id/work`)

1. Label `[wp.label]` → H1 `[nav.work]` + jumlah proyek published (`<sup>`) → sub `[wp.sub]`, disusun dari jumlah proyek per grup (D-30): grup kosong tidak disebut, angka sampai sepuluh sebagai kata, tunggal/jamak mengikuti angka; tanpa proyek sub tidak dirender.
2. Filter `[wp.filter]` (grup `role="group"`): tombol All / Panasonic / Websites / AI tools dengan jumlah; aktif ditandai `aria-pressed`. Tanpa JS filter tidak dirender dan semua baris tampil. Grup kosong tidak punya tombol.
3. Daftar `<ol>` baris: `<details id="case-<slug>">` dengan `<summary>` berisi judul · meta · side · ikon +/−; isi: What it is (`case_is`), What I did (`<ul>` dari `case_did`), Stack (`tags` digabung " · "), Status, lalu tombol sesuai `case_action`: `site` → "Open the live site ↗" (`live_url`, tab baru); `walkthrough` → "Email to ask for a walkthrough" (mailto `walkthrough` dengan judul proyek); `none` → tanpa tombol.
4. Hash `#case-<slug>` saat load atau saat hash berubah → buka baris itu, gulir ke sana, fokus ke `<summary>`, kirim `case_open` (`source: hash`). Membuka baris lewat klik → `case_open` (`source: row`). Filter yang menyembunyikan baris target di-reset ke All.
5. Bab Contact penutup `#more` dengan H2 `[ct.h.more]` "Have a project like *these?*" dan dua tombol mailto; footer dengan "Back to home ↑".
6. Data: `published=true`, urut `sort_order`, tanpa limit. 0 proyek → E-01.

### S-03 Privacy (`/privacy`, `/id/privacy`)

H1 + teks statis dari kamus i18n: apa yang dilacak (GA4, anonim, hanya dengan izin), cookie yang dipakai (tabel G4 versi ramah pembaca), penyimpanan `rr-theme` di browser, PDF CV sebagai file statis tanpa pelacakan selain event `cv_download` bila consent, cara mengubah pilihan (tombol "Cookie settings" yang membuka O-03), kontak email. Tidak ada data dinamis.

### S-04 Not found

Status HTTP 404. Locale mengikuti prefix path (`/id/xyz` → versi ID). Isi: H1 `[notFound.title]` "This page doesn't exist", satu kalimat, tombol ke S-01 dan S-02. Bar dan footer tetap tampil (gaya v2). `noindex`.

## 5. Overlay global

O-01..O-03 muncul di semua layar publik dan tidak pernah di admin; O-04 ada di bar publik dan header admin. O-02/O-03 bergaya v2 dengan posisi dan logika tetap. Banner bahasa dan GA4 hanya aktif kalau semua syaratnya terpenuhi.

&#91;embedded content: logika tampil O-02 dan O-03\]

### O-01 Toggle bahasa

- Tampilan: dua tombol teks EN dan ID dipisah garis tipis; yang aktif bergaya aksen dan diberi `aria-current`. Grup punya `aria-label` Language.
- Klik bahasa yang tidak aktif: set `lang_pref`, kirim event `language_switch` (jika consent), navigasi ke path padanan: `/` ↔ `/id`, `/work` ↔ `/id/work`, `/privacy` ↔ `/id/privacy`; hash anchor ikut dibawa (`/#work` → `/id#work`). Dari S-04 → homepage locale tujuan.
- Klik bahasa yang sudah aktif: tidak terjadi apa-apa.
- Toggle adalah link `<a href>` asli (bisa dibuka di tab baru, bisa di-crawl), bukan tombol JS saja.

### O-02 Banner saran bahasa

- Dievaluasi di client setelah halaman tampil, tanpa memblokir render dan tanpa menggeser layout: overlay setinggi 48 px, di bawah bar mulai 768 px dan menempel di bawah layar di HP (hero di HP hanya berjarak 24 px dari bar, jadi overlay atas akan menutupi byline). Di layar < 420 px hanya tombol yang tampil; kalimatnya tetap jadi label region untuk pembaca layar.
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

### O-04 Toggle tema

- Tombol ikon dengan label teks tersembunyi (`aria-label` `[theme.toLight]`/`[theme.toDark]` sesuai tema sekarang).
- Klik → set `data-theme` di `<html>`, simpan `rr-theme`, event `theme_switch` (jika consent).
- Skrip inline di `<head>` (sebelum paint) menerapkan urutan D-23: query `?theme=` → `rr-theme` → `prefers-color-scheme` → `dark`; tidak ada flash tema salah.
- Transisi warna 300 ms; reduced motion → seketika. Tanpa JS toggle tidak tampil (E-07); `localStorage` diblokir → E-31.

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
- Daftar baris (desktop: tabel; mobile: kartu bertumpuk), urut posisi (`sort_order`) asc. Kolom: # posisi · Visual (thumbnail 64 × 40 atau angka kartu) · Judul EN (link ke S-13) + meta kecil · Grup · Status (Published/Draft) · Tampil (Homepage / Work page only) · Diperbarui (relatif) · ↑/↓ · Edit. Filter grup di atas daftar (client-only, tidak mengubah urutan).
- **Urutan (T-18b):** tombol ↑ / ↓ (44 × 44 px, label "Move {title} up/down") menukar project dengan tetangganya lewat API-08 dan langsung tersimpan; ↑ nonaktif di #1, ↓ nonaktif di posisi terakhir. Fokus tetap di tombol yang ditekan, posisi baru diumumkan ke pembaca layar. Posisi selalu 1…n tanpa angka kembar; tidak ada field urutan di form. Tanpa drag-and-drop, inline toggle, atau bulk action; perubahan lain lewat S-13.
- Header admin (G3) punya navigasi "Projects" · "Profile" (S-14).
- Info di bawah header: "{n} projects · {p} published · {d} drafts"; "Selected work on the homepage: {k} of 5. Turn one off before adding another." (kuning bila k = 5); "The order here is the order on the site. Use ↑ and ↓ to move a project."
- Empty state (0 project): "No projects yet. Add your first one to show it on the site." + tombol "New project".
- Toast sukses dari aksi sebelumnya ("Project created", "Changes saved", "Project deleted") tampil 4 detik, `role=status`.

### S-12 New project dan S-13 Edit project

Form yang sama. S-13 terisi data dan punya zona hapus.

| # | Bagian | Field | Tipe UI | Validasi | Wajib untuk Publish |
| --- | --- | --- | --- | --- | --- |
| 1 | Basics | Title EN / ID | text + counter | 1–80 | ya |
| 2 | Basics | Group | segmented: Panasonic / Websites / AI tools | enum `panasonic`\|`web`\|`ai` | ya (default `web`) |
| 3 | Basics | Meta line EN / ID | text + counter | 1–40, mis. "Panasonic · 13 companies" | ya |
| 4 | Basics | Side EN / ID | text + counter | 0–20, mis. "2022–now", "WordPress"; bantuan: "Right column on the Work page, and the end of the homepage label." | tidak |
| 5 | Homepage | Short description EN / ID | textarea + counter | 1–160 (kolom `summary`) | ya |
| 6 | Homepage | Show in Selected work | switch | maks. 5 proyek dengan saklar on (termasuk draft); ke-6 → E-26 | tidak |
| 7 | Case | What it is EN / ID | textarea + counter | 1–220 | ya |
| 8 | Case | What I did EN / ID | daftar baris (+ Add a line, × hapus, urutan tetap; paste beberapa baris mengisi satu baris per kolom) | 1–8 baris per bahasa, tiap baris 1–160; baris kosong dibuang saat simpan | ya (≥ 1 baris per bahasa) |
| 9 | Case | Stack | chip (Enter/koma) | 0–6 item, 1–24 karakter, unik (kolom `tags`) | tidak |
| 10 | Case | Status EN / ID | text | 1–40, mis. "Live, 2022–now" | ya |
| 11 | Button on the case | Case action | radio: Open the live site / Email to ask for a walkthrough / No button | enum `site`\|`walkthrough`\|`none` | ya (default `site`) |
| 12 | Button on the case | Live URL | url, "optional" | kosong atau `https://` valid maks. 300; **wajib bila case action = site** | kondisional |
| 13 | Visual | Visual type | segmented: Screenshot / Number card | enum `screenshot`\|`number` | ya (default `screenshot`) |
| 14 | Visual | Screenshot + alt EN/ID | ImageUploader (16:10) + text | JPG/PNG/WebP, ≤ 5 MB, min 1200 px lebar, dicrop 16:10; alt 1–140; wajib bila type = screenshot | kondisional |
| 15 | Visual | Number + Caption EN/ID | text + counter | number 1–12 (mis. "13", "5 → 1"); caption 1–60; wajib bila type = number | kondisional |
| 16 | Publishing | Published | switch | Publish butuh semua kolom "ya" + kondisional valid | — |

- Bantuan bagian Visual: "Screenshots appear on the homepage. Number cards are saved now and appear in the desktop preview from v2.1." Data screenshot dan number boleh tersimpan bersamaan; yang dipakai mengikuti `visual_type`.
- Saat Live URL kosong dan case action = site → error "Add a live URL, or choose another button."
- Preview live di form: tidak ada (v2.1.0).
- Layout: form dibagi per bagian (tabel di atas); field EN dan ID berdampingan di ≥ 1024 px, bertumpuk (EN dulu) di bawahnya. Tidak memakai tab bahasa supaya kedua versi terlihat bersamaan.
- Tombol bawah (sticky di mobile): "Save" primer + "Cancel" sekunder. Save disabled saat upload berjalan.
- Validasi client saat blur + validasi server saat submit; pesan error di bawah field, menyebut cara memperbaiki (bagian 11). Saat submit gagal, fokus pindah ke field error pertama dan ringkasan error muncul di atas form.
- Cancel dengan perubahan belum disimpan → dialog "Discard changes?" (Discard / Keep editing). Navigasi browser keluar juga memicu peringatan `beforeunload`.
- ImageUploader: pilih file → validasi tipe & ukuran di client → kompres di browser (crop 16:10, 4 lebar WebP) → upload langsung (API-06) dengan progress bar → preview → tombol "Replace" dan "Remove". Gambar lama di storage baru dihapus setelah project berhasil disimpan dengan gambar baru.
- **Zona hapus (S-13 saja):** di paling bawah, dipisah garis, tombol merah "Delete project" → ConfirmDialog "Delete {title EN}? This removes it from the site and deletes its image. This can't be undone." (Delete / Cancel). Fokus awal di Cancel.

### S-14 Profile (`/admin/profile`)

- Heading "Profile".
- Photo: ImageUploader mode avatar, JPG/PNG/WebP ≤ 5 MB, minimal 640 × 640 px, dicrop persegi di tengah, dikompres di browser ke 320 dan 640 px; preview bulat; Replace / Remove. Bantuan: "Shown as a small circle next to your role in the hero. Upload at least 640 × 640 px so it stays sharp." Foto 320 px lama tetap tampil sampai diganti (E-32). Tanpa foto → inisial "RR".
- Availability: satu switch "Show availability" + bantuan "Hide it when you are not taking new work, or when you'd rather people at work didn't see it." Tidak ada field teks (D-16).
- Tombol "Save" (nonaktif selama upload atau jika tidak ada perubahan) → API-09 (foto dan availability disimpan dalam satu transaksi) → revalidasi semua halaman publik → toast "Profile saved" (kuning jika revalidasi gagal, E-19).

## 7. User flows

10 flow di bawah adalah semua jalur yang harus berfungsi. Setiap langkah menyebut layar dan hasil yang diharapkan.

### UF-01 Recruiter menilai Pal (EN) — flow utama

1. Recruiter membuka tautan dari LinkedIn di HP → S-01; O-03 tampil.
2. Membaca label peran, H1, sub, stack.
3. Gulir ke Selected work; tap judul "HR System" → S-02 `#case-hr-system` terbuka (`case_open` source `home_title`).
4. Membaca case; tap "Email to ask for a walkthrough" → mail app dengan subject "Walkthrough: HR System" dan body terisi (`contact_email_click` kind `walkthrough`, location `case`).
5. Alternatif: kembali ke home → About → Download CV (`cv_download` location `about`), atau Contact → "Email about a full-time role" (kind `role`).

### UF-02 Pengunjung lokal pindah ke versi Indonesia

1. Pengunjung dengan browser berbahasa Indonesia membuka `/` → S-01 EN + O-02 muncul (jika O-03 tidak sedang tampil di mobile).
2. Klik "Lihat versi Indonesia" → `lang_pref=id` → `/id`.
3. Kunjungan berikutnya ke `/`: O-02 tidak muncul lagi (cookie ada); pengunjung tetap bisa pakai toggle.
4. Alternatif: klik tutup di O-02 → `lang_pref=en`, tetap di EN.

### UF-03 Menghubungi via email

1. Klik tombol email (bar, hero, Contact, Contact penutup S-02, atau tombol walkthrough di case) → event `contact_email_click` dengan `kind` dan `location` → browser membuka `mailto:hello@rifaldiradya.com` dengan subject dan body sesuai jenis dan locale (bagian 11).
2. Jika tidak ada mail client, pengunjung memakai tombol "Copy email" di Contact → alamat tersalin → label berubah jadi "Copied" 2 detik (`aria-live=polite`).
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

1. Di S-11 klik "New project" → S-12 kosong, Published off, Show in Selected work off. Setelah disimpan, project baru otomatis di posisi #1 dan yang lain mundur satu.
2. Isi Basics, Homepage, Case (EN dan ID), tombol case (+ Live URL bila situs).
3. Visual: upload screenshot → API-06 → preview tampil, isi alt EN dan ID; atau isi kartu angka.
4. Nyalakan Published (dan Show in Selected work bila perlu) → Save → API-03.
5. Server menolak (422) → error per field, semua input tetap, fokus ke error pertama; perbaiki lalu Save lagi.
6. Server menerima → simpan → revalidasi `/`, `/work`, `/id`, `/id/work` → redirect S-11 + toast "Project created".
7. Buka situs publik: project tampil di S-02 (dan Selected work di S-01 bila Show in Selected work on) dalam ≤ 60 detik.

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
| E-01 | S-01, S-02 | 0 project published | S-01: bab Selected work tidak dirender (E-25). S-02: teks `[work.empty]` "New work is on the way. Meanwhile, here's how to reach me." + tombol ke `#contact`. |
| E-02 | S-01, S-02 | Database tidak bisa diakses saat revalidasi | Halaman statis terakhir tetap disajikan; error dicatat di log server. Build pertama tanpa DB → render E-01, bukan gagal build. |
| E-03 | S-01 | `show_on_home` > 5 (data lama) | Selected work: 5 teratas menurut urutan. Sisanya tetap tampil di S-02. |
| E-05 | S-01 | Screenshot gagal dimuat | Ruang screenshot tetap dicadangkan; judul, deskripsi, dan tautan tetap berfungsi. |
| E-06 | S-01, S-02 | Situs live sedang down | Di luar kendali situs; tidak ada pengecekan otomatis. Pal mengganti case action atau menonaktifkan Published secara manual jika perlu. |
| E-07 | Semua publik | JavaScript mati | Semua konten, link, toggle bahasa (link biasa), dan mailto tetap berfungsi; tema mengikuti setelan perangkat lewat `@media (prefers-color-scheme: light)` di CSS (`dark` bila tidak ada setelan) dan toggle tema tidak tampil; baris case tetap bisa dibuka, filter tidak tampil, jam statis "GMT+7"; O-02, O-03, GA4, Copy email tidak muncul. |
| E-09 | Contact | Clipboard API tidak tersedia/ditolak | Alamat email terseleksi otomatis + tooltip "Press Ctrl/Cmd+C to copy". |
| E-10 | S-10 | 5 login gagal dalam 15 menit dari satu IP, atau 20 dari semua IP | 429 + pesan rate limit; tombol disabled sampai waktu habis. |
| E-11 | S-12, S-13 | Sesi habis saat submit | 401, input dipertahankan, pesan + link login di tab baru (UF-10). |
| E-12 | S-12, S-13 | Upload gagal (jaringan, file rusak, > 5 MB, tipe salah) | Pesan spesifik di bawah uploader (bagian 11), tombol Retry; field lain tidak terganggu; Save disabled selama upload berjalan. |
| E-13 | S-12, S-13 | Save gagal karena error server (500) | Toast merah "Couldn't save. Your changes are still here — try again.", input dipertahankan. |
| E-14 | S-13 | Project sudah dihapus di tab lain | Save/Delete mengembalikan 404 → redirect S-11 + toast "This project no longer exists." |
| E-15 | S-13 | Dua tab mengedit project yang sama | v1: last write wins (hanya 1 admin). Tidak ada locking. |
| E-16 | S-12, S-13 | Published on tapi field wajib publish belum lengkap | Validasi menolak dengan pesan di field terkait; saran "Turn off Published to save as draft." |
| E-17 | S-12, S-13 | Draft disimpan tanpa visual | Diizinkan; di S-11 kolom Visual tampil kosong. |
| E-18 | Semua publik | Path tak dikenal | S-04 dengan status 404 di locale sesuai prefix. |
| E-19 | Revalidasi | Revalidasi gagal setelah simpan | Data tetap tersimpan; toast kuning "Saved, but the site may take a few minutes to update."; halaman tetap bisa revalidasi berbasis waktu (maks 1 jam) sebagai jaring pengaman. |
| E-20 | Semua | Teks ID jauh lebih panjang dari EN | Layout tidak boleh pecah: tombol boleh turun baris, tidak ada teks terpotong; bab satu layar boleh lebih tinggi dari satu layar bila isinya panjang. |
| E-25 | S-01 | Selected work 0 proyek (`show_on_home` kosong) | Bab Selected work tidak dirender; Hero "Scroll ↓" menuju `#about`; S-02 tetap menampilkan semua proyek. |
| E-26 | S-12, S-13, API-03/04 | Saklar Show in Selected work ke-6 | Saklar nonaktif di UI dengan teks bantuan; server menolak dengan 422 bila tetap dikirim. |
| E-27 | S-02 | Proyek published dari v1 tanpa field v2 | Baris tampil dengan judul + summary; bagian case kosong disembunyikan; tanpa tombol bila `live_url` kosong; tetap valid sampai diedit, saat Save wajib melengkapi field publish. |
| E-28 | S-01, S-02 | `case_action = site` tetapi `live_url` kosong (data lama/rusak) | Perlakukan sebagai `none`, catat peringatan di log server. |
| E-29 | S-02 | `#case-<slug>` tidak ada atau proyeknya draft | Halaman Work dibuka di atas, tanpa error. |
| E-30 | S-01 | Browser tanpa `animation-timeline` (Firefox saat ini) atau reduced motion | Semua bab tampil sebagai tumpukan statis dalam keadaan akhir (statement penuh, angka akhir, "five passwords" sudah dicoret), Selected work sebagai daftar biasa, scroll snap mati saat reduced motion. |
| E-31 | Semua | `localStorage` tidak tersedia (mode privat, diblokir) | Tema mengikuti perangkat; toggle tetap mengganti tema untuk sesi itu tanpa error. |
| E-32 | S-01, S-14 | Avatar belum diganti (320 px) | Tetap tampil; tidak ada peringatan publik; S-14 menampilkan "Current file is 320 px. A larger one is recommended." |

## 9. Data model

Satu entitas bisnis: **Project**, plus pengaturan situs. Kredensial admin dan sesi adalah data teknis; mekanisme penyimpanannya (tabel vs environment variable) diputuskan di SDD, tapi perilakunya dikunci di sini.

### Project

| Field | Tipe | Wajib | Aturan | Dipakai di |
| --- | --- | --- | --- | --- |
| `id` | string (UUID/cuid) | ya | dibuat server, tidak bisa diubah | route S-13, API |
| `slug` | string | ya | dibuat otomatis dari `title_en` (kebab-case, unik, ditambah `-2` jika bentrok); tidak ditampilkan di UI v1 | event analytics, schema, masa depan (case study) |
| `title_en` / `title_id` | string | ya | 1–80 karakter, di-trim | Selected work, baris case, admin, schema |
| `group` | enum `panasonic`\|`web`\|`ai` | ya | default `web` | filter S-02, S-11 |
| `meta_en` / `meta_id` | string atau null | publish | 1–40 | baris case, label Selected work |
| `side_en` / `side_id` | string atau null | tidak | 0–20 | kolom kanan baris case, akhir label Selected work |
| `summary_en` / `summary_id` | string | ya | 1–160 karakter, di-trim, teks biasa (tanpa HTML/markdown) | deskripsi singkat di Selected work; pengganti `case_is` bila kosong (E-27) |
| `case_is_en` / `case_is_id` | string atau null | publish | 1–220 | baris case |
| `case_did_en` / `case_did_id` | string\[\] atau null | publish | 1–8 item, tiap 1–160 | baris case |
| `tags` | string\[\] | tidak | 0–6 item, tiap item 1–24 karakter, unik (case-insensitive) | "Stack" di baris case |
| `status_en` / `status_id` | string atau null | publish | 1–40 | baris case |
| `case_action` | enum `site`\|`walkthrough`\|`none` | ya | default `site` | tombol baris case, tautan Selected work |
| `live_url` | string atau null | bila `case_action = site` | URL valid, skema `https`, maks 300 | tautan situs, schema |
| `visual_type` | enum `screenshot`\|`number` | ya | default `screenshot` | Selected work, S-11 |
| `thumbnail` | objek atau null | bila `visual_type = screenshot` dan published | `{ public_id, url, width, height }` dari storage gambar | Selected work, admin |
| `thumbnail_alt_en` / `thumbnail_alt_id` | string atau null | wajib jika ada thumbnail | 1–140 karakter | alt gambar |
| `card_number` | string atau null | bila `visual_type = number` | 1–12 | kartu angka (tampil mulai v2.1.0) |
| `card_caption_en` / `card_caption_id` | string atau null | bila `visual_type = number` | 1–60 | kartu angka |
| `show_on_home` | boolean | ya | default false; maks. 5 bernilai true (termasuk draft) | Selected work |
| `sort_order` | integer | ya | posisi 1…n, unik, diatur server: project baru = 1 (yang lain +1), ↑/↓ menukar dua tetangga (API-08), hapus menutup celah; `updated_at` tidak berubah karena pergeseran posisi | urutan semua daftar |
| `featured` | boolean | — | **deprecated**, tidak dibaca/ditulis (D-22) | — |
| `published` | boolean | ya | default false | filter publik |
| `created_at` / `updated_at` | datetime (UTC) | ya | diisi server | urutan sekunder, `lastmod` sitemap, S-11 |

**Aturan turunan**

- Publik hanya melihat `published = true`. Draft tidak pernah bocor ke HTML, sitemap, schema, atau API publik.
- Urutan standar: `sort_order` (posisi) asc; `created_at` desc hanya sebagai cadangan jika posisi kembar (tidak terjadi setelah migrasi 0003).
- Menghapus project juga menghapus `thumbnail.public_id` di storage. Mengganti thumbnail menghapus gambar lama setelah simpan berhasil.
- `lastmod` sitemap = `max(updated_at)` dari project published.
- Selected work = `published AND show_on_home` urut `sort_order`, maks. 5.
- Proyek published v1 yang belum diisi field v2 tetap valid dan tampil di S-02 dengan bagian case yang kosong disembunyikan (E-27), sampai diedit.

**DTO publik (bentuk data yang diterima komponen publik, per locale)**

```json
{
  "id": "clx123",
  "slug": "hr-system",
  "group": "panasonic",
  "title": "HR System",
  "meta": "Panasonic · 13 companies",
  "side": "2022–now",
  "summary": "The HR system 13 Panasonic group companies run on.",
  "caseIs": "A legacy HRMS that 13 Panasonic group companies in Indonesia run on.",
  "caseDid": ["One of three developers on the system since November 2022."],
  "stack": ["ASP.NET Web Forms", "C#", "SQL Server", "Azure"],
  "status": "Live, 2022–now",
  "caseAction": "walkthrough",
  "liveUrl": null,
  "visual": { "type": "number", "number": "13", "caption": "group companies on one HR system" },
  "showOnHome": true
}
```

`visual` = `{ type: "screenshot", url, width, height, alt }` | `{ type: "number", number, caption }` | `null`.

Contoh di atas hanya ilustrasi bentuk; isi project asli diisi Pal lewat admin.

### Pengaturan situs

- `availability_on` boolean, default true bila belum pernah disimpan (S-14).
- `profile_photo` id gambar avatar atau null (S-14).

### Admin credential & sesi (perilaku)

- Tepat satu admin. Email + hash password (bcrypt/argon2) disimpan di sisi server, tidak pernah di repo atau client.
- Sesi: token acak atau token bertanda tangan di cookie `admin_session` (G4), berlaku 7 hari, dicabut saat logout.
- Rate limit login: 5 gagal / 15 menit / IP.

## 10. Kontrak API admin

Hanya admin yang menulis data; halaman publik membaca langsung di server saat render, jadi tidak ada API publik. Kontrak di bawah berlaku apakah SDD mengimplementasikannya sebagai Route Handler atau Server Action: input, output, dan kode error harus sama.

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
| API-01 | `POST /api/admin/login` | `{ email, password }` | `200 { ok: true }` + Set-Cookie sesi | `400 VALIDATION_FAILED` · `401 INVALID_CREDENTIALS` · `403 FORBIDDEN_ORIGIN` · `429 RATE_LIMITED` + `retryAfterSeconds` (+ header `Retry-After`) · `503 ADMIN_NOT_CONFIGURED` (env admin tidak valid) · `500 SERVER_ERROR` |
| API-02 | `POST /api/admin/logout` | — | `204` + cookie dihapus | — (selalu sukses) |
| API-03 | `POST /api/admin/projects` | `ProjectInput` | `201 { project, revalidated: boolean }` | `401` · `422 VALIDATION_FAILED` + `fields` (termasuk `fields.show_on_home` "Selected work already has 5 projects. Turn one off first.", E-26) · `500 SERVER_ERROR` |
| API-04 | `PATCH /api/admin/projects/:id` | `ProjectInput` parsial | `200 { project, revalidated }` | `401` · `404 NOT_FOUND` · `422` (termasuk E-26) · `500` |
| API-05 | `DELETE /api/admin/projects/:id` | — | `200 { revalidated }` (gambar ikut dihapus) | `401` · `404` · `500` |
| API-06 | `POST /api/admin/uploads` | multipart: 1–4 bagian `variant` (lebar hasil kompresi browser dari satu gambar); `kind=avatar` minimal 640 × 640 | `201 { public_id, url, width, height }` | `401` · `413 FILE_TOO_LARGE` · `415 UNSUPPORTED_TYPE` · `422 IMAGE_TOO_SMALL` / `VALIDATION_FAILED` · `502 UPLOAD_FAILED` |
| API-07 | `DELETE /api/admin/uploads/:public_id` | — | `204` | `401` · `404` (dianggap sukses oleh UI) · `409 IMAGE_IN_USE` (gambar dipakai project tersimpan atau foto profil; tidak dihapus) |
| API-08 | `POST /api/admin/projects/:id/move` | `{ direction: "up" | "down" }` | `200 { position, revalidated }` (posisi tetap jika sudah di ujung) | `401` · `404` · `422 VALIDATION_FAILED` · `500` |
| API-09 | `PUT /api/admin/profile` | `{ photo_public_id?: string \| null, availability_on?: boolean }` (field yang tidak dikirim tidak berubah; foto dari API-06 `kind=avatar`, persegi) | `200 { photo, availability_on, revalidated }`; keduanya disimpan dalam satu transaksi; foto lama dihapus; avatar varian 320/640 | `401` · `422` + `fields.photo` / `fields.availability_on` · `500` |

**`ProjectInput`**

```json
{
  "title_en": "string", "title_id": "string",
  "group": "panasonic | web | ai",
  "meta_en": "string", "meta_id": "string",
  "side_en": "string", "side_id": "string",
  "summary_en": "string", "summary_id": "string",
  "show_on_home": false,
  "case_is_en": "string", "case_is_id": "string",
  "case_did_en": ["string"], "case_did_id": ["string"],
  "tags": ["string"],
  "status_en": "string", "status_id": "string",
  "case_action": "site | walkthrough | none",
  "live_url": "https://... | null",
  "visual_type": "screenshot | number",
  "thumbnail": { "public_id": "string", "url": "string", "width": 1600, "height": 1000 },
  "thumbnail_alt_en": "string", "thumbnail_alt_id": "string",
  "card_number": "string", "card_caption_en": "string", "card_caption_id": "string",
  "published": true
}
```

- `featured` diabaikan bila dikirim; `tags` maks. 6; `live_url` boleh `null` kecuali `case_action = site`.
- `thumbnail` boleh `null` saat `published = false`. Server hanya memakai `thumbnail.public_id`; `url`, `width`, `height` diambil dari penyimpanan gambar. `public_id` yang sudah tidak ada → `422` dengan pesan di field `thumbnail`.
- `revalidated: false` → UI menampilkan E-19.
- API-07 dipanggil saat user klik Remove/Replace pada gambar yang belum pernah tersimpan, atau Cancel form dengan upload baru. Gambar yang sudah tersimpan hanya dihapus lewat API-04/05.
- Daftar project di S-11 dan data S-13 dibaca langsung di server (bukan lewat endpoint publik), tetap dilindungi sesi.

**Revalidasi (efek samping API-03/04/05):** `/`, `/work`, `/id`, `/id/work`, dan `sitemap.xml`.

## 11. Kontrak analytics & string i18n

### Event GA4

Hanya event ini yang dikirim, semuanya hanya setelah `consent=granted`. Nama event format `object_action`, huruf kecil.

| Event | Kapan | Parameter |
| --- | --- | --- |
| `page_view` | Otomatis GA4 tiap halaman publik | `page_location`, `language` (`en`/`id`) |
| `contact_email_click` | Klik mailto atau Copy email | `kind`: `general`\|`role`\|`project`\|`walkthrough`; `location`: `bar`\|`hero`\|`contact`\|`work_contact`\|`case`; `method`: `mailto`\|`copy`; `language`; `project_slug` (hanya kind walkthrough) |
| `cv_download` | Klik Download CV | `location`: `about`\|`contact`; `language` |
| `case_open` | Baris case dibuka | `project_slug`; `source`: `home_title`\|`row`\|`hash`; `language` |
| `project_link_click` | Klik situs live | `project_slug`; `page`: `home`\|`work`; `placement`: `home`\|`case`; `language` |
| `theme_switch` | Klik O-04 | `to`: `dark`\|`light` |
| `language_switch` | Klik O-01 atau aksi O-02 | `from`, `to`, `source`: `toggle` \| `banner` |

Key event (konversi) di GA4: `contact_email_click` dan `cv_download`. Admin tidak memuat GA4 sama sekali. `sessionStorage` `rr-case-from-home` adalah penanda sekali pakai agar klik judul di home tidak terhitung dua kali sebagai `case_open`.

### String i18n

Semua label UI tinggal di dua file kamus (`i18n/en.json`, `i18n/id.json`) dengan key yang sama. Kamus v2 = key `T` di `option-b.html` (`skip`, `nav.*`, `cta`, `hero.*`, `work.*`, `w.*`, `about.*`, `e1..e3*`, `case.*`, `st*`, `bridge.*`, `ct.*`, `wp.*`, `c.*`, `mail.*`, `ft.*`), dengan tambahan dan perubahan:

| Key | EN | ID |
| --- | --- | --- |
| `ct.h.more` | Have a project like *these?* | Punya proyek seperti *ini?* |
| `cv.download` | Download CV (PDF) | Unduh CV (PDF) |
| `email.copy` / `email.copied` | Copy email / Copied | Salin email / Tersalin |
| `mail.walk.s` | Walkthrough: {title} | Walkthrough: {title} |
| `work.empty` | New work is on the way. Meanwhile, here's how to reach me. | Karya baru sedang disiapkan. Sementara itu, ini cara menghubungi saya. |
| `theme.toDark` / `theme.toLight` | Switch to dark mode / Switch to light mode | Ganti ke mode gelap / Ganti ke mode terang |
| `group.panasonic` / `group.web` / `group.ai` | Panasonic / Websites / AI tools | Panasonic / Website / Alat AI |
| `wp.sub.*` | Potongan per grup (`one`/`other`), penghubung, penutup, kata angka 1–10 (D-30) | sama |
| `langBanner.text` | Also available in Indonesian. | (tidak dipakai, banner hanya di EN) |
| `consent.body` | I use Google Analytics to see which pages are useful. It only runs if you allow it. | Saya memakai Google Analytics untuk melihat halaman mana yang berguna. Hanya aktif jika kamu izinkan. |
| `notFound.title` | This page doesn't exist | Halaman ini tidak ada |

Key `cur.*`, `peek.*`, `w.case` disimpan di kamus untuk v2.1.0 tetapi belum dirender. Teks proyek (`w1..w5`, `r*`, `c*`, `peek.*` di mockup) **bukan** key kamus: itu isi awal untuk admin (konten database).

Tag `<em>` (kata aksen miring), `<s>` (teks dicoret), dan `<strong>` di nilai kamus adalah penanda rich-text yang dirender helper `richText()` menjadi elemen yang sudah ditentukan (SDD bagian 5), bukan HTML mentah. Tag lain tidak diizinkan. Ikon panah (↗, →) bukan bagian dari string; dirender komponen supaya bisa dianimasikan.

**Pesan error admin (EN saja)**

| Kondisi | Pesan |
| --- | --- |
| Field wajib kosong | {Field} is required. |
| Terlalu panjang | Keep it under {n} characters ({current} now). |
| URL tidak valid | URL must start with https:// and be a full address. |
| Stack > 6 | Use up to 6 items. |
| What I did > 8 | Use up to 8 lines. |
| Site tanpa Live URL | Add a live URL, or choose another button. |
| Selected work penuh | Selected work already has 5 projects. Turn one off first. |
| File > 5 MB | This image is {size} MB. Upload one under 5 MB. |
| Tipe salah | Use a JPG, PNG, or WebP image. |
| Lebar < 1200 px | This image is {w} px wide. Use one at least 1200 px wide. |
| Upload gagal | Upload failed. Check your connection and try again. |
| Publish belum lengkap | Add a screenshot and alt text to publish, or turn off Published to save as draft. |

Copy ID di tabel ini adalah draft awal dan boleh direvisi Pal saat penulisan konten; key-nya tidak boleh berubah.

## 12. Traceability & batasan untuk coding AI

Setiap fitur PRD punya layar, flow, dan edge case yang bisa dites. Fitur dianggap selesai hanya jika semua acceptance criteria PRD-nya lolos dan flow terkaitnya jalan end-to-end.

| Fitur PRD | Layar / overlay | Flow | Edge case | API / kontrak |
| --- | --- | --- | --- | --- |
| F1 Homepage | S-01, O-04 | UF-01 | E-01, E-03, E-05, E-07, E-20, E-25, E-30, E-31, E-32 | DTO publik |
| F2 Work | S-02 | UF-01 | E-01, E-27, E-29 | DTO publik |
| F3 Case row | S-01, S-02 | UF-01 | E-06, E-27, E-28 | `case_open`, `project_link_click` |
| F4 Bilingual | O-01, O-02, semua publik | UF-02, UF-04 | E-07, E-18, E-20 | G1, G4, `language_switch` |
| F5 Kontak | Bar, S-01, S-02 | UF-03 | E-09 | `contact_email_click`, `cv_download` |
| F6 Admin login | S-10, G3 | UF-06, UF-10 | E-10, E-11 | API-01, API-02 |
| F7 Admin CRUD | S-11, S-12, S-13, S-14 | UF-07, UF-08, UF-09 | E-11 s.d. E-17, E-19, E-26 | API-03 s.d. API-09 |
| F8 GA4 + consent | O-03, S-03 | UF-05 | E-07 | Event GA4, G4 |
| F9 SEO | Semua publik, S-04 | — | E-18 | PRD bagian 9 |

**Jangan ditebak atau ditambahkan oleh coding AI**

- Jangan menambah layar, section, field, filter, pencarian, paginasi, atau form kontak.
- Motion hanya D-08 + D-10 (PRD bagian 8), CSS saja; JS klien halaman publik hanya untuk daftar di PRD bagian 10. Jangan membuat carousel, library animasi, rotasi/timer JS, parallax berbasis JavaScript, atau fade-in pada H1/sub.
- Jangan membangun lapisan pointer atau preview admin (v2.1.0).
- Jangan merender link GitHub bila kosong.
- Jangan memakai `--calm` atau `--faint` untuk teks.
- Jangan membaca/menulis kolom `featured`.
- Jangan auto-redirect berdasarkan bahasa browser, IP, atau cookie.
- Jangan memuat GA4 atau cookie analytics sebelum `consent=granted`.
- Jangan menyimpan gambar di filesystem server atau di repo.
- Jangan hardcode data project di komponen; jangan menampilkan project `published=false` di mana pun di sisi publik.
- Jangan menerjemahkan otomatis di runtime; semua teks berasal dari kamus i18n atau field database per bahasa.
- Jangan membuat akun admin kedua, halaman register, atau reset password publik.
- Jangan mengganti font, warna, atau copy yang sudah dikunci di PRD tanpa persetujuan.
- Jika dokumen ini, PRD, dan SDD tidak menjawab sebuah pertanyaan implementasi: berhenti dan tanya, jangan mengarang.

**Urutan dokumen:** PRD (apa & kenapa) → dokumen ini (layar, flow, state, kontrak) → SDD (arsitektur, library, struktur repo, deploy ke Hostinger via GitHub, aturan kerja dengan coding AI).
