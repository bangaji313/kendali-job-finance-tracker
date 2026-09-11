import Link from "next/link";
import { ArrowRight, Landmark, LayoutDashboard, Plus, Target, WalletCards } from "lucide-react";
import { PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { formatIdr } from "@/lib/domain/money";
import { getWorkspaceData } from "@/lib/data/workspace";

export const metadata = { title: "Keuangan" };

const destinations = [
  { href: "/keuangan/transaksi", title: "Transaksi", description: "Pemasukan, pengeluaran, transfer, dan draft rutin.", icon: WalletCards },
  { href: "/keuangan/akun", title: "Akun", description: "Kas, rekening bank, e-wallet, dan saldo awal.", icon: Landmark },
  { href: "/keuangan/anggaran", title: "Anggaran", description: "Batas bulanan per kategori dan realisasi.", icon: LayoutDashboard },
  { href: "/keuangan/target", title: "Target tabungan", description: "Nominal sasaran, tanggal, dan kontribusi.", icon: Target },
] as const;

export default async function FinancePage() {
  const data = await getWorkspaceData();
  const posted = data.transactions.filter((item) => item.state === "posted");
  const income = posted.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amountMinor, 0n);
  const expense = posted.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amountMinor, 0n);
  const balance = data.accounts.reduce((sum, account) => sum + account.balanceMinor, 0n);

  return (
    <>
      <PageHeader title="Keuangan" description="Satu pintu untuk transaksi, akun, anggaran, dan target tabungan." actions={<Link className="button button--primary" href="/keuangan/transaksi#tambah"><Plus size={16} />Tambah transaksi</Link>} />
      {!data.configured ? <section className="section"><PreviewNotice /></section> : null}
      <section className="section">
        <SectionHeader title="Posisi saat ini" description="Hanya transaksi posted yang memengaruhi ringkasan." />
        <SummaryStrip items={[{ label: "Saldo", value: data.accounts.length ? formatIdr(balance) : "—" }, { label: "Pemasukan", value: posted.length ? formatIdr(income) : "—" }, { label: "Pengeluaran", value: posted.length ? formatIdr(expense) : "—" }, { label: "Bersih", value: posted.length ? formatIdr(income - expense) : "—" }]} />
      </section>
      <section className="section">
        <SectionHeader title="Kelola keuangan" description="Pilih data yang ingin ditinjau atau diperbarui." />
        <div className="workspace-index">
          {destinations.map(({ href, title, description, icon: Icon }) => (
            <Link className="workspace-link" href={href} key={href}>
              <Icon size={20} aria-hidden="true" />
              <span className="workspace-link__copy">
                <strong>{title}</strong>
                <span className="workspace-link__description">{description}</span>
              </span>
              <ArrowRight className="workspace-link__arrow" size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
