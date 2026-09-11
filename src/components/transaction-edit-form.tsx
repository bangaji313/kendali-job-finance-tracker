"use client";

import { useActionState, useState } from "react";
import { updateTransaction, type ActionState } from "@/app/actions";
import type { TransactionKind, TransactionSummary } from "@/lib/domain/types";

const initial: ActionState = { status: "idle", message: "" };

type Option = { id: string; name: string };

export function TransactionEditForm({ transaction, accounts, categories }: { transaction: TransactionSummary; accounts: Option[]; categories: Option[] }) {
  const [kind, setKind] = useState<TransactionKind>(transaction.kind);
  const [state, action, pending] = useActionState(updateTransaction, initial);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="transactionId" value={transaction.id} />
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="transaction-edit-kind">Jenis</label><select className="input" id="transaction-edit-kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value as TransactionKind)} disabled={pending}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option><option value="transfer">Transfer</option></select></div>
        <div className="field"><label htmlFor="transaction-edit-state">Status</label><select className="input" id="transaction-edit-state" name="state" defaultValue={transaction.state} disabled={pending}><option value="draft">Draft</option><option value="posted">Posted</option><option value="void">Void</option></select></div>
        <div className="field"><label htmlFor="transaction-edit-amount">Nominal</label><input className="input mono" id="transaction-edit-amount" name="amount" inputMode="decimal" required defaultValue={transaction.amount} disabled={pending} /></div>
        <div className="field"><label htmlFor="transaction-edit-date">Tanggal</label><input className="input" id="transaction-edit-date" name="occurredAt" type="date" required defaultValue={transaction.occurredAt} disabled={pending} /></div>
        <div className="field"><label htmlFor="transaction-edit-description">Keterangan</label><input className="input" id="transaction-edit-description" name="description" required defaultValue={transaction.description} disabled={pending} /></div>
        {kind !== "income" ? <div className="field"><label htmlFor="transaction-edit-source">Akun sumber</label><select className="input" id="transaction-edit-source" name="sourceAccountId" required defaultValue={transaction.sourceAccountId ?? ""} disabled={pending}><option value="" disabled>Pilih akun</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
        {kind !== "expense" ? <div className="field"><label htmlFor="transaction-edit-destination">Akun tujuan</label><select className="input" id="transaction-edit-destination" name="destinationAccountId" required defaultValue={transaction.destinationAccountId ?? ""} disabled={pending}><option value="" disabled>Pilih akun</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
        {kind !== "transfer" ? <div className="field"><label htmlFor="transaction-edit-category">Kategori</label><select className="input" id="transaction-edit-category" name="categoryId" defaultValue={transaction.categoryId ?? ""} disabled={pending}><option value="">Tanpa kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
      </div>
      <div className="page-actions"><button className="button button--primary" type="submit" disabled={pending} data-state={pending ? "loading" : state.status === "idle" ? undefined : state.status}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button></div>
      <p className="form-status" data-state={state.status} role="status">{state.message}</p>
    </form>
  );
}
