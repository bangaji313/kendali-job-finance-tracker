# PRD — Kendali v1

- Status: Implementasi MVP
- Pemilik produk: Personal-first, public sign-up
- Locale: `id-ID` · Zona waktu: `Asia/Jakarta` · Mata uang: `IDR`

## 1. Masalah dan visi

Aktivitas mencari kerja dan mengelola uang sering berada di alat berbeda. Akibatnya tindak lanjut lamaran terlewat, dampak sebuah tawaran kerja terhadap arus kas tidak terlihat, dan pencatatan membutuhkan terlalu banyak perpindahan konteks.

Kendali menyatukan keduanya dalam halaman “Hari Ini”: satu antrean untuk tindakan lamaran, reminder, kondisi saldo, anggaran, dan target tabungan. Produk ini personal-first dan dapat dipakai banyak akun dengan isolasi data yang kuat. Pengguna mendaftar dengan email/password dan wajib mengonfirmasi email sebelum masuk.

## 2. Tujuan dan non-tujuan

Tujuan MVP:

- Tidak ada deadline atau tindak lanjut lamaran yang hilang.
- Pengguna memahami saldo, pemasukan, pengeluaran, arus kas bersih, anggaran, dan target.
- Lamaran `accepted` dapat dijadikan draft pemasukan rutin secara eksplisit tanpa efek otomatis.
- Pemilik dapat mengimpor, mengekspor, mengarsipkan, dan menghapus data.
- Pengalaman installable dan responsif di desktop maupun ponsel.

Di luar MVP: bank sync, investasi, utang/cicilan, konversi FX, social login, kolaborasi data, email reminder, dark mode, mutasi offline, OCR, rekomendasi AI, aplikasi native, marketing site, dan backup ZIP lengkap.

## 3. Pengguna dan ukuran keberhasilan

Persona utama adalah individu Indonesia yang aktif mencari kerja sekaligus ingin membuat kebiasaan pencatatan keuangan. Admin mengelola konfigurasi produk dan tetap tidak dapat membaca data pengguna lain.

Indikator produk awal:

- Reminder due diselesaikan atau ditunda sebelum lewat 24 jam.
- Lamaran aktif memiliki next action.
- Transaksi rutin dikonfirmasi dari draft.
- Bulan memiliki anggaran dan rekonsiliasi akun selesai.
- Impor berhasil tanpa commit parsial.

## 4. Struktur informasi

| Route | Fungsi |
| --- | --- |
| `/masuk` | Email/password dan akses lupa password |
| `/daftar` | Pendaftaran email/password dan instruksi konfirmasi email |
| `/hari-ini` | Antrean overdue, hari ini, dan tujuh hari berikutnya |
| `/lowongan` | Bank lowongan fresh graduate, filter, deadline, dan status tindak lanjut |
| `/lowongan/[id]` | Detail sumber resmi, timeline manual, dan konversi menjadi lamaran |
| `/lamaran` | Tabel padat, board pipeline, filter, quick capture |
| `/lamaran/[id]` | Detail, riwayat tahap, kontak, dokumen, reminder |
| `/keuangan/transaksi` | Ledger, quick entry, transfer, draft rutin |
| `/keuangan/akun` | Kas, bank, e-wallet, dan akun lain |
| `/keuangan/anggaran` | Batas bulanan kategori serta realisasi |
| `/keuangan/target` | Target tabungan dan kontribusi |
| `/laporan` | Analitik pipeline dan arus kas, disertai tabel data |
| `/notifikasi` | Belum dibaca, selesai, dan ditunda |
| `/pengaturan` | Profil, kategori, label, data, push, dan undangan admin |

Desktop memakai utility side rail. Ponsel memakai bottom navigation: Hari Ini, Lamaran, Tambah, Keuangan, Lainnya. Tambah membuka action sheet lamaran atau transaksi.

## 5. Pengalaman inti

### Hari Ini

