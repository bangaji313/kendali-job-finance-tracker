"use client";

import { useActionState } from "react";
import { updateApplication, type ActionState } from "@/app/actions";
import {
  employmentLabels,
  employmentTypes,
  type ApplicationSummary,
} from "@/lib/domain/types";

const initial: ActionState = { status: "idle", message: "" };

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ApplicationEditForm({ application }: { application: ApplicationSummary }) {
  const [state, action, pending] = useActionState(updateApplication, initial);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="applicationId" value={application.id} />
      <input type="hidden" name="stage" value={application.stage} />
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="edit-company">Perusahaan</label><input className="input" id="edit-company" name="companyName" required defaultValue={application.company} disabled={pending} /></div>
        <div className="field"><label htmlFor="edit-position">Posisi</label><input className="input" id="edit-position" name="position" required defaultValue={application.position} disabled={pending} /></div>
        <div className="field"><label htmlFor="edit-employment">Jenis pekerjaan</label><select className="input" id="edit-employment" name="employmentType" defaultValue={application.employmentType} disabled={pending}>{employmentTypes.map((type) => <option key={type} value={type}>{employmentLabels[type]}</option>)}</select></div>
        <div className="field"><label htmlFor="edit-applied">Tanggal melamar</label><input className="input" id="edit-applied" name="appliedAt" type="date" defaultValue={application.appliedAt ?? ""} disabled={pending} /></div>
        <div className="field"><label htmlFor="edit-location">Lokasi</label><input className="input" id="edit-location" name="location" defaultValue={application.location ?? ""} disabled={pending} placeholder="Jakarta" /></div>
        <div className="field"><label htmlFor="edit-work-mode">Mode kerja</label><select className="input" id="edit-work-mode" name="workMode" defaultValue={application.workMode ?? ""} disabled={pending}><option value="">Belum ditentukan</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></div>
        <div className="field"><label htmlFor="edit-source">Sumber lowongan</label><input className="input" id="edit-source" name="source" defaultValue={application.source ?? ""} disabled={pending} placeholder="LinkedIn atau URL resmi" /></div>
        <div className="field"><label htmlFor="edit-compensation">Kompensasi</label><input className="input mono" id="edit-compensation" name="compensationAmount" inputMode="decimal" defaultValue={application.compensationAmount ?? ""} disabled={pending} placeholder="0.00" /></div>
        <div className="field"><label htmlFor="edit-pay-period">Periode gaji</label><select className="input" id="edit-pay-period" name="payPeriod" defaultValue={application.payPeriod ?? ""} disabled={pending}><option value="">Belum ditentukan</option><option value="hourly">Per jam</option><option value="daily">Per hari</option><option value="monthly">Per bulan</option><option value="yearly">Per tahun</option></select></div>
        <div className="field"><label htmlFor="edit-contract-months">Durasi kontrak</label><input className="input mono" id="edit-contract-months" name="contractMonths" type="number" min="1" max="600" defaultValue={application.contractMonths ?? ""} disabled={pending} /><span className="field-help">Bulan; kosongkan bila tidak relevan.</span></div>
        <div className="field"><label htmlFor="edit-contract-start">Mulai kontrak</label><input className="input" id="edit-contract-start" name="contractStart" type="date" defaultValue={application.contractStart ?? ""} disabled={pending} /></div>
        <div className="field"><label htmlFor="edit-contract-end">Selesai kontrak</label><input className="input" id="edit-contract-end" name="contractEnd" type="date" defaultValue={application.contractEnd ?? ""} disabled={pending} /></div>
        <div className="field"><label htmlFor="edit-next-action">Tindakan berikutnya</label><input className="input" id="edit-next-action" name="nextAction" defaultValue={application.nextAction ?? ""} disabled={pending} placeholder="Follow up recruiter" /></div>
        <div className="field"><label htmlFor="edit-next-action-at">Jadwal tindakan</label><input className="input" id="edit-next-action-at" name="nextActionAt" type="datetime-local" defaultValue={localDateTime(application.nextActionAt)} disabled={pending} /></div>
      </div>
      <div className="field"><label htmlFor="edit-notes">Catatan</label><textarea className="input" id="edit-notes" name="notes" defaultValue={application.notes ?? ""} disabled={pending} /></div>
      <div className="page-actions"><button className="button button--primary" type="submit" disabled={pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>{pending ? "Menyimpan…" : "Simpan detail"}</button></div>
      <p className="form-status" data-state={state.status} role="status">{state.message}</p>
    </form>
  );
}
