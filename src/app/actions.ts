"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applicationInputSchema, pushSubscriptionSchema, transactionInputSchema } from "@/lib/validation/schemas";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { z } from "zod";
import { applicationStages } from "@/lib/domain/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ActionState = { status: "idle" | "success" | "error"; message: string };

const unauthorized: ActionState = {
  status: "error",
  message: "Sesi tidak tersedia. Masuk kembali sebelum menyimpan perubahan.",
};

export async function createApplication(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = applicationInputSchema.safeParse({
    companyName: formData.get("companyName"),
    position: formData.get("position"),
    stage: formData.get("stage"),
    employmentType: formData.get("employmentType"),
    appliedAt: formData.get("appliedAt") || null,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa kembali data lamaran." };

  const existingCompany = await auth.supabase.from("companies").select("id").eq("user_id", auth.user.id).eq("name", parsed.data.companyName).maybeSingle();
  let company = existingCompany.data;
  if (!company) {
    const created = await auth.supabase.from("companies").insert({ user_id: auth.user.id, name: parsed.data.companyName }).select("id").single();
    company = created.data;
  }
  if (!company) return { status: "error", message: "Perusahaan tidak dapat disimpan. Coba lagi." };

  const { error } = await auth.supabase.from("applications").insert({
    user_id: auth.user.id,
    company_id: company.id,
    position: parsed.data.position,
    stage: parsed.data.stage,
    employment_type: parsed.data.employmentType,
    applied_at: parsed.data.appliedAt,
  });
  if (error) return { status: "error", message: "Lamaran tidak dapat disimpan. Periksa koneksi lalu coba lagi." };
  revalidatePath("/hari-ini");
  revalidatePath("/lamaran");
  return { status: "success", message: "Lamaran tersimpan." };
}

export async function updateApplication(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const applicationId = String(formData.get("applicationId") ?? "");
  const nextActionInput = String(formData.get("nextActionAt") ?? "");
  const parsed = applicationInputSchema.safeParse({
    companyName: formData.get("companyName"),
    position: formData.get("position"),
    stage: formData.get("stage"),
    employmentType: formData.get("employmentType"),
    appliedAt: formData.get("appliedAt") || null,
    location: formData.get("location") || null,
    workMode: formData.get("workMode") || null,
    source: formData.get("source") || null,
    compensationAmount: formData.get("compensationAmount") || null,
    payPeriod: formData.get("payPeriod") || null,
    contractMonths: formData.get("contractMonths") || null,
    contractStart: formData.get("contractStart") || null,
    contractEnd: formData.get("contractEnd") || null,
    notes: formData.get("notes") || null,
    nextAction: formData.get("nextAction") || null,
    nextActionAt: nextActionInput ? new Date(nextActionInput).toISOString() : null,
  });
  if (!/^[0-9a-f-]{36}$/i.test(applicationId) || !parsed.success) {
    return { status: "error", message: parsed.success ? "Lamaran tidak valid." : parsed.error.issues[0]?.message ?? "Periksa data lamaran." };
  }
  const existingCompany = await auth.supabase.from("companies").select("id").eq("user_id", auth.user.id).ilike("name", parsed.data.companyName).maybeSingle();
  let companyId = existingCompany.data?.id;
  if (!companyId) {
    const created = await auth.supabase.from("companies").insert({ user_id: auth.user.id, name: parsed.data.companyName }).select("id").single();
    companyId = created.data?.id;
  }
  if (!companyId) return { status: "error", message: "Perusahaan tidak dapat disimpan." };
  const { error } = await auth.supabase.from("applications").update({
    company_id: companyId,
    position: parsed.data.position,
    stage: parsed.data.stage,
    employment_type: parsed.data.employmentType,
    applied_at: parsed.data.appliedAt,
    location: parsed.data.location,
    work_mode: parsed.data.workMode,
    source: parsed.data.source,
    compensation_amount: parsed.data.compensationAmount,
    pay_period: parsed.data.payPeriod,
    contract_months: parsed.data.contractMonths,
    contract_start: parsed.data.contractStart,
    contract_end: parsed.data.contractEnd,
    notes: parsed.data.notes,
    next_action: parsed.data.nextAction,
    next_action_at: parsed.data.nextActionAt,
  }).eq("id", applicationId).eq("user_id", auth.user.id);
  if (error) return { status: "error", message: "Perubahan lamaran belum dapat disimpan." };
  revalidatePath(`/lamaran/${applicationId}`); revalidatePath("/lamaran"); revalidatePath("/hari-ini");
  return { status: "success", message: "Detail lamaran diperbarui." };
}

export async function archiveApplication(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("applicationId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("applications").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/lamaran"); revalidatePath("/hari-ini");
  redirect(`/lamaran?archived=${id}`);
}

export async function restoreApplication(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("applicationId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("applications").update({ archived_at: null }).eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/lamaran"); revalidatePath("/hari-ini");
  redirect("/lamaran?restored=1");
}

export async function createTransaction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = transactionInputSchema.safeParse({
    kind: formData.get("kind"),
    state: formData.get("state") || "posted",
    amount: formData.get("amount"),
    occurredAt: formData.get("occurredAt"),
    description: formData.get("description"),
    sourceAccountId: formData.get("sourceAccountId") || null,
    destinationAccountId: formData.get("destinationAccountId") || null,
    categoryId: formData.get("categoryId") || null,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa kembali transaksi." };
  const { error } = await auth.supabase.from("money_transactions").insert({
    user_id: auth.user.id,
    kind: parsed.data.kind,
    state: parsed.data.state,
    amount: parsed.data.amount,
    occurred_at: parsed.data.occurredAt,
    description: parsed.data.description,
    source_account_id: parsed.data.sourceAccountId,
    destination_account_id: parsed.data.destinationAccountId,
    category_id: parsed.data.categoryId,
    currency: parsed.data.currency,
  });
  if (error) return { status: "error", message: "Transaksi tidak dapat disimpan. Periksa akun dan coba lagi." };
  revalidatePath("/hari-ini");
  revalidatePath("/keuangan/transaksi");
  return { status: "success", message: "Transaksi tersimpan." };
}

export async function updateTransaction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const transactionId = String(formData.get("transactionId") ?? "");
  const parsed = transactionInputSchema.safeParse({
    kind: formData.get("kind"), state: formData.get("state"), amount: formData.get("amount"),
    occurredAt: formData.get("occurredAt"), description: formData.get("description"),
    sourceAccountId: formData.get("sourceAccountId") || null,
    destinationAccountId: formData.get("destinationAccountId") || null,
    categoryId: formData.get("categoryId") || null,
  });
  if (!/^[0-9a-f-]{36}$/i.test(transactionId) || !parsed.success) return { status: "error", message: parsed.success ? "Transaksi tidak valid." : parsed.error.issues[0]?.message ?? "Periksa transaksi." };
  const { data: updated, error } = await auth.supabase.from("money_transactions").update({
    kind: parsed.data.kind, state: parsed.data.state, amount: parsed.data.amount,
    occurred_at: parsed.data.occurredAt, description: parsed.data.description,
    source_account_id: parsed.data.sourceAccountId, destination_account_id: parsed.data.destinationAccountId,
    category_id: parsed.data.categoryId,
  }).eq("id", transactionId).eq("user_id", auth.user.id).select("id,description").maybeSingle();
  if (error || !updated || updated.description !== parsed.data.description) return { status: "error", message: "Transaksi tidak berubah. Muat ulang halaman lalu coba kembali." };
  revalidatePath(`/keuangan/transaksi/${transactionId}`); revalidatePath("/keuangan/transaksi"); revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  return { status: "success", message: "Transaksi diperbarui." };
}

export async function setTransactionState(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const parsed = z.object({ transactionId: z.string().uuid(), state: z.enum(["draft", "posted", "void"]) }).safeParse({ transactionId: formData.get("transactionId"), state: formData.get("state") });
  if (!auth || !parsed.success) return;
  await auth.supabase.from("money_transactions").update({ state: parsed.data.state }).eq("id", parsed.data.transactionId).eq("user_id", auth.user.id);
  revalidatePath("/keuangan/transaksi"); revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
}

export async function archiveTransaction(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("transactionId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("money_transactions").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/keuangan/transaksi"); revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  redirect(`/keuangan/transaksi?archived=${id}`);
}

export async function restoreTransaction(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("transactionId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("money_transactions").update({ archived_at: null }).eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/keuangan/transaksi"); revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  redirect("/keuangan/transaksi?restored=1");
}

export async function createIncomeRuleFromApplication(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const input = {
    applicationId: String(formData.get("applicationId") ?? ""),
    destinationAccountId: String(formData.get("destinationAccountId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    startsOn: String(formData.get("startsOn") ?? ""),
    frequency: String(formData.get("frequency") ?? "monthly"),
  };
  const identifiersValid = /^[0-9a-f-]{36}$/i.test(input.applicationId) && /^[0-9a-f-]{36}$/i.test(input.destinationAccountId);
  if (!identifiersValid || !/^\d+(?:\.\d{1,2})?$/.test(input.amount) || !/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !["weekly", "monthly", "yearly"].includes(input.frequency)) {
    return { status: "error", message: "Lengkapi akun, nominal, tanggal mulai, dan frekuensi." };
  }
  const { data: application } = await auth.supabase.from("applications").select("id,position,stage").eq("id", input.applicationId).eq("stage", "accepted").maybeSingle();
  if (!application) return { status: "error", message: "Lamaran belum berstatus diterima atau tidak ditemukan." };
  const { error } = await auth.supabase.from("recurring_rules").insert({
    user_id: auth.user.id,
    kind: "income",
    frequency: input.frequency,
    amount: input.amount,
    description: `Pemasukan — ${application.position}`,
    destination_account_id: input.destinationAccountId,
    source_application_id: application.id,
    starts_on: input.startsOn,
    next_occurrence_on: input.startsOn,
  });
  if (error) return { status: "error", message: "Draft rutin tidak dibuat. Lamaran ini mungkin sudah terhubung." };
  revalidatePath(`/lamaran/${application.id}`);
  return { status: "success", message: "Aturan pemasukan dibuat. Transaksi jatuh tempo akan muncul sebagai draft." };
}

export async function createAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ name: z.string().trim().min(1).max(120), kind: z.enum(["cash", "bank", "ewallet", "other"]), openingBalance: z.string().regex(/^-?\d+(?:\.\d{1,2})?$/) }).safeParse({ name: formData.get("name"), kind: formData.get("kind"), openingBalance: formData.get("openingBalance") || "0" });
  if (!parsed.success) return { status: "error", message: "Isi nama, jenis, dan saldo awal yang valid." };
  const { error } = await auth.supabase.from("accounts").insert({ user_id: auth.user.id, name: parsed.data.name, kind: parsed.data.kind, opening_balance: parsed.data.openingBalance });
  if (error) return { status: "error", message: "Akun tidak dapat disimpan. Gunakan nama yang berbeda." };
  revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  return { status: "success", message: "Akun tersimpan." };
}

export async function updateAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ accountId: z.string().uuid(), name: z.string().trim().min(1).max(120), kind: z.enum(["cash", "bank", "ewallet", "other"]), openingBalance: z.string().regex(/^-?\d+(?:\.\d{1,2})?$/) }).safeParse({ accountId: formData.get("accountId"), name: formData.get("name"), kind: formData.get("kind"), openingBalance: formData.get("openingBalance") });
  if (!parsed.success) return { status: "error", message: "Isi nama, jenis, dan saldo awal yang valid." };
  const { error } = await auth.supabase.from("accounts").update({ name: parsed.data.name, kind: parsed.data.kind, opening_balance: parsed.data.openingBalance }).eq("id", parsed.data.accountId).eq("user_id", auth.user.id);
  if (error) return { status: "error", message: "Akun belum dapat diperbarui. Gunakan nama yang berbeda." };
  revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  return { status: "success", message: "Akun diperbarui." };
}

