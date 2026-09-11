import Link from "next/link";
import { ListFilter, Plus } from "lucide-react";
import { ApplicationQuickForm } from "@/components/quick-forms";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { employmentLabels, stageLabels, type ApplicationStage } from "@/lib/domain/types";
import { getWorkspaceData } from "@/lib/data/workspace";
import { restoreApplication } from "@/app/actions";

export const metadata = { title: "Lamaran" };
const pipeline: ApplicationStage[] = ["saved", "applied", "screening", "assessment", "interview", "offer", "accepted"];

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string; type?: string; archived?: string; restored?: string }> }) {
  const query = await searchParams;
  const data = await getWorkspaceData();
  const enabled = data.configured && data.signedIn;
  const selectedStage = applicationStagesInclude(query.stage) ? query.stage : null;
  const visibleApplications = data.applications.filter((item) => {
    const text = `${item.company} ${item.position}`.toLocaleLowerCase("id-ID");
    return (!selectedStage || item.stage === selectedStage) && (!query.type || item.employmentType === query.type) && (!query.q || text.includes(query.q.toLocaleLowerCase("id-ID")));
  });
  return (
    <>
      <PageHeader eyebrow="Job tracker" title="Lamaran" description="Pisahkan tahap proses dari jenis pekerjaan, lalu pastikan setiap lamaran aktif memiliki tindakan berikutnya." actions={<a href="#tambah" className="button button--primary"><Plus size={16} />Tambah lamaran</a>} />
      {query.archived ? <aside className="notice"><div className="notice__body"><strong>Lamaran diarsipkan</strong><span>Lamaran tidak lagi muncul di pipeline.</span></div><form action={restoreApplication}><input type="hidden" name="applicationId" value={query.archived} /><button className="button" type="submit">Urungkan</button></form></aside> : null}
      {query.restored ? <aside className="notice"><div className="notice__body"><strong>Lamaran dipulihkan</strong><span>Lamaran kembali muncul di daftar.</span></div></aside> : null}
      {!data.configured ? <section className="section"><PreviewNotice /></section> : null}
      <section className="section" id="daftar">
        <SectionHeader title="Daftar lamaran" description="Filter tahap, jenis pekerjaan, perusahaan, atau posisi." />
        <form className="form-grid form-grid--2" method="get"><div className="field"><label htmlFor="q">Cari</label><input className="input" id="q" name="q" defaultValue={query.q} placeholder="Perusahaan atau posisi" /><span className="field-help">Pencarian tidak peka kapital.</span></div><div className="field"><label htmlFor="type">Jenis pekerjaan</label><select className="input" id="type" name="type" defaultValue={query.type ?? ""}><option value="">Semua jenis</option>{Object.entries(employmentLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><span className="field-help">Tahap dipilih di baris berikutnya.</span></div><input type="hidden" name="stage" value={selectedStage ?? ""} /><div><button className="button" type="submit"><ListFilter size={16} />Terapkan filter</button></div></form>
        <div className="filters" role="group" aria-label="Filter tahap"><Link className="filter-chip" aria-pressed={!selectedStage} href="/lamaran">Semua</Link>{pipeline.map((stage) => <Link className="filter-chip" aria-pressed={selectedStage === stage} href={`/lamaran?stage=${stage}`} key={stage}>{stageLabels[stage]}</Link>)}</div>
        <SummaryStrip items={[{ label: "Aktif", value: data.applications.length ? String(data.applications.filter((item) => !["accepted", "rejected", "withdrawn", "archived"].includes(item.stage)).length) : "—" }, { label: "Interview", value: data.applications.length ? String(data.applications.filter((item) => item.stage === "interview").length) : "—" }, { label: "Tawaran", value: data.applications.length ? String(data.applications.filter((item) => item.stage === "offer").length) : "—" }, { label: "Diterima", value: data.applications.length ? String(data.applications.filter((item) => item.stage === "accepted").length) : "—" }]} />
        {visibleApplications.length === 0 ? <EmptyState title={data.applications.length ? "Tidak ada hasil filter" : "Belum ada lamaran"} description={data.applications.length ? "Ubah tahap, jenis pekerjaan, atau kata pencarian." : "Mulai dengan empat field; detail recruiter, kompensasi, dan reminder dapat ditambahkan setelahnya."} actionHref={data.applications.length ? "/lamaran" : "#tambah"} actionLabel={data.applications.length ? "Hapus filter" : "Tambah lamaran"} /> : (
          <table className="data-table"><thead><tr><th>Perusahaan / posisi</th><th>Tahap</th><th>Jenis</th><th>Tindakan berikutnya</th><th>Tanggal</th></tr></thead><tbody>{visibleApplications.map((item) => <tr key={item.id}><td data-label="Lamaran"><Link href={`/lamaran/${item.id}`} className="table-primary">{item.company}</Link><div className="table-secondary">{item.position}</div></td><td data-label="Tahap"><span className="status status--active">{stageLabels[item.stage]}</span></td><td data-label="Jenis">{employmentLabels[item.employmentType]}</td><td data-label="Tindakan">{item.nextAction ?? "—"}</td><td data-label="Tanggal" className="mono">{item.appliedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.appliedAt)) : "—"}</td></tr>)}</tbody></table>
        )}
      </section>
      <section className="section">
        <SectionHeader title="Board pipeline" description="Tahap terminal tetap terlihat, tetapi tidak bercampur dengan proses aktif." />
        <div className="board">{pipeline.map((stage) => { const items = data.applications.filter((item) => item.stage === stage); return <div className="board-column" key={stage}><div className="board-title"><span>{stageLabels[stage]}</span><span>{items.length}</span></div>{items.map((item) => <Link href={`/lamaran/${item.id}`} className="board-item" key={item.id}><strong>{item.position}</strong><span className="muted">{item.company}</span></Link>)}</div>; })}</div>
      </section>
      <section className="section" id="tambah"><SectionHeader title="Tambah lamaran" description="Field minimum dahulu. Detail dapat dilengkapi dari halaman lamaran." /><ApplicationQuickForm enabled={enabled} /></section>
    </>
  );
}

function applicationStagesInclude(value: string | undefined): value is ApplicationStage {
  return Boolean(value && pipeline.includes(value as ApplicationStage));
}
