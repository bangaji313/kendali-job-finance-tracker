"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, BriefcaseBusiness, CalendarCheck, ChartNoAxesCombined, CircleDollarSign,
  Plus, SearchCheck, Settings, WalletCards, X,
} from "lucide-react";
import { signOut } from "@/app/actions";

const primary = [
  { href: "/hari-ini", label: "Hari Ini", icon: CalendarCheck },
  { href: "/lowongan", label: "Lowongan", icon: SearchCheck },
  { href: "/lamaran", label: "Lamaran", icon: BriefcaseBusiness },
  { href: "/keuangan", label: "Keuangan", icon: CircleDollarSign },
  { href: "/laporan", label: "Laporan", icon: ChartNoAxesCombined },
];

function matches(pathname: string, href: string) {
  return pathname === href || (href !== "/hari-ini" && pathname.startsWith(`${href}/`));
}

export function AppShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <Link href="/hari-ini" className="brand" aria-label="Kendali — Hari Ini">
          <span className="brand-mark" aria-hidden="true">K</span><span>Kendali</span>
        </Link>
        <nav className="rail-nav" aria-label="Navigasi utama">
          {primary.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="nav-link" data-active={matches(pathname, href)}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="rail-foot">
          <Link href="/notifikasi" className="nav-link" data-active={matches(pathname, "/notifikasi")}><Bell size={18} />Notifikasi</Link>
          <Link href="/pengaturan" className="nav-link" data-active={matches(pathname, "/pengaturan")}><Settings size={18} />Pengaturan</Link>
          {signedIn ? <form action={signOut}><button className="button button--quiet" type="submit">Keluar</button></form> : null}
        </div>
      </aside>

      <main className="main-workspace"><div className="content">{children}</div></main>

      <nav className="mobile-bar" aria-label="Navigasi ponsel">
        <Link href="/hari-ini" className="mobile-link" data-active={matches(pathname, "/hari-ini")}><CalendarCheck size={20} />Hari Ini</Link>
        <Link href="/lowongan" className="mobile-link" data-active={matches(pathname, "/lowongan")}><SearchCheck size={20} />Lowongan</Link>
        <button className="mobile-add" type="button" aria-haspopup="dialog" onClick={() => dialogRef.current?.showModal()}><Plus size={20} />Tambah</button>
        <Link href="/lamaran" className="mobile-link" data-active={matches(pathname, "/lamaran")}><BriefcaseBusiness size={20} />Lamaran</Link>
        <Link href="/keuangan" className="mobile-link" data-active={pathname.startsWith("/keuangan")}><CircleDollarSign size={20} />Keuangan</Link>
      </nav>

      <dialog ref={dialogRef} className="dialog" onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
        <header className="dialog-head"><h2>Tambah catatan</h2><button type="button" className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="Tutup"><X size={20} /></button></header>
        <div className="dialog-body">
          <Link href="/lowongan#tambah" className="action-choice" onClick={() => dialogRef.current?.close()}><SearchCheck size={20} /><span><strong>Lowongan</strong><br /><span className="muted">Simpan link resmi, deadline, dan kualifikasi.</span></span></Link>
          <Link href="/lamaran#tambah" className="action-choice" onClick={() => dialogRef.current?.close()}><BriefcaseBusiness size={20} /><span><strong>Lamaran</strong><br /><span className="muted">Catat perusahaan, posisi, dan tahap.</span></span></Link>
          <Link href="/keuangan/transaksi#tambah" className="action-choice" onClick={() => dialogRef.current?.close()}><WalletCards size={20} /><span><strong>Transaksi</strong><br /><span className="muted">Catat pemasukan, pengeluaran, atau transfer.</span></span></Link>
          <div className="dialog-links"><Link href="/laporan" onClick={() => dialogRef.current?.close()}>Laporan</Link><Link href="/notifikasi" onClick={() => dialogRef.current?.close()}>Notifikasi</Link><Link href="/pengaturan" onClick={() => dialogRef.current?.close()}>Pengaturan</Link></div>
        </div>
      </dialog>
    </div>
  );
}