export async function archiveAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ accountId: z.string().uuid() }).safeParse({ accountId: formData.get("accountId") });
  if (!parsed.success) return { status: "error", message: "Akun tidak valid." };
  const used = await auth.supabase.from("money_transactions").select("id").neq("state", "void").or(`source_account_id.eq.${parsed.data.accountId},destination_account_id.eq.${parsed.data.accountId}`).limit(1);
  if (used.data?.length) return { status: "error", message: "Akun masih dipakai transaksi aktif. Void atau pindahkan transaksi terlebih dahulu." };
  const { error } = await auth.supabase.from("accounts").update({ archived_at: new Date().toISOString() }).eq("id", parsed.data.accountId).eq("user_id", auth.user.id);
  if (error) return { status: "error", message: "Akun belum dapat diarsipkan." };
  revalidatePath("/keuangan/akun"); revalidatePath("/hari-ini");
  return { status: "success", message: "Akun diarsipkan." };
}

export async function createBudget(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ categoryId: z.string().uuid(), month: z.string().regex(/^\d{4}-\d{2}$/), limit: z.string().regex(/^\d+(?:\.\d{1,2})?$/) }).safeParse({ categoryId: formData.get("categoryId"), month: formData.get("month"), limit: formData.get("limit") });
  if (!parsed.success) return { status: "error", message: "Pilih kategori, bulan, dan batas yang valid." };
  const { error } = await auth.supabase.from("budgets").upsert({ user_id: auth.user.id, category_id: parsed.data.categoryId, month: `${parsed.data.month}-01`, limit_amount: parsed.data.limit }, { onConflict: "user_id,category_id,month" });
  if (error) return { status: "error", message: "Anggaran belum dapat disimpan." };
  revalidatePath("/keuangan/anggaran"); revalidatePath("/hari-ini");
  return { status: "success", message: "Anggaran tersimpan." };
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("budgetId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("budgets").delete().eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/keuangan/anggaran"); revalidatePath("/hari-ini");
}

