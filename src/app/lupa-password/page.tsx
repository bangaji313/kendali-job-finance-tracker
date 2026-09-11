import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Lupa password" };

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-intro">
          <Link href="/masuk" className="brand"><span className="brand-mark">K</span>Kendali</Link>
          <div className="page-head__copy">
            <p className="eyebrow">Pemulihan akun</p>
            <h1>Buat password baru.</h1>
            <p className="page-head__description">Masukkan email akun Kendali. Tautan pemulihan dikirim dan dikelola oleh Supabase.</p>
          </div>
          <Link href="/masuk">Kembali ke halaman masuk</Link>
        </section>
        <PasswordResetForm configured={hasSupabaseEnv()} />
      </div>
    </main>
  );
}
