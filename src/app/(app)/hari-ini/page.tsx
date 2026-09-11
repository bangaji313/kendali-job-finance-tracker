import Link from "next/link";
import { BriefcaseBusiness, Plus, SearchCheck, WalletCards } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { formatIdr } from "@/lib/domain/money";
import { getWorkspaceData } from "@/lib/data/workspace";
import { getOpportunityData } from "@/lib/data/opportunities";

export const metadata = { title: "Hari Ini" };

export default async function TodayPage() {
  const [data, opportunityData] = await Promise.all([getWorkspaceData(), getOpportunityData()]);
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dateLabel = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const posted = data.transactions.filter((item) => item.state === "posted");
  const income = posted.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amountMinor, 0n);
  const expense = posted.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amountMinor, 0n);
  const balance = data.accounts.reduce((sum, account) => sum + account.balanceMinor, 0n);
  const actionQueue = [
    ...data.reminders.map((item) => ({ id: `reminder-${item.id}`, title: item.title, dueAt: item.dueAt, href: "/notifikasi", kind: "Reminder" })),
    ...opportunityData.opportunities.filter((item) => item.deadlineAt && new Date(item.deadlineAt) <= nextWeek && !["applied", "dismissed", "expired"].includes(item.status)).map((item) => ({ id: `opportunity-${item.id}`, title: `${item.companyName} — ${item.title}`, dueAt: `${item.deadlineAt}T23:59:00+07:00`, href: `/lowongan/${item.id}`, kind: "Deadline lowongan" })),
    ...opportunityData.milestones.filter((item) => item.dueAt && !item.completedAt && new Date(item.dueAt) <= nextWeek).map((item) => ({ id: `milestone-${item.id}`, title: item.title, dueAt: item.dueAt as string, href: `/lowongan/${item.opportunityId}`, kind: "Timeline lowongan" })),
  ].toSorted((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 12);

  return (
    <>
      <PageHeader eyebrow={dateLabel} title={`Selamat datang, ${data.displayName}.`} description="Mulai dari yang perlu ditindaklanjuti, lalu lihat posisi keuangan bulan ini." actions={<><Link className="button" href="/lowongan#tambah"><SearchCheck size={16} />Lowongan</Link><Link className="button button--primary" href="/keuangan/transaksi#tambah"><WalletCards size={16} />Transaksi</Link></>} />
      {!data.configured ? <section className="section"><PreviewNotice /></section> : null}
      <section className="section">
        <SectionHeader title="Antrean tindakan" description="Terlambat berada di atas, lalu hari ini dan tujuh hari mendatang." />
        {actionQueue.length === 0 ? <EmptyState title="Tidak ada tindakan terjadwal" description="Tambahkan deadline lowongan, milestone, atau reminder agar tindak lanjut muncul di sini." actionHref="/lowongan#tambah" actionLabel="Catat lowongan" /> : (
          <ul className="queue">{actionQueue.map((item) => { const overdue = new Date(item.dueAt) < now; return <li className="queue-item" key={item.id}><span className={`queue-dot${overdue ? " queue-dot--overdue" : ""}`} /><div className="queue-item__body"><Link href={item.href}><strong>{item.title}</strong></Link><span className="queue-item__meta">{item.kind} · {overdue ? "Terlambat · " : ""}{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.dueAt))}</span></div></li>; })}</ul>
        )}
      </section>
      <section className="section">
        <SectionHeader title="Keuangan bulan berjalan" description="Hanya transaksi posted yang masuk ke perhitungan." action={<Link className="button button--quiet" href="/laporan">Buka laporan</Link>} />
        <SummaryStrip items={[
          { label: "Saldo total", value: data.accounts.length ? formatIdr(balance) : "—" },
          { label: "Pemasukan", value: posted.length ? formatIdr(income) : "—" },
          { label: "Pengeluaran", value: posted.length ? formatIdr(expense) : "—" },
          { label: "Arus kas bersih", value: posted.length ? formatIdr(income - expense) : "—" },
          { label: "Anggaran berisiko", value: data.budgets.length ? String(data.budgets.filter((budget) => budget.spentMinor * 100n >= budget.limitMinor * 80n).length) : "—" },
        ]} />
      </section>
      <section className="section">
        <SectionHeader title="Pipeline lamaran" description="Tahap aktif, tersusun sebagai baris agar perubahan mudah dipindai." action={<Link className="button button--quiet" href="/lamaran">Kelola pipeline</Link>} />
        {data.applications.length === 0 ? <EmptyState title="Pipeline masih kosong" description="Catat perusahaan dan posisi pertama. Empat field cukup untuk memulai." actionHref="/lamaran#tambah" actionLabel="Tambah lamaran" /> : (
          <div className="summary-strip">{["applied", "screening", "assessment", "interview", "offer"].map((stage) => <div className="summary-item" key={stage}><span className="summary-label">{stage}</span><span className="summary-value">{data.applications.filter((item) => item.stage === stage).length}</span></div>)}</div>
        )}
      </section>
      <section className="section">
        <SectionHeader title="Tangkap cepat" description="Dua jalur pencatatan, tanpa meninggalkan konteks hari ini." />
        <div className="quick-grid"><div className="quick-panel"><SearchCheck size={22} /><h3>Lowongan internet</h3><p className="muted">Link resmi, deadline, dan status review.</p><Link className="button" href="/lowongan#tambah"><Plus size={16} />Catat lowongan</Link></div><div className="quick-panel"><BriefcaseBusiness size={22} /><h3>Lamaran baru</h3><p className="muted">Perusahaan, posisi, tahap, dan tanggal.</p><Link className="button" href="/lamaran#tambah"><Plus size={16} />Catat lamaran</Link></div><div className="quick-panel"><WalletCards size={22} /><h3>Transaksi baru</h3><p className="muted">Income, expense, atau transfer.</p><Link className="button" href="/keuangan/transaksi#tambah"><Plus size={16} />Catat transaksi</Link></div></div>
      </section>
    </>
  );
}