export async function createSavingsGoal(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ name: z.string().trim().min(1).max(160), target: z.string().regex(/^\d+(?:\.\d{1,2})?$/), targetDate: z.union([z.iso.date(), z.literal("")]) }).safeParse({ name: formData.get("name"), target: formData.get("target"), targetDate: formData.get("targetDate") || "" });
  if (!parsed.success) return { status: "error", message: "Isi nama target, nominal, dan tanggal yang valid." };
  const { error } = await auth.supabase.from("savings_goals").insert({ user_id: auth.user.id, name: parsed.data.name, target_amount: parsed.data.target, target_date: parsed.data.targetDate || null });
  if (error) return { status: "error", message: "Target belum dapat disimpan." };
  revalidatePath("/keuangan/target");
  return { status: "success", message: "Target tabungan tersimpan." };
}

export async function addGoalContribution(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ goalId: z.string().uuid(), amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/), contributedAt: z.iso.date(), note: z.string().trim().max(500) }).safeParse({ goalId: formData.get("goalId"), amount: formData.get("amount"), contributedAt: formData.get("contributedAt"), note: formData.get("note") || "" });
  if (!parsed.success) return { status: "error", message: "Isi nominal dan tanggal kontribusi yang valid." };
  const { error } = await auth.supabase.from("goal_contributions").insert({ user_id: auth.user.id, goal_id: parsed.data.goalId, amount: parsed.data.amount, contributed_at: parsed.data.contributedAt, note: parsed.data.note || null, is_manual: true });
  if (error) return { status: "error", message: "Kontribusi belum dapat disimpan." };
  revalidatePath("/keuangan/target"); revalidatePath("/hari-ini");
  return { status: "success", message: "Kontribusi manual ditambahkan. Saldo akun tidak berubah." };
}

