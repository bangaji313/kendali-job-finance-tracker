import { Plus, Target } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader } from "@/components/ui";
import { formatIdr } from "@/lib/domain/money";
import { getWorkspaceData } from "@/lib/data/workspace";
import { GoalContributionForm, GoalForm } from "@/components/finance-forms";
import { archiveSavingsGoal } from "@/app/actions";

export const metadata = { title: "Target tabungan" };

export default async function GoalsPage() {
  const data = await getWorkspaceData();
  return <><PageHeader eyebrow="Keuangan" title="Target tabungan" description="Pantau kontribusi menuju nominal dan tanggal sasaran." actions={<a className="button button--primary" href="#tambah"><Plus size={16} />Buat target</a>} />{!data.configured ? <section className="section"><PreviewNotice /></section> : null}<section className="section"><SectionHeader title="Target aktif" description="Kontribusi manual tidak mengubah saldo akun; catat transfer terpisah bila uang benar-benar dipindahkan." />{data.goals.length === 0 ? <EmptyState title="Belum ada target" description="Tentukan satu tujuan, nominal, dan tanggal agar progres dapat diukur." /> : data.goals.map((goal) => { const percent = goal.targetMinor > 0n ? Number((goal.savedMinor * 100n) / goal.targetMinor) : 0; return <article className="goal-block" key={goal.id}><div className="progress-row"><span><Target size={16} /> <strong>{goal.name}</strong></span><div className="progress-track" aria-label={`${percent}% tercapai`}><div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} /></div><span className="mono">{formatIdr(goal.savedMinor)} / {formatIdr(goal.targetMinor)}</span></div><GoalContributionForm goalId={goal.id} /><form action={archiveSavingsGoal} className="goal-archive"><input type="hidden" name="goalId" value={goal.id} /><button className="button button--quiet" type="submit">Arsipkan target</button></form></article>; })}</section><section className="section" id="tambah"><SectionHeader title="Buat target" description="Kontribusi dapat ditambahkan segera setelah target dibuat." /><GoalForm enabled={data.configured && data.signedIn} /></section></>;
}
