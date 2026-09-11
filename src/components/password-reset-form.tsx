"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export function PasswordResetForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="auth-panel form-grid">
      <div className="field">
        <label htmlFor="recovery-email">Alamat email</label>
        <input className="input" id="recovery-email" name="email" type="email" inputMode="email" autoComplete="email" required disabled={!configured || pending} placeholder="nama@domain.com" />
        <span className="field-help">Supabase akan mengirim tautan pemulihan jika email terdaftar.</span>
      </div>
      <button className="button button--primary" type="submit" disabled={!configured || pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>
        {pending ? "Mengirim…" : "Kirim tautan pemulihan"}
      </button>
      <p className="form-status" role="status" aria-live="polite" data-state={state.status}>{state.message}</p>
    </form>
  );
}