export async function archiveSavingsGoal(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("goalId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("savings_goals").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  revalidatePath("/keuangan/target"); revalidatePath("/hari-ini");
}

export async function updateApplicationStage(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ applicationId: z.string().uuid(), stage: z.enum(applicationStages) }).safeParse({ applicationId: formData.get("applicationId"), stage: formData.get("stage") });
  if (!parsed.success) return { status: "error", message: "Tahap yang dipilih tidak valid." };
  const { error } = await auth.supabase.from("applications").update({ stage: parsed.data.stage }).eq("id", parsed.data.applicationId);
  if (error) return { status: "error", message: "Tahap belum dapat diperbarui." };
  revalidatePath(`/lamaran/${parsed.data.applicationId}`); revalidatePath("/lamaran"); revalidatePath("/hari-ini");
  return { status: "success", message: "Tahap diperbarui dan riwayat dicatat." };
}

export async function createReminder(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ applicationId: z.string().uuid(), title: z.string().trim().min(1).max(240), dueAt: z.iso.datetime({ local: true }) }).safeParse({ applicationId: formData.get("applicationId"), title: formData.get("title"), dueAt: formData.get("dueAt") });
  if (!parsed.success) return { status: "error", message: "Isi judul dan waktu reminder yang valid." };
  const { error } = await auth.supabase.from("reminders").insert({ user_id: auth.user.id, application_id: parsed.data.applicationId, title: parsed.data.title, due_at: new Date(parsed.data.dueAt).toISOString() });
  if (error) return { status: "error", message: "Reminder belum dapat disimpan." };
  revalidatePath(`/lamaran/${parsed.data.applicationId}`); revalidatePath("/hari-ini"); revalidatePath("/notifikasi");
  return { status: "success", message: "Reminder tersimpan." };
}

