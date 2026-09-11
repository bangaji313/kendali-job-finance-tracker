import { Plus } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader } from "@/components/ui";
import { budgetUsage, formatIdr } from "@/lib/domain/money";
import { getWorkspaceData } from "@/lib/data/workspace";
import { BudgetForm } from "@/components/finance-forms";
import { deleteBudget } from "@/app/actions";

export const metadata = { title: "Anggaran" };

export default async function BudgetsPage() {
  const data = await getWorkspaceData();
  return <><PageHeader eyebrow="Keuangan" title="Anggaran" description="Batas bulanan per kategori pengeluaran. Draft dan transfer tidak dihitung." actions={<a className="button button--primary" href="#tambah"><Plus size={16} />Buat anggaran</a>} />{!data.configured ? <section className="section"><PreviewNotice /></section> : null}<section className="section"><SectionHeader title="Bulan ini" description="Kategori yang mencapai 80% muncul sebagai perhatian di Hari Ini." />{data.budgets.length === 0 ? <EmptyState title="Belum ada anggaran" description="Pilih satu kategori pengeluaran yang ingin dikendalikan bulan ini." /> : data.budgets.map((budget) => { const usage = budgetUsage(budget.spentMinor, budget.limitMinor); return <div className="progress-row progress-row--action" key={budget.id}><strong>{budget.category}</strong><div className="progress-track" aria-label={`${usage}% terpakai`}><div className="progress-fill" style={{ width: `${Math.min(usage, 100)}%` }} /></div><span className="mono">{formatIdr(budget.spentMinor)} / {formatIdr(budget.limitMinor)}</span><form action={deleteBudget}><input type="hidden" name="budgetId" value={budget.id} /><button className="button button--quiet" type="submit">Hapus</button></form></div>; })}</section><section className="section" id="tambah"><SectionHeader title="Buat atau ubah anggaran" description="Kategori dan bulan yang sama akan diperbarui; gunakan Hapus untuk meniadakan batas." /><BudgetForm enabled={data.configured && data.signedIn} categories={data.categories.filter((category) => category.kind === "expense").map(({ id, name }) => ({ id, name }))} /></section></>;
}
