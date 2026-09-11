"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="auth-panel form-grid">
      <div className="field">
        <label htmlFor="new-password">Password baru</label>
        <input className="input" id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={pending} />
        <span className="field-help">Gunakan minimal 8 karakter dan hindari password yang dipakai di layanan lain.</span>
      </div>
      <div className="field">
        <label htmlFor="password-confirmation">Ulangi password baru</label>
        <input className="input" id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={pending} />
      </div>
      <button className="button button--primary" type="submit" disabled={pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>
        {pending ? "Menyimpan…" : "Simpan password baru"}
      </button>
      <p className="form-status" role="status" aria-live="polite" data-state={state.status}>{state.message}</p>
    </form>
  );
}
