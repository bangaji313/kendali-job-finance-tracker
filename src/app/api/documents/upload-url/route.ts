import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const allowed = new Map([
  ["application/pdf", new Set(["pdf"])],
  ["application/msword", new Set(["doc"])],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", new Set(["docx"])],
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
]);

const inputSchema = z.object({
  applicationId: z.string().uuid(),
  fileName: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(160),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Metadata file tidak valid atau ukuran melebihi 10 MB." }, { status: 400 });
  const extension = parsed.data.fileName.split(".").pop()?.toLocaleLowerCase("en-US") ?? "";
  if (!allowed.get(parsed.data.mimeType)?.has(extension)) return Response.json({ error: "Tipe MIME dan ekstensi file tidak cocok." }, { status: 415 });
  const { data: application } = await auth.supabase.from("applications").select("id").eq("id", parsed.data.applicationId).maybeSingle();
  if (!application) return Response.json({ error: "Lamaran tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  const fileId = randomUUID();
  const path = `${auth.user.id}/${application.id}/${fileId}.${extension}`;
  const { data, error } = await auth.supabase.storage.from("application-documents").createSignedUploadUrl(path);
  if (error) return Response.json({ error: "URL unggah belum dapat dibuat." }, { status: 500 });
  return Response.json({ path, token: data.token, fileId, expiresIn: 120 }, { headers: { "cache-control": "private, no-store" } });
}
