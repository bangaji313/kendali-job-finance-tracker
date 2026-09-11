import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/ui";
import { AcceptedIncomeForm } from "@/components/quick-forms";
import { DocumentUploader } from "@/components/document-uploader";
import { ReminderForm, StageControl } from "@/components/application-controls";
import { ApplicationEditForm } from "@/components/application-edit-form";
import { archiveApplication } from "@/app/actions";
import { employmentLabels, stageLabels } from "@/lib/domain/types";
import { getWorkspaceData } from "@/lib/data/workspace";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWorkspaceData();
  const item = data.applications.find((application) => application.id === id);
  if (!item) notFound();
  const activities = data.activities.filter((activity) => activity.applicationId === item.id);
  return <><PageHeader eyebrow="Detail lamaran" title={item.position} description={item.company} actions={<Link className="button" href="/lamaran"><ArrowLeft size={16} />Kembali</Link>} /><section className="section"><SectionHeader title="Status" description="Tahap dan jenis pekerjaan adalah dua dimensi terpisah." /><SummaryStripLocal items={[{ label: "Tahap", value: stageLabels[item.stage] }, { label: "Jenis", value: employmentLabels[item.employmentType] }, { label: "Tanggal", value: item.appliedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.appliedAt)) : "—" }, { label: "Next action", value: item.nextAction ?? "—" }]} /><StageControl applicationId={item.id} currentStage={item.stage} />{item.stage === "accepted" ? <aside className="notice"><div className="notice__body"><strong>Tawaran diterima</strong><span>Hubungkan ke aturan pemasukan secara opt-in. Tidak ada saldo yang berubah otomatis.</span><AcceptedIncomeForm applicationId={item.id} accounts={data.accounts.map((account) => ({ id: account.id, name: account.name }))} /></div></aside> : null}</section><section className="section"><SectionHeader title="Detail" description="Lengkapi konteks yang membantu keputusan dan tindak lanjut." /><ApplicationEditForm application={item} /></section><section className="section"><SectionHeader title="Aktivitas" description="Setiap perpindahan tahap tercatat otomatis." />{activities.length ? <ul className="queue">{activities.map((activity) => <li className="queue-item" key={activity.id}><span className="queue-dot" /><div className="queue-item__body"><strong>{activity.kind === "stage_changed" ? `${activity.fromStage ?? "—"} → ${activity.toStage ?? "—"}` : "Lamaran dibuat"}</strong><span className="queue-item__meta">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(activity.createdAt))}</span></div></li>)}</ul> : <p className="muted">Belum ada aktivitas tambahan.</p>}</section><section className="section"><SectionHeader title="Dokumen" /><DocumentUploader applicationId={item.id} enabled={data.configured && data.signedIn} /></section><section className="section"><SectionHeader title="Reminder" description="Reminder muncul di Hari Ini dan dapat dikirim sebagai push setelah opt-in." /><ReminderForm applicationId={item.id} /></section><section className="section section--compact"><div className="danger-row"><span><strong>Arsipkan lamaran</strong><br /><span className="muted">Data dapat dipulihkan langsung dari daftar lamaran.</span></span><form action={archiveApplication}><input type="hidden" name="applicationId" value={item.id} /><button className="button button--quiet" type="submit">Arsipkan</button></form></div></section></>;
}

function SummaryStripLocal({ items }: { items: Array<{ label: string; value: string }> }) {
  return <div className="summary-strip">{items.map((entry) => <div className="summary-item" key={entry.label}><span className="summary-label">{entry.label}</span><span className="summary-value">{entry.value}</span></div>)}</div>;
}
