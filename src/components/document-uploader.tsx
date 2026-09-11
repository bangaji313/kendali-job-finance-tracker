"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SignedUpload = { path: string; token: string; error?: string };

export function DocumentUploader({ applicationId, enabled }: { applicationId: string; enabled: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;
    setLoading(true);
    const metadata = { applicationId, fileName: file.name, mimeType: file.type, sizeBytes: file.size };
    const signedResponse = await fetch("/api/documents/upload-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(metadata) });
    const signed = await signedResponse.json() as SignedUpload;
    if (!signedResponse.ok) { setStatus(signed.error ?? "URL unggah tidak tersedia."); setLoading(false); return; }
    const supabase = createSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage.from("application-documents").uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
    if (uploadError) { setStatus("File belum dapat diunggah. Periksa koneksi lalu coba lagi."); setLoading(false); return; }
    const completed = await fetch("/api/documents/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...metadata, path: signed.path, originalName: file.name }) });
    setStatus(completed.ok ? "Dokumen tersimpan." : "File terunggah, tetapi metadata belum dapat diselesaikan.");
    setLoading(false);
  }

  return <div className="notice"><FileUp size={20} /><div className="notice__body"><strong>Dokumen lamaran</strong><span className="muted">PDF, DOC/DOCX, JPG, PNG, atau WebP. Maksimal 10 MB.</span><div className="field"><label htmlFor="application-document">Pilih file</label><input className="input input--file" id="application-document" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" disabled={!enabled} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span className="field-help">File tetap privat dan diakses melalui signed URL singkat.</span></div><button className="button" type="button" onClick={upload} disabled={!enabled || !file || loading} data-state={loading ? "loading" : undefined}>{loading ? "Mengunggah" : "Unggah dokumen"}</button><p className="form-status" role="status">{status}</p></div></div>;
}
