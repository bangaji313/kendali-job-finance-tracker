"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/app/actions";
import { convertOpportunityToApplication, createOpportunityMilestone } from "@/app/(app)/lowongan/actions";

const initialState: ActionState = { status: "idle", message: "" };

export function ConvertOpportunityForm({ opportunityId, applicationId }: { opportunityId: string; applicationId: string | null }) {
  const [state, formAction, pending] = useActionState(convertOpportunityToApplication, initialState);
  if (applicationId) return <Link className="button button--primary" href={`/lamaran/${applicationId}`}>Buka lamaran</Link>;
  return (
    <form action={formAction} className="inline-action">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <button className="button button--primary" type="submit" disabled={pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>{pending ? "Memindahkan…" : "Tandai dilamar"}</button>
      <p className="form-status" data-state={state.status} role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}

export function MilestoneForm({ opportunityId }: { opportunityId: string }) {
  const [state, formAction, pending] = useActionState(createOpportunityMilestone, initialState);
  return (
    <form action={formAction} className="form-grid">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="milestone-title">Nama milestone</label><input className="input" id="milestone-title" name="title" required maxLength={160} disabled={pending} placeholder="Contoh: Tes daring" /><span className="field-help">Tahap seleksi atau persiapan.</span></div>
        <div className="field"><label htmlFor="milestone-due">Jadwal</label><input className="input mono" id="milestone-due" name="dueAt" type="datetime-local" disabled={pending} /><span className="field-help">Opsional; memakai waktu Asia/Jakarta.</span></div>
      </div>
      <div className="field"><label htmlFor="milestone-notes">Catatan</label><input className="input" id="milestone-notes" name="notes" maxLength={1000} disabled={pending} placeholder="Materi atau tautan terkait" /><span className="field-help">Opsional</span></div>
      <div><button className="button" type="submit" disabled={pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>{pending ? "Menambahkan…" : "Tambah milestone"}</button></div>
      <p className="form-status" data-state={state.status} role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}
