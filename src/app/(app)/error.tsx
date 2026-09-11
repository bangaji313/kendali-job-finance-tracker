"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="section"><p className="eyebrow">Halaman gagal dimuat</p><h1>Data belum dapat ditampilkan.</h1><p className="page-head__description">Koneksi atau sesi mungkin terputus. Muat ulang bagian ini; data yang sudah tersimpan tidak dihapus.</p><div><button className="button" onClick={reset}>Muat ulang</button></div></section>;
}