Tanggal dan sapaan singkat membuka halaman. Antrean tindakan menjadi konten utama dengan urutan overdue, hari ini, lalu mendatang. Quick capture lamaran dan transaksi tersedia tanpa hero pemasaran. Ringkasan pipeline berupa baris beraturan. Ringkasan finansial menampilkan saldo total, pemasukan, pengeluaran, net cashflow, dan anggaran mendekati batas. Data kosong memakai `—` dan satu tindakan yang jelas; tidak ada angka dekoratif.

### Job tracker

Quick capture minimum: perusahaan, posisi, tahap, tanggal. `EmploymentType`: `internship`, `contract`, `permanent`, `part_time`, `freelance`, `temporary`, `other`. `ApplicationStage`: `saved`, `applied`, `screening`, `assessment`, `interview`, `offer`, `accepted`, `rejected`, `withdrawn`, `archived`. “Ghosted” adalah label pengguna.

Perpindahan tahap selalu membuat activity history. Field lanjutan: lokasi, mode kerja, sumber, kompensasi, mata uang, periode gaji, recruiter, catatan, next action, deadline, dan dokumen. Kontrak dapat menyimpan durasi bulan, tanggal mulai, dan tanggal selesai. Dokumen PDF, DOC/DOCX, atau gambar, maksimal 10 MB, bucket private, tanpa OCR.

Saat tahap menjadi `accepted`, UI menawarkan pembuatan recurring-income draft. Pilihan ini opt-in dan idempoten; tidak pernah mengubah keuangan otomatis.

### Finance tracker

`TransactionKind`: `income`, `expense`, `transfer`. `TransactionState`: `draft`, `posted`, `void`. Draft dan void tidak memengaruhi saldo, anggaran, maupun laporan. Income wajib akun tujuan; expense wajib akun sumber; transfer wajib dua akun berbeda.

Nilai uang adalah `numeric(18,2)`. Saldo = saldo awal + posted inflow − posted outflow. Total bersih transfer lintas semua akun adalah nol. Budget bulanan hanya menghitung posted expense. Rule rutin mingguan, bulanan, tahunan selalu membuat draft. Target tabungan menyimpan target, tanggal, dan kontribusi; kontribusi manual menjelaskan bahwa saldo akun tidak berubah.

### Impor, ekspor, dan reminder

CSV lamaran dan transaksi memiliki template terpisah, preview, normalisasi tanggal, fingerprint duplikat, serta error per baris. Commit atomik; satu error menggagalkan seluruh batch. Warning duplikat dapat diteruskan setelah konfirmasi. Ekspor tersedia sebagai CSV per modul atau JSON seluruh data terstruktur. Lampiran diunduh satu per satu.

Reminder in-app dapat diselesaikan atau ditunda. Push bersifat opt-in per perangkat dan izin browser hanya diminta setelah aksi pengguna. Delivery memakai idempotency key dan retry terhadap item due yang belum berhasil.

## 6. Arah UI/UX Hallmark

Genre `modern-minimal`, macrostructure `Workbench`, theme `Coral`, tone utilitarian hangat. Paper warm-grey, ink near-black, satu aksen coral. Manrope untuk display/body; IBM Plex Mono hanya untuk angka dan label teknis. Semua warna, font, spacing 4px, radius, elevasi, durasi, easing, dan focus ring berasal dari `tokens.css`.

Tidak digunakan: glassmorphism, gradient text, nested cards, emoji sebagai ikon, tiga kartu fitur identik, badge di atas heading, metrik palsu, atau shadow dekoratif. Motion hanya transform/opacity untuk state dan mendukung reduced motion. Setiap kontrol memiliki default, hover, focus-visible, active, disabled, loading, error, dan success. QA dilakukan pada 320, 375, 414, dan 768 px; tabel berubah menjadi list terstruktur pada ponsel. `design.md` baru dibuat bila UI sudah ditinjau dan pemilik meminta “lock the system”.

## 7. Arsitektur

Next.js App Router 16.3.x, React 19, TypeScript strict, Tailwind 4, CSS tokens, dan Server Components secara default. Runtime production dipin Node 24 LTS. Supabase menyediakan PostgreSQL, Auth, Storage, Cron/Vault, serta local development. Sesi memakai `@supabase/ssr` cookie/PKCE. Zod menjadi validator domain tunggal.

