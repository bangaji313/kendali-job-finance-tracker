"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpWithPassword, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export function SignUpForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(signUpWithPassword, initialState);

  return (
    <div className="auth-panel">
      <form action={formAction} className="form-grid">
        <div className="field">
          <label htmlFor="signup-name">Nama lengkap</label>
          <input className="input" id="signup-name" name="fullName" type="text" autoComplete="name" minLength={2} maxLength={100} required disabled={!configured || pending} placeholder="Nama Anda" />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Alamat email</label>
          <input className="input" id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" required disabled={!configured || pending} placeholder="nama@domain.com" />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input className="input" id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} aria-describedby="signup-password-help" required disabled={!configured || pending} />
          <span className="field-help" id="signup-password-help">Minimal 8 karakter. Gunakan password unik yang tidak dipakai di layanan lain.</span>
        </div>
        <div className="field">
          <label htmlFor="signup-confirmation">Konfirmasi password</label>
          <input className="input" id="signup-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={!configured || pending} />
        </div>
        <button className="button button--primary" type="submit" disabled={!configured || pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>
          {pending ? "Membuat akun…" : "Buat akun"}
        </button>
      </form>
      <p className="form-status" role="status" aria-live="polite" data-state={state.status}>
        {configured ? state.message || "Tautan konfirmasi akan dikirim ke alamat email Anda." : "Supabase belum dikonfigurasi. Pendaftaran belum tersedia."}
      </p>
      <p className="dialog-links">
        Sudah punya akun? <Link href="/masuk" className="text-link">Masuk</Link>
      </p>
    </div>
  );
}
