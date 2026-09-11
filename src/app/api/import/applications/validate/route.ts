import { csvUploadSchema } from "@/lib/validation/schemas";
import { validateApplicationCsv } from "@/lib/domain/imports";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!(await getAuthenticatedUser())) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  const parsed = csvUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "CSV wajib diisi dan maksimal 5 MB." }, { status: 400 });
  try { return Response.json({ rows: validateApplicationCsv(parsed.data.csv) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "CSV tidak dapat dibaca." }, { status: 400 }); }
}
