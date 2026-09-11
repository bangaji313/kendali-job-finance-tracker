"use client";

import { useActionState, useState } from "react";
import { createApplication, createIncomeRuleFromApplication, createTransaction, type ActionState } from "@/app/actions";
import type { AccountSummary, TransactionKind } from "@/lib/domain/types";

const initial: ActionState = { status: "idle", message: "" };

function SubmitButton({ label, pending, disabled }: { label: string; pending: boolean; disabled: boolean }) {
  return <button className="button button--primary" type="submit" disabled={disabled || pending} data-state={pending ? "loading" : undefined}>{pending ? "Menyimpan" : label}</button>;
}

export function ApplicationQuickForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(createApplication, initial);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="form-grid" id="tambah">
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="companyName">Perusahaan</label><input className="input" id="companyName" name="companyName" required disabled={!enabled} placeholder="Nama perusahaan" /><span className="field-help">Wajib</span></div>
        <div className="field"><label htmlFor="position">Posisi</label><input className="input" id="position" name="position" required disabled={!enabled} placeholder="Contoh: Frontend Engineer" /><span className="field-help">Wajib</span></div>
        <div className="field"><label htmlFor="stage">Tahap</label><select className="input" id="stage" name="stage" defaultValue="applied" disabled={!enabled}><option value="saved">Tersimpan</option><option value="applied">Dilamar</option><option value="screening">Screening</option><option value="assessment">Assessment</option><option value="interview">Interview</option><option value="offer">Tawaran</option></select><span className="field-help">Tahap saat ini</span></div>
        <div className="field"><label htmlFor="employmentType">Jenis pekerjaan</label><select className="input" id="employmentType" name="employmentType" defaultValue="permanent" disabled={!enabled}><option value="internship">Internship</option><option value="contract">Kontrak</option><option value="permanent">Tetap</option><option value="part_time">Paruh waktu</option><option value="freelance">Freelance</option><option value="temporary">Temporer</option><option value="other">Lainnya</option></select><span className="field-help">Terpisah dari tahap</span></div>
      </div>
      <div className="field"><label htmlFor="appliedAt">Tanggal</label><input className="input" id="appliedAt" name="appliedAt" type="date" defaultValue={today} disabled={!enabled} /><span className="field-help">Tanggal simpan atau melamar</span></div>
      <div className="page-actions"><SubmitButton label="Simpan lamaran" pending={pending} disabled={!enabled} /></div>
      <p className="form-status" data-state={state.status} role="status">{enabled ? state.message : "Konfigurasikan Supabase untuk menyimpan."}</p>
    </form>
  );
}

export function TransactionQuickForm({ enabled, accounts, categories = [] }: { enabled: boolean; accounts: Array<Pick<AccountSummary, "id" | "name">>; categories?: Array<{ id: string; name: string; kind: "income" | "expense" }> }) {
  const [state, action, pending] = useActionState(createTransaction, initial);
  const [kind, setKind] = useState<TransactionKind>("expense");
  const today = new Date().toISOString().slice(0, 10);
  const canSubmit = enabled && accounts.length > 0;
  return (
    <form action={action} className="form-grid" id="tambah">
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="kind">Jenis</label><select className="input" id="kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value as TransactionKind)} disabled={!enabled || pending}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option><option value="transfer">Transfer</option></select><span className="field-help">Field akun menyesuaikan jenis transaksi.</span></div>
        <div className="field"><label htmlFor="amount">Nominal</label><input className="input mono" id="amount" name="amount" inputMode="decimal" required disabled={!enabled} placeholder="0.00" /><span className="field-help">IDR, maksimal dua desimal</span></div>
        <div className="field"><label htmlFor="description">Keterangan</label><input className="input" id="description" name="description" required disabled={!enabled} placeholder="Keperluan transaksi" /><span className="field-help">Wajib</span></div>
        <div className="field"><label htmlFor="occurredAt">Tanggal</label><input className="input" id="occurredAt" name="occurredAt" type="date" defaultValue={today} disabled={!enabled} /><span className="field-help">Tanggal transaksi</span></div>
        {kind !== "income" ? <div className="field"><label htmlFor="sourceAccountId">Akun sumber</label><select className="input" id="sourceAccountId" name="sourceAccountId" required disabled={!enabled || pending} defaultValue=""><option value="" disabled>Pilih akun</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><span className="field-help">Dana keluar dari akun ini.</span></div> : null}
        {kind !== "expense" ? <div className="field"><label htmlFor="destinationAccountId">Akun tujuan</label><select className="input" id="destinationAccountId" name="destinationAccountId" required disabled={!enabled || pending} defaultValue=""><option value="" disabled>Pilih akun</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><span className="field-help">Dana masuk ke akun ini.</span></div> : null}
        {kind !== "transfer" ? <div className="field"><label htmlFor="categoryId">Kategori</label><select className="input" id="categoryId" name="categoryId" disabled={!enabled || pending} defaultValue=""><option value="">Tanpa kategori</option>{categories.filter((category) => category.kind === kind).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><span className="field-help">Dipakai dalam anggaran dan laporan.</span></div> : null}
      </div>
      <input type="hidden" name="state" value="posted" />
      <div className="page-actions"><SubmitButton label="Simpan transaksi" pending={pending} disabled={!canSubmit} /></div>
      <p className="form-status" data-state={state.status} role="status">{canSubmit ? state.message : enabled ? "Buat minimal satu akun sebelum mencatat transaksi." : "Konfigurasikan Supabase untuk menyimpan."}</p>
    </form>
  );
}

export function AcceptedIncomeForm({ applicationId, accounts }: { applicationId: string; accounts: Array<Pick<AccountSummary, "id" | "name">> }) {
  const [state, action, pending] = useActionState(createIncomeRuleFromApplication, initial);
  const today = new Date().toISOString().slice(0, 10);
  return <form action={action} className="form-grid"><input type="hidden" name="applicationId" value={applicationId} /><div className="form-grid form-grid--2"><div className="field"><label htmlFor="accepted-account">Akun tujuan</label><select className="input" id="accepted-account" name="destinationAccountId" required defaultValue=""><option value="" disabled>Pilih akun</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><span className="field-help">Pemasukan masuk ke akun ini setelah draft dikonfirmasi.</span></div><div className="field"><label htmlFor="accepted-amount">Nominal per periode</label><input className="input mono" id="accepted-amount" name="amount" inputMode="decimal" required placeholder="0.00" /><span className="field-help">IDR</span></div><div className="field"><label htmlFor="accepted-frequency">Frekuensi</label><select className="input" id="accepted-frequency" name="frequency" defaultValue="monthly"><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select><span className="field-help">Setiap occurrence menjadi draft.</span></div><div className="field"><label htmlFor="accepted-start">Mulai</label><input className="input" id="accepted-start" name="startsOn" type="date" defaultValue={today} required /><span className="field-help">Tanggal occurrence pertama</span></div></div><div><SubmitButton label="Buat aturan pemasukan" pending={pending} disabled={accounts.length === 0} /></div><p className="form-status" data-state={state.status} role="status">{accounts.length ? state.message : "Buat akun tujuan terlebih dahulu."}</p></form>;
}
