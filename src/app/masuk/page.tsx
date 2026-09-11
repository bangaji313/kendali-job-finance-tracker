import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Masuk" };

const errorMessages: Record<string, string> = {
  "callback": "Proses autentikasi gagal. Coba masuk kembali.",
  "session": "Sesi tidak dapat dibuat. Pastikan cookie diizinkan dan coba lagi.",
  "profile": "Profil akun belum dapat disiapkan. Coba masuk kembali beberapa saat lagi.",
  "recovery": "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();
  const errorMessage = params.error ? (errorMessages[params.error] ?? "Terjadi kesalahan saat masuk. Coba lagi.") : null;
  const deleted = params.deleted === "1";
  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-intro">
          <Link href="/hari-ini" className="brand"><span className="brand-mark">K</span>Kendali</Link>
          <div className="page-head__copy"><p className="eyebrow">Ruang pribadi Anda</p><h1>Lamaran bergerak. Uang tetap terbaca.</h1><p className="page-head__description">Masuk dengan email dan password untuk melihat tindakan hari ini, memperbarui pipeline kerja, dan mencatat arus kas.</p></div>
          {!configured ? <Link href="/hari-ini" className="button">Buka pratinjau kosong</Link> : null}
        </section>
        <div>
          {deleted ? (
            <aside className="notice" role="status" aria-label="Akun dihapus">
              <div className="notice__body">
                <strong>Akun berhasil dihapus</strong>
                <span>Seluruh data Anda telah dihapus secara permanen. Terima kasih telah menggunakan Kendali.</span>
              </div>
            </aside>
          ) : null}
          {errorMessage ? (
            <aside className="notice" role="alert" aria-label="Kesalahan masuk" style={{ borderColor: "var(--color-error)", background: "var(--color-error-soft)" }}>
              <div className="notice__body">
                <strong>Tidak dapat masuk</strong>
                <span>{errorMessage}</span>
              </div>
            </aside>
          ) : null}
          <AuthForm configured={configured} />
        </div>
      </div>
    </main>
  );
}
