"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithPassword, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export function AuthForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initialState);

  return (
    <div className="auth-panel">
      <form action={formAction} className="form-grid">
        <div className="field">
          <label htmlFor="email">Alamat email</label>
          <input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="username" required disabled={!configured || pending} placeholder="nama@domain.com" />
        </div>
        <div className="field">
          <div className="field-label-row"><label htmlFor="password">Password</label><Link href="/lupa-password">Lupa password?</Link></div>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required disabled={!configured || pending} />
          <span className="field-help">Browser dapat menawarkan penyimpanan email dan password setelah berhasil masuk.</span>
        </div>
        <button className="button button--primary" type="submit" disabled={!configured || pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>
          {pending ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
      <p className="form-status" role="status" aria-live="polite" data-state={state.status}>
        {configured ? state.message || "Gunakan akun yang emailnya sudah dikonfirmasi." : "Supabase belum dikonfigurasi. Gunakan mode pratinjau dari halaman utama."}
      </p>
      <p className="dialog-links">
        Belum punya akun? <Link href="/daftar" className="text-link">Daftar sekarang</Link>
      </p>
    </div>
  );
}
