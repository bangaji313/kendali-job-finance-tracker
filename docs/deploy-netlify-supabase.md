# Deploy gratis: Netlify + Supabase

Kendali memakai Netlify untuk Next.js dan Supabase untuk database, autentikasi, storage, serta scheduler. Konfigurasi ini cukup untuk pemakaian pribadi selama masih berada dalam kuota paket gratis masing-masing layanan; kuota dan kebijakan penyedia dapat berubah.

## 1. Siapkan repository

1. Commit isi folder `G:\ProjectCodex\Job&Finance_Tracker` ke repository GitHub private.
2. Jangan commit `.env.local`; hanya `.env.example` yang boleh masuk Git.
3. Jalankan `pnpm verify` sebelum push.

## 2. Siapkan Supabase

1. Gunakan project Supabase yang sudah terhubung atau buat satu project Free.
2. Terapkan seluruh file dalam `supabase/migrations` secara berurutan melalui Supabase CLI (`supabase db push`) atau SQL Editor.
3. Di **Authentication > Providers**, aktifkan Email + Password dan izinkan pendaftaran pengguna baru. Google OAuth tidak dibutuhkan.
4. Di **Authentication > Sign In / User Signups**, aktifkan **Confirm email** agar akun baru wajib membuka tautan konfirmasi.
5. Nilai `INITIAL_ADMIN_EMAIL` di Netlify harus sama persis dengan email yang akan menjadi admin pertama. Daftarkan email tersebut melalui `/daftar`, konfirmasi, lalu login; Kendali membuat profil admin otomatis. Pengguna lain dapat mendaftar sendiri dan selalu memperoleh role member.

## 3. Konfigurasikan email autentikasi

Email konfirmasi dan pemulihan tetap dibuat oleh Supabase Auth. Namun, project Free baru tidak dapat memakai template kustom melalui SMTP bawaan dan SMTP bawaan tidak ditujukan untuk mengirim ke semua alamat pengguna. Agar pendaftaran publik benar-benar dapat mengirim email profesional dengan biaya awal nol, hubungkan penyedia SMTP yang memiliki kuota gratis di **Authentication > Email > SMTP Settings**.

Setelah SMTP aktif:

1. Buka **Authentication > Email Templates > Confirm signup** dan salin isi `supabase/templates/confirmation.html`.
2. Gunakan subject `Konfirmasi email Anda · Kendali`.
3. Buka template **Reset password** dan salin isi `supabase/templates/recovery.html`.
4. Gunakan subject `Atur ulang password · Kendali`.
5. Pertahankan variabel `{{ .SiteURL }}` dan `{{ .TokenHash }}`; route `/auth/confirm` memverifikasi token satu kali secara server-side.
6. Kirim tes ke alamat sendiri, lalu cek tampilan desktop/mobile dan folder spam.

Untuk Supabase local, template tersebut sudah terhubung melalui `supabase/config.toml` dan email dapat diperiksa di Mailpit `http://127.0.0.1:54324`. Konfigurasi template hosted tidak ikut terkirim oleh `supabase db push`, sehingga langkah Dashboard di atas tetap wajib.

## 4. Hubungkan Netlify

1. Pilih **Add new project > Import an existing project**, lalu pilih repository GitHub.
2. Netlify membaca `netlify.toml`: build command `pnpm build`, publish directory `.next`, Node 24, dan pnpm 11.19.0.
3. Tidak perlu memasang adapter Next.js secara manual; Netlify menggunakan adapter OpenNext secara otomatis.

Tambahkan environment variables berikut pada Netlify:

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Publishable key; aman untuk browser bersama RLS |
| `SUPABASE_SECRET_KEY` | Ya | Secret key server; jangan memakai prefix `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Ya | URL produksi Netlify, tanpa slash akhir |
| `INITIAL_ADMIN_EMAIL` | Ya | Email pendaftar yang dijadikan admin pertama |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Untuk push | Public VAPID key |
| `VAPID_PRIVATE_KEY` | Untuk push | Private VAPID key |
| `VAPID_SUBJECT` | Untuk push | Contoh `mailto:admin@example.com` |
| `REMINDER_DISPATCH_SECRET` | Untuk push | Secret acak panjang untuk endpoint scheduler |

Jangan menyalin nilai rahasia ke `netlify.toml`, `.env.example`, issue, atau log build.

## 5. Atur redirect Auth

Setelah Netlify memberi domain produksi, buka **Supabase > Authentication > URL Configuration**:

- **Site URL**: `https://nama-site.netlify.app`
- **Redirect URLs**:
  - `http://localhost:3000/**`
  - `http://127.0.0.1:3000/**`
  - `https://nama-site.netlify.app/auth/callback`
  - Opsional preview: `https://**--nama-site.netlify.app/**`

Gunakan URL produksi yang eksak untuk production. Wildcard hanya untuk deploy preview. Reset password memakai `/auth/callback?next=/atur-ulang-password` dan akan gagal bila URL belum diizinkan.

## 6. Aktifkan reminder push (opsional)

Setelah deployment produksi berhasil:

1. Isi seluruh variable VAPID dan `REMINDER_DISPATCH_SECRET` di Netlify.
2. Ganti placeholder domain dan secret pada `docs/reminder-scheduler.sql` tanpa menyimpan secret hasil edit ke Git.
3. Jalankan SQL tersebut di Supabase SQL Editor satu kali.
4. Pastikan extension `pg_cron`, `pg_net`, dan Vault tersedia, lalu uji satu reminder due.

Fitur inti job tracker dan finance tracker tetap berjalan bila push scheduler belum diaktifkan; reminder masih terlihat di dalam aplikasi.

## 7. Verifikasi produksi

1. Daftar memakai email baru, terima email konfirmasi profesional, konfirmasi, lalu login.
2. Buat satu lowongan dan konversi menjadi lamaran.
3. Buat akun, transaksi, anggaran, dan target tabungan.
4. Coba lupa password dari domain Netlify.
5. Pastikan lampiran bersifat private dan ekspor hanya tersedia setelah login.
6. Periksa log Netlify Functions dan Supabase tanpa menyalin data finansial atau secret.

Referensi resmi: [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Supabase local email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates), dan [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