export async function completeReminder(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("reminderId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await auth.supabase.from("reminders").update({ state: "done", completed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/notifikasi"); revalidatePath("/hari-ini");
}

export async function snoozeReminder(formData: FormData): Promise<void> {
  const auth = await getAuthenticatedUser();
  const id = String(formData.get("reminderId") ?? "");
  if (!auth || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await auth.supabase.from("reminders").update({ state: "snoozed", snoozed_until: tomorrow }).eq("id", id);
  revalidatePath("/notifikasi"); revalidatePath("/hari-ini");
}

export async function deleteOwnAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  if (formData.get("confirmation") !== "HAPUS AKUN") return { status: "error", message: "Ketik HAPUS AKUN persis untuk melanjutkan." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "error", message: "Server secret key belum dikonfigurasi. Penghapusan dibatalkan." };

  const { data: folders } = await admin.storage.from("application-documents").list(auth.user.id, { limit: 1000 });
  const paths: string[] = [];
  for (const folder of folders ?? []) {
    const { data: files } = await admin.storage.from("application-documents").list(`${auth.user.id}/${folder.name}`, { limit: 1000 });
    for (const file of files ?? []) paths.push(`${auth.user.id}/${folder.name}/${file.name}`);
  }
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return { status: "error", message: "Akun tidak dihapus. Tidak ada perubahan lanjutan yang dilakukan." };
  if (paths.length) await admin.storage.from("application-documents").remove(paths);
  redirect("/masuk?deleted=1");
}

export async function inviteUser(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = z.object({ email: z.email().transform((value) => value.toLocaleLowerCase("en-US")), role: z.enum(["member", "admin"]) }).safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Isi alamat email dan peran yang valid." };
  const { data: profile } = await auth.supabase.from("profiles").select("is_admin").eq("id", auth.user.id).maybeSingle();
  if (!profile?.is_admin) return { status: "error", message: "Hanya admin yang dapat mengirim undangan." };
  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "error", message: "Server secret key belum dikonfigurasi." };
  const previous = await auth.supabase.from("access_allowlist").select("role,invited_by").eq("email", parsed.data.email).maybeSingle();
  const { error: allowlistError } = await auth.supabase.from("access_allowlist").upsert({ email: parsed.data.email, role: parsed.data.role, invited_by: auth.user.id }, { onConflict: "email" });
  if (allowlistError) return { status: "error", message: "Email belum dapat ditambahkan ke allowlist." };
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/atur-ulang-password` });
  if (error) {
    if (previous.data) await auth.supabase.from("access_allowlist").update(previous.data).eq("email", parsed.data.email);
    else await auth.supabase.from("access_allowlist").delete().eq("email", parsed.data.email);
    return { status: "error", message: "Undangan tidak terkirim. Allowlist dikembalikan ke kondisi semula." };
  }
  return { status: "success", message: "Undangan terkirim dan email telah masuk allowlist." };
}

export async function savePushSubscription(subscription: unknown): Promise<ActionState> {
  const auth = await getAuthenticatedUser();
  if (!auth) return unauthorized;
  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { status: "error", message: "Perangkat tidak mengirim subscription yang valid." };
  const { error } = await auth.supabase.from("push_subscriptions").upsert({
    user_id: auth.user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    user_agent: "browser",
  }, { onConflict: "user_id,endpoint" });
  return error ? { status: "error", message: "Perangkat belum dapat didaftarkan." } : { status: "success", message: "Push aktif di perangkat ini." };
}

export async function signOut(): Promise<void> {
  const auth = await getAuthenticatedUser();
  if (auth) await auth.supabase.auth.signOut();
  revalidatePath("/", "layout");
}
