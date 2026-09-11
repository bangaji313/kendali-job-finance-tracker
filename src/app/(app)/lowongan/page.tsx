import Link from "next/link";
import { Download, ExternalLink, ListFilter, Plus, Search } from "lucide-react";
import { OpportunityForm } from "@/components/opportunity-form";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { restoreOpportunity } from "@/app/(app)/lowongan/actions";
import { getOpportunityData } from "@/lib/data/opportunities";
import { jobOpportunityStatusLabels, jobProgramLabels, type JobOpportunityStatus, type JobProgramType } from "@/lib/domain/types";

export const metadata = { title: "Lowongan" };

type Query = { q?: string; status?: string; program?: string; deadline?: string; archived?: string };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const data = await getOpportunityData();
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const q = query.q?.trim().toLocaleLowerCase("id-ID") ?? "";
  const selectedStatus = isStatus(query.status) ? query.status : null;
  const selectedProgram = isProgram(query.program) ? query.program : null;
  const visible = data.opportunities.filter((item) => {
    const text = `${item.companyName} ${item.title} ${item.location ?? ""}`.toLocaleLowerCase("id-ID");
    const matchesDeadline = query.deadline === "soon" ? Boolean(item.deadlineAt && new Date(item.deadlineAt) >= now && new Date(item.deadlineAt) <= inSevenDays) : query.deadline === "unknown" ? !item.deadlineAt : true;
    return (!q || text.includes(q)) && (!selectedStatus || item.status === selectedStatus) && (!selectedProgram || item.programType === selectedProgram) && matchesDeadline;
  });
  const dueSoon = data.opportunities.filter((item) => item.deadlineAt && new Date(item.deadlineAt) >= now && new Date(item.deadlineAt) <= inSevenDays).length;
  const active = data.opportunities.filter((item) => !["applied", "dismissed", "expired"].includes(item.status)).length;
  const hasData = data.opportunities.length > 0;
  const enabled = data.configured && data.signedIn;

  return (
    <>
      <PageHeader title="Lowongan" description="Simpan peluang fresh graduate dari internet, cek link resmi, lalu pindahkan yang sudah dilamar ke pipeline." actions={<><a className="button" href="/api/export?scope=opportunities&format=csv"><Download size={16} />Ekspor CSV</a><a className="button button--primary" href="#tambah"><Plus size={16} />Tambah lowongan</a></>} />
      {!data.configured ? <section className="section"><PreviewNotice /></section> : null}
      {query.archived ? <section className="section section--compact"><aside className="notice" role="status"><div className="notice__body"><strong>Lowongan diarsipkan</strong><span>Item hilang dari daftar aktif.</span></div><form action={restoreOpportunity}><input type="hidden" name="id" value={query.archived} /><button className="button" type="submit">Urungkan</button></form></aside></section> : null}
      <section className="section">
        <SectionHeader title="Inbox peluang" description="Prioritaskan yang deadline-nya dekat dan link-nya baru diverifikasi." />
        <SummaryStrip items={[{ label: "Aktif", value: hasData ? String(active) : "—" }, { label: "Siap dilamar", value: hasData ? String(data.opportunities.filter((item) => item.status === "ready").length) : "—" }, { label: "≤ 7 hari", value: hasData ? String(dueSoon) : "—" }, { label: "Sudah dilamar", value: hasData ? String(data.opportunities.filter((item) => item.status === "applied").length) : "—" }]} />
        <form className="filter-panel" method="get">
          <div className="field filter-panel__search"><label htmlFor="opportunity-q">Cari lowongan</label><div className="input-with-icon"><Search size={17} aria-hidden="true" /><input className="input" id="opportunity-q" name="q" defaultValue={query.q} placeholder="Perusahaan, posisi, atau lokasi" /></div></div>
          <div className="field"><label htmlFor="opportunity-program">Program</label><select className="input" id="opportunity-program" name="program" defaultValue={selectedProgram ?? ""}><option value="">Semua program</option>{Object.entries(jobProgramLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="field"><label htmlFor="opportunity-status">Status</label><select className="input" id="opportunity-status" name="status" defaultValue={selectedStatus ?? ""}><option value="">Semua status</option>{Object.entries(jobOpportunityStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="field"><label htmlFor="opportunity-deadline">Deadline</label><select className="input" id="opportunity-deadline" name="deadline" defaultValue={query.deadline ?? ""}><option value="">Semua deadline</option><option value="soon">Tujuh hari ke depan</option><option value="unknown">Belum diketahui</option></select></div>
          <button className="button" type="submit"><ListFilter size={16} />Terapkan</button>
        </form>
        {visible.length === 0 ? <EmptyState title={hasData ? "Tidak ada hasil filter" : "Belum ada lowongan"} description={hasData ? "Ubah kata pencarian atau filter untuk melihat peluang lain." : "Simpan link resmi dan deadline peluang pertama agar tidak tercecer di tab browser."} actionHref={hasData ? "/lowongan" : "#tambah"} actionLabel={hasData ? "Hapus filter" : "Tambah lowongan"} /> : (
          <table className="data-table"><thead><tr><th>Perusahaan / posisi</th><th>Program</th><th>Status</th><th>Deadline</th><th>Akses</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td data-label="Lowongan"><Link className="table-primary" href={`/lowongan/${item.id}`}>{item.companyName}</Link><div className="table-secondary">{item.title}{item.location ? ` · ${item.location}` : ""}</div></td><td data-label="Program">{jobProgramLabels[item.programType]}</td><td data-label="Status"><span className={`status${item.status === "ready" ? " status--active" : item.status === "applied" ? " status--success" : " status--muted"}`}>{jobOpportunityStatusLabels[item.status]}</span></td><td data-label="Deadline" className="mono">{formatDeadline(item.deadlineAt, item.deadlineKind)}</td><td data-label="Akses"><a className="text-link" href={item.officialApplyUrl} target="_blank" rel="noreferrer">Laman resmi<ExternalLink size={14} /></a></td></tr>)}</tbody></table>
        )}
      </section>
      <section className="section" id="tambah"><SectionHeader title="Tambah lowongan" description="Mulai dari perusahaan, posisi, link resmi, kelompok, dan deadline. Kualifikasi dapat dilengkapi bila relevan." /><OpportunityForm enabled={enabled} /></section>
    </>
  );
}

function isStatus(value: string | undefined): value is JobOpportunityStatus { return Boolean(value && value in jobOpportunityStatusLabels); }
function isProgram(value: string | undefined): value is JobProgramType { return Boolean(value && value in jobProgramLabels); }
function formatDeadline(value: string | null, kind: string) { if (!value) return kind === "rolling" ? "Rolling" : "—"; return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`)); }