Read dilakukan di Server Components, mutasi internal memakai Server Actions, Route Handlers hanya untuk callback, impor/ekspor, serta scheduler. PWA memakai `app/manifest.ts`, icons, service worker static-only, dan HTTPS.

Entitas: `profiles`, `access_allowlist`, `job_opportunities`, `job_opportunity_milestones`, `companies`, `applications`, `application_activities`, `contacts`, `documents`, `labels`, `application_labels`, `accounts`, `categories`, `money_transactions`, `recurring_rules`, `budgets`, `savings_goals`, `goal_contributions`, `reminders`, `notifications`, `notification_deliveries`, `push_subscriptions`, dan `import_batches`.

Endpoint kontrak:

- `GET /auth/confirm` — verifikasi token hash dari email konfirmasi/recovery dan siapkan profil pengguna.
- `GET /auth/callback` — exchange PKCE code untuk flow kompatibilitas/invite.
- Server Actions — CRUD produk dan undangan.
- `POST /api/import/{applications|transactions}/{validate|commit}`.
- `GET /api/export?scope=applications|finance|all&format=csv|json`.
- `POST /api/internal/reminders/dispatch` — secret scheduler dan delivery idempoten.

## 8. Keamanan dan privasi

Pendaftaran email/password terbuka dan konfirmasi email diwajibkan. Admin awal berasal dari environment; allowlist lama hanya dapat memberi role admin dan tidak membatasi pendaftaran. Semua tabel pengguna memiliki grant minimum dan RLS per operasi `auth.uid() = user_id`. Test mencakup anon, owner, dan pengguna kedua. Service key hanya server-side. Storage private memakai path `user_id/application_id/file_id`, signed URL singkat, serta validasi MIME, ekstensi, ukuran, dan ownership di server.

View memakai `security_invoker`. Log tidak memuat nominal, catatan, token, email penuh, atau nama dokumen. Service worker tidak menyimpan HTML/API/data finansial. Penghapusan item biasa adalah archive + Undo. Penghapusan akun memakai typed confirmation, menawarkan ekspor, lalu menghapus seluruh data/file.

## 9. Deployment dan operasi

Supabase Cron memanggil reminder dispatch setiap 15 menit; secret disimpan di Vault. Netlify menjalankan Next.js App Router melalui adapter OpenNext dan tidak dipakai sebagai scheduler. Environment dipisah menjadi local, Deploy Preview, dan production. Repository GitHub private, `main` terlindungi, preview per pull request, lalu commit tervalidasi dipromosikan ke production. Migrasi versioned, backward-compatible, dan diuji sebelum production.

## 10. Acceptance criteria dan release gate

- Unit: saldo, transfer, budget, recurring dates, stage transition, locale/date, CSV, fingerprint.
- Database: constraint, trigger/history, grants, RLS anon/owner/other.
- Integration: sign-up/konfirmasi email, login tanpa allowlist, recovery, CRUD, upload, import atomik, recurring draft, reminder retry, accepted-to-income idempoten.
- E2E: onboarding, siklus lamaran, siklus transaksi, filter, ekspor, push opt-in, account deletion, mobile navigation.
- Accessibility: keyboard, focus, labels, error association, target 44 px, WCAG AA, tabel untuk chart.
- Responsive: tidak ada horizontal scroll atau aksi dua baris pada 320/375/414/768 px.
- PWA: installable via HTTPS, manifest/icon valid, offline fallback, zero sensitive cache.
- Performance: Lighthouse Performance ≥90 dan Accessibility ≥95 dengan data realistis.
- Hallmark: pre-emit critique ≥3/5 di semua sumbu dan 58 slop-test gates lulus.
- Release: lint, typecheck, unit, database, build, E2E Preview, security checklist, migration verification hijau.

## 11. Referensi keputusan

- [Node.js release policy](https://nodejs.org/en/about/previous-releases)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Hallmark](https://github.com/Nutlope/hallmark)
