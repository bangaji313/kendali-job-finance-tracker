import { csvUploadSchema } from "@/lib/validation/schemas";
import { validateTransactionCsv } from "@/lib/domain/imports";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  const parsed = csvUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "CSV wajib diisi dan maksimal 5 MB." }, { status: 400 });
  const rows = validateTransactionCsv(parsed.data.csv);
  if (rows.some((row) => row.errors.length)) return Response.json({ error: "Commit dibatalkan karena masih ada baris bermasalah.", rows }, { status: 422 });
  const { data, error } = await auth.supabase.rpc("commit_transaction_import", { p_rows: rows.map((row) => ({ ...row.value as object, fingerprint: row.fingerprint })) });
  if (error) return Response.json({ error: "Impor dibatalkan. Tidak ada baris yang disimpan." }, { status: 409 });
  return Response.json({ imported: data });
}
