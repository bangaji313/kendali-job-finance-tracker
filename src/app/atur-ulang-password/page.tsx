import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata = { title: "Atur ulang password" };

export default async function UpdatePasswordPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/masuk?error=recovery");

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-intro">
          <Link href="/hari-ini" className="brand"><span className="brand-mark">K</span>Kendali</Link>
          <div className="page-head__copy">
            <p className="eyebrow">Keamanan akun</p>
            <h1>Tentukan password Anda.</h1>
            <p className="page-head__description">Setelah disimpan, gunakan email dan password ini untuk masuk ke Kendali.</p>
          </div>
        </section>
        <UpdatePasswordForm />
      </div>
    </main>
  );
}
