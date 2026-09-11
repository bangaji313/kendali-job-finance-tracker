"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions";
import { createOpportunity, updateOpportunity } from "@/app/(app)/lowongan/actions";
import {
  deadlineKindLabels,
  employmentLabels,
  jobOpportunityStatusLabels,
  jobProgramLabels,
  type JobOpportunity,
} from "@/lib/domain/types";

const initialState: ActionState = { status: "idle", message: "" };

export function OpportunityForm({
  enabled,
  opportunity,
}: {
  enabled: boolean;
  opportunity?: JobOpportunity;
}) {
  const editing = Boolean(opportunity);
  const [state, formAction, pending] = useActionState(editing ? updateOpportunity : createOpportunity, initialState);
  const prefix = editing ? `edit-${opportunity?.id}` : "new-opportunity";

  return (
    <form action={formAction} className="form-grid" id={editing ? "edit" : "tambah"}>
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}
      <div className="form-grid form-grid--2">
        <Field label="Perusahaan" id={`${prefix}-company`} help="Wajib">
          <input className="input" id={`${prefix}-company`} name="companyName" defaultValue={opportunity?.companyName} required maxLength={160} disabled={!enabled || pending} placeholder="Nama perusahaan" />
        </Field>
        <Field label="Posisi atau program" id={`${prefix}-title`} help="Wajib">
          <input className="input" id={`${prefix}-title`} name="title" defaultValue={opportunity?.title} required maxLength={160} disabled={!enabled || pending} placeholder="Contoh: Graduate Development Program" />
        </Field>
      </div>
      <Field label="Laman resmi untuk melamar" id={`${prefix}-official-url`} help="Gunakan link karier perusahaan atau ATS resmi, bukan link hasil pencarian.">
        <input className="input" id={`${prefix}-official-url`} name="officialApplyUrl" type="url" inputMode="url" autoComplete="url" defaultValue={opportunity?.officialApplyUrl} required disabled={!enabled || pending} placeholder="https://careers.perusahaan.com/jobs/…" />
      </Field>
      <div className="form-grid form-grid--2">
        <Field label="Kelompok program" id={`${prefix}-program`} help="Memudahkan filter fresh graduate.">
          <select className="input" id={`${prefix}-program`} name="programType" defaultValue={opportunity?.programType ?? "entry_level"} disabled={!enabled || pending}>
            {Object.entries(jobProgramLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Status" id={`${prefix}-status`} help="Tahap peninjauan sebelum menjadi lamaran.">
          <select className="input" id={`${prefix}-status`} name="status" defaultValue={opportunity?.status ?? "saved"} disabled={!enabled || pending}>
            {Object.entries(jobOpportunityStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Deadline" id={`${prefix}-deadline`} help="Kosongkan bila belum diketahui.">
          <input className="input mono" id={`${prefix}-deadline`} name="deadlineAt" type="date" defaultValue={opportunity?.deadlineAt ?? ""} disabled={!enabled || pending} />
        </Field>
        <Field label="Jenis deadline" id={`${prefix}-deadline-kind`} help="Tandai rolling jika tidak ada tanggal tutup tetap.">
          <select className="input" id={`${prefix}-deadline-kind`} name="deadlineKind" defaultValue={opportunity?.deadlineKind ?? "unknown"} disabled={!enabled || pending}>
            {Object.entries(deadlineKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
      </div>

      <details className="form-disclosure" open={editing}>
        <summary>Detail tambahan</summary>
        <div className="form-grid form-disclosure__body">
          <div className="form-grid form-grid--2">
            <Field label="Lokasi" id={`${prefix}-location`} help="Kota, negara, atau cakupan wilayah.">
              <input className="input" id={`${prefix}-location`} name="location" defaultValue={opportunity?.location ?? ""} maxLength={160} disabled={!enabled || pending} placeholder="Jakarta" />
            </Field>
            <Field label="Mode kerja" id={`${prefix}-work-mode`} help="Opsional">
              <select className="input" id={`${prefix}-work-mode`} name="workMode" defaultValue={opportunity?.workMode ?? ""} disabled={!enabled || pending}><option value="">Belum diketahui</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select>
            </Field>
            <Field label="Jenis pekerjaan" id={`${prefix}-employment`} help="Terpisah dari kelompok program.">
              <select className="input" id={`${prefix}-employment`} name="employmentType" defaultValue={opportunity?.employmentType ?? ""} disabled={!enabled || pending}><option value="">Belum diketahui</option>{Object.entries(employmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </Field>
            <Field label="Pengalaman maksimum" id={`${prefix}-experience`} help="Tahun; kosongkan bila tidak disebutkan.">
              <input className="input mono" id={`${prefix}-experience`} name="experienceMaxYears" type="number" min={0} max={10} defaultValue={opportunity?.experienceMaxYears ?? ""} disabled={!enabled || pending} placeholder="0" />
            </Field>
            <Field label="Tanggal publikasi" id={`${prefix}-published`} help="Opsional">
              <input className="input mono" id={`${prefix}-published`} name="publishedAt" type="date" defaultValue={opportunity?.publishedAt ?? ""} disabled={!enabled || pending} />
            </Field>
            <Field label="Pendidikan" id={`${prefix}-education`} help="Jurusan atau jenjang yang disebutkan.">
              <input className="input" id={`${prefix}-education`} name="education" defaultValue={opportunity?.education ?? ""} maxLength={240} disabled={!enabled || pending} placeholder="S1 semua jurusan" />
            </Field>
            <Field label="Nama sumber" id={`${prefix}-source-name`} help="Contoh: halaman karier perusahaan.">
              <input className="input" id={`${prefix}-source-name`} name="sourceName" defaultValue={opportunity?.sourceName ?? ""} maxLength={120} disabled={!enabled || pending} />
            </Field>
            <Field label="URL sumber" id={`${prefix}-source-url`} help="Jika berbeda dari laman melamar.">
              <input className="input" id={`${prefix}-source-url`} name="sourceUrl" type="url" inputMode="url" defaultValue={opportunity?.sourceUrl ?? ""} disabled={!enabled || pending} placeholder="https://…" />
            </Field>
          </div>
          <Field label="Persyaratan penting" id={`${prefix}-requirements`} help="Ringkas syarat yang menentukan kecocokan.">
            <textarea className="input" id={`${prefix}-requirements`} name="requirements" defaultValue={opportunity?.requirements ?? ""} maxLength={5000} disabled={!enabled || pending} />
          </Field>
          <Field label="Catatan pribadi" id={`${prefix}-notes`} help="Alasan tertarik, kontak, atau bahan persiapan.">
            <textarea className="input" id={`${prefix}-notes`} name="notes" defaultValue={opportunity?.notes ?? ""} maxLength={5000} disabled={!enabled || pending} />
          </Field>
        </div>
      </details>

      <div className="check-stack">
        <label className="check-row"><input type="checkbox" name="isFreshGraduate" defaultChecked={opportunity?.isFreshGraduate ?? true} disabled={!enabled || pending} />Cocok untuk fresh graduate</label>
        <label className="check-row"><input type="checkbox" name="verifiedNow" defaultChecked={!editing} disabled={!enabled || pending} />Saya baru memeriksa link ini</label>
      </div>
      <div className="page-actions">
        <button className="button button--primary" type="submit" disabled={!enabled || pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>{pending ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan lowongan"}</button>
      </div>
      <p className="form-status" data-state={state.status} role="status" aria-live="polite">{enabled ? state.message : "Konfigurasikan Supabase untuk menyimpan."}</p>
    </form>
  );
}

function Field({ label, id, help, children }: { label: string; id: string; help: string; children: React.ReactNode }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}<span className="field-help">{help}</span></div>;
}
