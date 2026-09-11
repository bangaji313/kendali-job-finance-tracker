import { Landmark, Plus } from "lucide-react";
import { EmptyState, PageHeader, PreviewNotice, SectionHeader, SummaryStrip } from "@/components/ui";
import { formatIdr } from "@/lib/domain/money";
import { getWorkspaceData } from "@/lib/data/workspace";
import { AccountForm, AccountManager } from "@/components/finance-forms";

export const metadata = { title: "Akun" };

export default async function AccountsPage() {
  const data = await getWorkspaceData();
  const total = data.accounts.reduce((sum, account) => sum + account.balanceMinor, 0n);
  return <><PageHeader eyebrow="Keuangan" title="Akun" description="Kas, rekening bank, e-wallet, dan akun lain menjadi sumber kebenaran saldo." actions={<a className="button button--primary" href="#tambah"><Plus size={16} />Tambah akun</a>} />{!data.configured ? <section className="section"><PreviewNotice /></section> : null}<section className="section"><SectionHeader title="Ringkasan akun" description="Saldo dihitung dari saldo awal dan transaksi posted." /><SummaryStrip items={[{ label: "Saldo total", value: data.accounts.length ? formatIdr(total) : "—" }, { label: "Jumlah akun", value: data.accounts.length ? String(data.accounts.length) : "—" }]} />{data.accounts.length === 0 ? <EmptyState title="Belum ada akun" description="Buat satu akun sumber—misalnya rekening utama—sebelum mencatat transaksi." /> : <table className="data-table"><thead><tr><th>Nama</th><th>Jenis</th><th>Saldo</th><th>Aksi</th></tr></thead><tbody>{data.accounts.map((account) => <tr key={account.id}><td data-label="Nama"><strong>{account.name}</strong></td><td data-label="Jenis"><span className="status"><Landmark size={13} />{account.kind}</span></td><td data-label="Saldo" className="mono">{formatIdr(account.balanceMinor)}</td><td data-label="Aksi"><AccountManager account={account} /></td></tr>)}</tbody></table>}</section><section className="section" id="tambah"><SectionHeader title="Tambah akun" description="Saldo awal menjadi titik awal perhitungan ledger." /><AccountForm enabled={data.configured && data.signedIn} /></section></>;
}
