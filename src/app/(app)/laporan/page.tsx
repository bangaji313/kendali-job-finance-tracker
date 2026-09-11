import { Download } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { formatIdr } from "@/lib/domain/money";
import { applicationStages, stageLabels } from "@/lib/domain/types";
import { getWorkspaceData } from "@/lib/data/workspace";

export const metadata = { title: "Laporan" };

export default async function ReportsPage() {
  const data = await getWorkspaceData();
  const posted = data.transactions.filter((item) => item.state === "posted");
  const income = posted.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amountMinor, 0n);
  const expense = posted.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amountMinor, 0n);
  return <><PageHeader eyebrow="Analisis" title="Laporan" description="Pipeline kerja dan arus kas dalam tampilan visual yang selalu memiliki tabel pendamping." actions={<a className="button" href="/api/export?scope=all&format=json"><Download size={16} />Ekspor JSON</a>} />{!data.configured ? <section className="section"><PreviewNotice /></section> : null}<section className="section"><SectionHeader title="Ringkasan arus kas" description="Transaksi posted dalam mata uang IDR." /><SummaryStrip items={[{ label: "Pemasukan", value: posted.length ? formatIdr(income) : "—" }, { label: "Pengeluaran", value: posted.length ? formatIdr(expense) : "—" }, { label: "Bersih", value: posted.length ? formatIdr(income - expense) : "—" }, { label: "Transaksi", value: posted.length ? String(posted.length) : "—" }]} /></section><section className="section"><SectionHeader title="Distribusi pipeline" description="Lebar bar menunjukkan jumlah lamaran per tahap; tabel berikut memuat nilai yang sama." />{data.applications.length === 0 ? <EmptyState title="Belum ada data untuk dianalisis" description="Setelah lamaran atau transaksi dicatat, laporan akan terbentuk dari data nyata." actionHref="/lamaran#tambah" actionLabel="Catat lamaran" /> : <><div>{applicationStages.map((stage) => { const count = data.applications.filter((item) => item.stage === stage).length; const percent = (count / data.applications.length) * 100; return <div className="progress-row" key={stage}><span>{stageLabels[stage]}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div><span className="mono">{count}</span></div>; })}</div><table className="data-table"><thead><tr><th>Tahap</th><th>Jumlah</th></tr></thead><tbody>{applicationStages.map((stage) => <tr key={stage}><td data-label="Tahap">{stageLabels[stage]}</td><td data-label="Jumlah" className="mono">{data.applications.filter((item) => item.stage === stage).length}</td></tr>)}</tbody></table></>}</section></>;
}
