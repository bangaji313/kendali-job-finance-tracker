import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const inputSchema = z.object({
  applicationId: z.string().uuid(),
  path: z.string().min(1).max(500),
  originalName: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(160),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Metadata dokumen tidak valid." }, { status: 400 });
  const expectedPrefix = `${auth.user.id}/${parsed.data.applicationId}/`;
  if (!parsed.data.path.startsWith(expectedPrefix)) return Response.json({ error: "Path dokumen tidak sesuai pemilik." }, { status: 403 });
  const { data: application } = await auth.supabase.from("applications").select("id").eq("id", parsed.data.applicationId).maybeSingle();
  if (!application) return Response.json({ error: "Lamaran tidak ditemukan." }, { status: 404 });
  const { error } = await auth.supabase.from("documents").insert({
    user_id: auth.user.id,
    application_id: application.id,
    storage_path: parsed.data.path,
    original_name: parsed.data.originalName,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
  });
  if (error) return Response.json({ error: "Metadata dokumen belum dapat disimpan." }, { status: 409 });
  return Response.json({ stored: true });
}
