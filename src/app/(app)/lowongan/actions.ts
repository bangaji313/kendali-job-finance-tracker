"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/app/actions";
import { deadlineKinds, employmentTypes, jobOpportunityStatuses, jobProgramTypes } from "@/lib/domain/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const optionalText = (maximum: number) =>
  z.preprocess((value) => (String(value ?? "").trim() || null), z.string().max(maximum).nullable());

const optionalDate = z.preprocess(
  (value) => (String(value ?? "").trim() || null),
  z.union([z.iso.date(), z.null()]),
);

const optionalUrl = z.preprocess(
  (value) => (String(value ?? "").trim() || null),
  z.union([z.url().refine((url) => /^https?:\/\//i.test(url), "URL harus memakai http atau https."), z.null()]),
);

const opportunitySchema = z.object({
  id: z.uuid().optional(),
  companyName: z.string().trim().min(1, "Nama perusahaan wajib diisi.").max(160),
  title: z.string().trim().min(1, "Nama posisi wajib diisi.").max(160),
  officialApplyUrl: z.url("URL lamaran resmi belum valid.").refine((url) => /^https?:\/\//i.test(url), "URL harus memakai http atau https."),
  sourceUrl: optionalUrl,
  sourceName: optionalText(120),
  programType: z.enum(jobProgramTypes),
  employmentType: z.preprocess((value) => (value || null), z.union([z.enum(employmentTypes), z.null()])),
  location: optionalText(160),
  workMode: z.preprocess((value) => (value || null), z.union([z.enum(["onsite", "hybrid", "remote"]), z.null()])),
  publishedAt: optionalDate,
  deadlineAt: optionalDate,
  deadlineKind: z.enum(deadlineKinds),
  status: z.enum(jobOpportunityStatuses),
  isFreshGraduate: z.boolean(),
  experienceMaxYears: z.preprocess(
    (value) => (String(value ?? "").trim() === "" ? null : Number(value)),
    z.number().int().min(0).max(10).nullable(),
  ),
  education: optionalText(240),
  requirements: optionalText(5000),
  notes: optionalText(5000),
  verifiedNow: z.boolean(),
});

function parseOpportunityForm(formData: FormData) {
  return opportunitySchema.safeParse({
    id: formData.get("id") || undefined,
    companyName: formData.get("companyName"),
    title: formData.get("title"),
    officialApplyUrl: formData.get("officialApplyUrl"),
    sourceUrl: formData.get("sourceUrl"),
    sourceName: formData.get("sourceName"),
    programType: formData.get("programType"),
    employmentType: formData.get("employmentType"),
    location: formData.get("location"),
    workMode: formData.get("workMode"),
    publishedAt: formData.get("publishedAt"),
    deadlineAt: formData.get("deadlineAt"),
    deadlineKind: formData.get("deadlineKind"),
    status: formData.get("status"),
    isFreshGraduate: formData.get("isFreshGraduate") === "on",
    experienceMaxYears: formData.get("experienceMaxYears"),
    education: formData.get("education"),
    requirements: formData.get("requirements"),
    notes: formData.get("notes"),
    verifiedNow: formData.get("verifiedNow") === "on",
  });
}

function toDatabaseInput(data: z.infer<typeof opportunitySchema>, userId: string) {
  return {
    user_id: userId,
    company_name: data.companyName,
    title: data.title,
    official_apply_url: data.officialApplyUrl,
    source_url: data.sourceUrl,
    source_name: data.sourceName,
    program_type: data.programType,
    employment_type: data.employmentType,
    location: data.location,
    work_mode: data.workMode,
    published_at: data.publishedAt,
    deadline_at: data.deadlineAt,
    deadline_kind: data.deadlineKind,
    status: data.status,
    is_fresh_graduate: data.isFreshGraduate,
    experience_max_years: data.experienceMaxYears,
    education: data.education,
    requirements: data.requirements,
    notes: data.notes,
    ...(data.verifiedNow ? { last_verified_at: new Date().toISOString() } : {}),
  };
}

export async function createOpportunity(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Sesi berakhir. Masuk kembali sebelum menyimpan." };
  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa data lowongan." };

  const { error } = await auth.supabase.from("job_opportunities").insert(toDatabaseInput(parsed.data, auth.user.id));
  if (error?.code === "23505") return { status: "error", message: "Lowongan dengan posisi dan URL resmi yang sama sudah tersimpan." };
  if (error) return { status: "error", message: "Lowongan belum dapat disimpan. Periksa URL dan coba lagi." };

  revalidatePath("/lowongan");
  revalidatePath("/hari-ini");
  return { status: "success", message: "Lowongan tersimpan." };
}

export async function updateOpportunity(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Sesi berakhir. Masuk kembali sebelum menyimpan." };
  const parsed = parseOpportunityForm(formData);
  if (!parsed.success || !parsed.data.id) return { status: "error", message: parsed.success ? "ID lowongan tidak tersedia." : parsed.error.issues[0]?.message ?? "Periksa data lowongan." };

  const { error } = await auth.supabase
    .from("job_opportunities")
    .update(toDatabaseInput(parsed.data, auth.user.id))
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id);
  if (error?.code === "23505") return { status: "error", message: "Lowongan dengan posisi dan URL resmi yang sama sudah tersimpan." };
  if (error) return { status: "error", message: "Perubahan lowongan belum dapat disimpan." };

  revalidatePath(`/lowongan/${parsed.data.id}`);
  revalidatePath("/lowongan");
  revalidatePath("/hari-ini");
  return { status: "success", message: "Perubahan lowongan tersimpan." };
}

export async function archiveOpportunity(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!auth || !parsed.success) return;
  await auth.supabase.from("job_opportunities").update({ archived_at: new Date().toISOString() }).eq("id", parsed.data).eq("user_id", auth.user.id);
  revalidatePath("/lowongan");
  revalidatePath("/hari-ini");
  redirect(`/lowongan?archived=${parsed.data}`);
}

export async function restoreOpportunity(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const parsed = z.uuid().safeParse(formData.get("id"));
  if (!auth || !parsed.success) return;
  await auth.supabase.from("job_opportunities").update({ archived_at: null }).eq("id", parsed.data).eq("user_id", auth.user.id);
  revalidatePath("/lowongan");
  redirect(`/lowongan/${parsed.data}`);
}

export async function createOpportunityMilestone(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Sesi berakhir. Masuk kembali." };
  const parsed = z.object({
    opportunityId: z.uuid(),
    title: z.string().trim().min(1).max(160),
    dueAt: z.preprocess((value) => (String(value ?? "").trim() || null), z.union([z.iso.datetime({ local: true }), z.null()])),
    notes: optionalText(1000),
  }).safeParse({ opportunityId: formData.get("opportunityId"), title: formData.get("title"), dueAt: formData.get("dueAt"), notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa milestone." };

  const { error } = await auth.supabase.from("job_opportunity_milestones").insert({
    user_id: auth.user.id,
    opportunity_id: parsed.data.opportunityId,
    title: parsed.data.title,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
    notes: parsed.data.notes,
  });
  if (error) return { status: "error", message: "Milestone belum dapat disimpan." };
  revalidatePath(`/lowongan/${parsed.data.opportunityId}`);
  revalidatePath("/hari-ini");
  return { status: "success", message: "Milestone ditambahkan." };
}

export async function toggleOpportunityMilestone(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const parsed = z.object({ id: z.uuid(), opportunityId: z.uuid(), complete: z.enum(["true", "false"]) }).safeParse({ id: formData.get("id"), opportunityId: formData.get("opportunityId"), complete: formData.get("complete") });
  if (!auth || !parsed.success) return;
  await auth.supabase.from("job_opportunity_milestones").update({ completed_at: parsed.data.complete === "true" ? new Date().toISOString() : null }).eq("id", parsed.data.id).eq("user_id", auth.user.id);
  revalidatePath(`/lowongan/${parsed.data.opportunityId}`);
  revalidatePath("/hari-ini");
}

export async function convertOpportunityToApplication(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Sesi berakhir. Masuk kembali." };
  const parsed = z.uuid().safeParse(formData.get("opportunityId"));
  if (!parsed.success) return { status: "error", message: "Lowongan tidak valid." };

  const { data: opportunity } = await auth.supabase.from("job_opportunities").select("id,company_name,title,employment_type,official_apply_url").eq("id", parsed.data).eq("user_id", auth.user.id).is("archived_at", null).maybeSingle();
  if (!opportunity) return { status: "error", message: "Lowongan tidak ditemukan." };

  const { data: existingApplication } = await auth.supabase.from("applications").select("id").eq("source_opportunity_id", opportunity.id).maybeSingle();
  if (existingApplication) redirect(`/lamaran/${existingApplication.id}`);

  const existingCompany = await auth.supabase.from("companies").select("id").eq("user_id", auth.user.id).ilike("name", opportunity.company_name).maybeSingle();
  let companyId = existingCompany.data?.id as string | undefined;
  if (!companyId) {
    const createdCompany = await auth.supabase.from("companies").insert({ user_id: auth.user.id, name: opportunity.company_name }).select("id").single();
    companyId = createdCompany.data?.id;
  }
  if (!companyId) return { status: "error", message: "Perusahaan belum dapat dibuat." };

  const { data: application, error } = await auth.supabase.from("applications").insert({
    user_id: auth.user.id,
    company_id: companyId,
    position: opportunity.title,
    stage: "applied",
    employment_type: opportunity.employment_type ?? "permanent",
    applied_at: new Date().toISOString().slice(0, 10),
    source: opportunity.official_apply_url,
    next_action: "Periksa konfirmasi lamaran",
    next_action_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    source_opportunity_id: opportunity.id,
  }).select("id").single();
  if (error || !application) return { status: "error", message: "Lamaran belum dapat dibuat. Lowongan mungkin sudah dipindahkan." };

  await auth.supabase.from("job_opportunities").update({ status: "applied" }).eq("id", opportunity.id);
  revalidatePath("/lowongan");
  revalidatePath("/lamaran");
  revalidatePath("/hari-ini");
  redirect(`/lamaran/${application.id}`);
}
