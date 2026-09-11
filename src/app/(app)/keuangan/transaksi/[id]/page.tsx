import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { archiveTransaction } from "@/app/actions";
import { TransactionEditForm } from "@/components/transaction-edit-form";
import { PageHeader, SectionHeader } from "@/components/ui";
import { getWorkspaceData } from "@/lib/data/workspace";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWorkspaceData();
  const transaction = data.transactions.find((item) => item.id === id);
  if (!transaction) notFound();
  const categoryKind = transaction.kind === "income" ? "income" : "expense";
  return <><PageHeader eyebrow="Detail transaksi" title={transaction.description} description="Perubahan pada transaksi posted langsung memengaruhi saldo dan laporan." actions={<Link className="button" href="/keuangan/transaksi"><ArrowLeft size={16} />Kembali</Link>} /><section className="section"><SectionHeader title="Edit transaksi" description="Gunakan Draft bila transaksi belum terkonfirmasi; Void mempertahankan jejak audit tanpa memengaruhi saldo." /><TransactionEditForm transaction={transaction} accounts={data.accounts.map(({ id: accountId, name }) => ({ id: accountId, name }))} categories={data.categories.filter((item) => item.kind === categoryKind).map(({ id: categoryId, name }) => ({ id: categoryId, name }))} /></section><section className="section section--compact"><div className="danger-row"><span><strong>Arsipkan transaksi</strong><br /><span className="muted">Transaksi hilang dari buku dan tidak memengaruhi saldo.</span></span><form action={archiveTransaction}><input type="hidden" name="transactionId" value={transaction.id} /><button className="button button--quiet" type="submit">Arsipkan</button></form></div></section></>;
}
