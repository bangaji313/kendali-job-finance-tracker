import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { archiveOpportunity, toggleOpportunityMilestone } from "@/app/(app)/lowongan/actions";
import { ConvertOpportunityForm, MilestoneForm } from "@/components/opportunity-controls";
import { OpportunityForm } from "@/components/opportunity-form";
import { PageHeader, SectionHeader, SummaryStrip } from "@/components/ui";
import { getOpportunityData } from "@/lib/data/opportunities";
import { deadlineKindLabels, jobOpportunityStatusLabels, jobProgramLabels } from "@/lib/domain/types";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOpportunityData();
  const item = data.opportunities.find((opportunity) => opportunity.id === id);
  if (!item) notFound();
  const milestones = data.milestones.filter((milestone) => milestone.opportunityId === item.id);
  const deadline = item.deadlineAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(`${item.deadlineAt}T12:00:00+07:00`)) : deadlineKindLabels[item.deadlineKind];
  const verified = item.lastVerifiedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.lastVerifiedAt)) : "Belum diverifikasi";

  return (
    <>
      <PageHeader title={item.title} description={item.companyName} actions={<><Link className="button" href="/lowongan"><ArrowLeft size={16} />Kembali</Link><a className="button button--primary" href={item.officialApplyUrl} target="_blank" rel="noreferrer">Lamar resmi<ExternalLink size={16} /></a></>} />
      <section className="section">
        <SectionHeader title="Ringkasan" description="Periksa deadline dan status verifikasi sebelum membuka formulir eksternal." />
        <SummaryStrip items={[{ label: "Status", value: jobOpportunityStatusLabels[item.status] }, { label: "Program", value: jobProgramLabels[item.programType] }, { label: "Deadline", value: deadline }, { label: "Link diperiksa", value: verified }]} />
        <div className="action-band"><div><strong>Sudah mengirim lamaran?</strong><p className="muted">Pindahkan sekali ke pipeline Lamaran; sumber dan next action ikut dicatat.</p></div><ConvertOpportunityForm opportunityId={item.id} applicationId={item.applicationId} /></div>
      </section>
      <section className="section">
        <SectionHeader title="Timeline" description="Tambahkan tes, interview, atau batas persiapan secara manual." />
        {milestones.length > 0 ? <ul className="queue">{milestones.map((milestone) => <li className="queue-item queue-item--action" key={milestone.id}><span className={`queue-dot${milestone.completedAt ? " queue-dot--done" : ""}`} /><div className="queue-item__body"><strong>{milestone.title}</strong><span className="queue-item__meta">{milestone.dueAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(milestone.dueAt)) : "Tanpa jadwal"}{milestone.notes ? ` · ${milestone.notes}` : ""}</span></div><form action={toggleOpportunityMilestone}><input type="hidden" name="id" value={milestone.id} /><input type="hidden" name="opportunityId" value={item.id} /><input type="hidden" name="complete" value={milestone.completedAt ? "false" : "true"} /><button className="button button--quiet" type="submit">{milestone.completedAt ? "Buka lagi" : "Selesai"}</button></form></li>)}</ul> : <p className="muted">Belum ada milestone. Tambahkan hanya tahap yang memiliki tindakan atau tanggal.</p>}
        <MilestoneForm opportunityId={item.id} />
      </section>
      <section className="section"><SectionHeader title="Edit lowongan" description="Perbarui status, kualifikasi, atau tandai link baru saja diverifikasi." /><OpportunityForm enabled={data.configured && data.signedIn} opportunity={item} /></section>
      <section className="section section--compact"><div className="danger-row"><div><strong>Arsipkan lowongan</strong><p className="muted">Menyembunyikan dari daftar aktif. Aksi dapat langsung diurungkan.</p></div><form action={archiveOpportunity}><input type="hidden" name="id" value={item.id} /><button className="button" type="submit">Arsipkan</button></form></div></section>
    </>
  );
}
