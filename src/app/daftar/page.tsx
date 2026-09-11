import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Daftar" };

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-intro">
          <Link href="/masuk" className="brand"><span className="brand-mark">K</span>Kendali</Link>
          <div className="page-head__copy">
            <p className="eyebrow">Akun baru</p>
            <h1>Buat ruang kendali Anda.</h1>
            <p className="page-head__description">Daftar dengan email aktif. Setelah dikonfirmasi, lamaran dan catatan keuangan Anda tersimpan terpisah dan hanya dapat diakses oleh akun Anda.</p>
          </div>
          <Link href="/masuk">Sudah terdaftar? Masuk</Link>
        </section>
        <SignUpForm configured={hasSupabaseEnv()} />
      </div>
    </main>
  );
}
