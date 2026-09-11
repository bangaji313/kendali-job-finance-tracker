"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";

export function ImportPanel({ scope, enabled }: { scope: "applications" | "transactions"; enabled: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ valid: number; invalid: number; errors: string[]; committed?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function validate() {
    if (!file) return;
    setLoading(true);
    const csv = await file.text();
    const response = await fetch(`/api/import/${scope}/validate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv }) });
    const body = await response.json() as { rows?: Array<{ errors: string[] }>; error?: string };
    if (!response.ok || !body.rows) setResult({ valid: 0, invalid: 1, errors: [body.error ?? "File tidak dapat divalidasi."] });
    else setResult({ valid: body.rows.filter((row) => row.errors.length === 0).length, invalid: body.rows.filter((row) => row.errors.length > 0).length, errors: body.rows.flatMap((row) => row.errors).slice(0, 5) });
    setLoading(false);
  }

  async function commit() {
    if (!file || !result || result.invalid > 0) return;
    setLoading(true);
    const response = await fetch(`/api/import/${scope}/commit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv: await file.text() }) });
    const body = await response.json() as { imported?: number; error?: string };
    setResult(response.ok ? { ...result, committed: body.imported ?? 0 } : { ...result, errors: [body.error ?? "Impor tidak dapat disimpan."] });
    setLoading(false);
  }

  return <div className="notice"><FileUp size={20} /><div className="notice__body"><strong>Impor {scope === "applications" ? "lamaran" : "transaksi"}</strong><span className="muted">CSV divalidasi dahulu. Commit atomik tersedia setelah preview tanpa error.</span><div className="field"><label htmlFor={`file-${scope}`}>File CSV</label><input className="input input--file" id={`file-${scope}`} type="file" accept=".csv,text/csv" disabled={!enabled} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); }} /><span className="field-help">Maksimal 5 MB.</span></div><div className="page-actions"><button className="button" type="button" disabled={!file || !enabled || loading} onClick={validate} data-state={loading ? "loading" : undefined}>{loading ? "Memproses" : "Preview impor"}</button>{result && result.invalid === 0 && result.committed === undefined ? <button className="button button--primary" type="button" disabled={loading} onClick={commit}>Simpan {result.valid} baris</button> : null}<a className="button button--quiet" href={`/templates/${scope}.csv`} download>Unduh template</a></div>{result ? <p className="form-status" data-state={result.invalid || result.errors.length ? "error" : "success"} role="status">{result.committed !== undefined ? `${result.committed} baris tersimpan secara atomik.` : `${result.valid} baris valid · ${result.invalid} baris bermasalah${result.errors.length ? ` — ${result.errors.join("; ")}` : ""}`}</p> : null}</div></div>;
}
