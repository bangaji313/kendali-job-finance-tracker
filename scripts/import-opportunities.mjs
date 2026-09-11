import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const dataPath = process.argv[2];
const targetEmail = process.env.KENDALI_IMPORT_USER_EMAIL?.trim().toLowerCase();

if (!dataPath) throw new Error("Berikan path JSON sebagai argumen pertama.");
if (!targetEmail) throw new Error("KENDALI_IMPORT_USER_EMAIL wajib diisi.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Credential server Supabase belum lengkap.");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const parsed = JSON.parse(await readFile(dataPath, "utf8"));
const rows = Array.isArray(parsed) ? parsed : parsed.opportunities;
if (!Array.isArray(rows) || rows.length === 0) throw new Error("Daftar lowongan kosong.");

console.log(`[1/5] Mencari akun pemilik untuk ${rows.length} lowongan...`);
const { data: userPage, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (userError) throw userError;
const user = userPage.users.find((item) => item.email?.toLowerCase() === targetEmail);
if (!user) throw new Error("Akun target tidak ditemukan.");

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("display_name")
  .eq("id", user.id)
  .single();
if (profileError) throw profileError;
console.log(`[2/5] Target terverifikasi: ${profile.display_name}`);

let created = 0;
let updated = 0;
const insertedByKey = new Map();
const verifiedAt = new Date().toISOString();

console.log("[3/5] Menyimpan lowongan secara idempoten...");
for (const [index, row] of rows.entries()) {
  const dbRow = {
    user_id: user.id,
    company_name: row.companyName,
    title: row.title,
    official_apply_url: row.officialApplyUrl,
    source_url: row.sourceUrl ?? null,
    source_name: row.sourceName ?? null,
    program_type: row.programType,
    employment_type: row.employmentType ?? null,
    location: row.location ?? null,
    work_mode: row.workMode ?? null,
    published_at: row.publishedAt ?? null,
    deadline_at: row.deadlineAt ?? null,
    deadline_kind: row.deadlineKind ?? "unknown",
    status: row.status ?? "saved",
    is_fresh_graduate: row.isFreshGraduate ?? true,
    experience_max_years: row.experienceMaxYears ?? null,
    education: row.education ?? null,
    requirements: row.requirements ?? null,
    notes: row.notes ?? null,
    last_verified_at: verifiedAt,
  };

  const { data: existing, error: findError } = await supabase
    .from("job_opportunities")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", row.title)
    .eq("official_apply_url", row.officialApplyUrl)
    .is("archived_at", null)
    .maybeSingle();
  if (findError) throw findError;

  let opportunity;
  if (existing) {
    const { data, error } = await supabase
      .from("job_opportunities")
      .update(dbRow)
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select("id,company_name,title,status")
      .single();
    if (error) throw error;
    opportunity = data;
    updated += 1;
    console.log(`  ${index + 1}. diperbarui | ${data.company_name} — ${data.title} [${data.status}]`);
  } else {
    const { data, error } = await supabase
      .from("job_opportunities")
      .insert(dbRow)
      .select("id,company_name,title,status")
      .single();
    if (error) throw error;
    opportunity = data;
    created += 1;
    console.log(`  ${index + 1}. dibuat     | ${data.company_name} — ${data.title} [${data.status}]`);
  }
  insertedByKey.set(row.key, { ...opportunity, application: row.application });
}

console.log("[4/5] Menyelaraskan lamaran yang sudah dikirim...");
for (const [key, opportunity] of insertedByKey) {
  if (!opportunity.application) continue;
  const app = opportunity.application;

  const { data: existingCompany, error: companyFindError } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", opportunity.company_name)
    .maybeSingle();
  if (companyFindError) throw companyFindError;

  let companyId = existingCompany?.id;
  if (!companyId) {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ user_id: user.id, name: opportunity.company_name })
      .select("id")
      .single();
    if (companyError) throw companyError;
    companyId = company.id;
  }

  const { data: existingApplication, error: appFindError } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_opportunity_id", opportunity.id)
    .maybeSingle();
  if (appFindError) throw appFindError;

  if (!existingApplication) {
    const { error: appError } = await supabase.from("applications").insert({
      user_id: user.id,
      company_id: companyId,
      position: opportunity.title,
      stage: app.stage,
      employment_type: app.employmentType,
      applied_at: app.appliedAt,
      location: app.location ?? null,
      work_mode: app.workMode ?? null,
      source: app.source,
      notes: app.notes ?? null,
      next_action: app.nextAction ?? null,
      next_action_at: app.nextActionAt ?? null,
      source_opportunity_id: opportunity.id,
    });
    if (appError) throw appError;
    console.log(`  lamaran dibuat | ${opportunity.company_name} — ${opportunity.title}`);
  } else {
    console.log(`  lamaran sudah ada | ${opportunity.company_name} — ${opportunity.title}`);
  }

  const { error: statusError } = await supabase
    .from("job_opportunities")
    .update({ status: "applied" })
    .eq("id", opportunity.id)
    .eq("user_id", user.id);
  if (statusError) throw statusError;
  insertedByKey.set(key, { ...opportunity, status: "applied" });
}

const { count: opportunityCount, error: opportunityCountError } = await supabase
  .from("job_opportunities")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .is("archived_at", null);
if (opportunityCountError) throw opportunityCountError;

const { count: applicationCount, error: applicationCountError } = await supabase
  .from("applications")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .is("archived_at", null);
if (applicationCountError) throw applicationCountError;

console.log(`[5/5] Selesai | dibuat: ${created} | diperbarui: ${updated} | total lowongan aktif: ${opportunityCount} | total lamaran aktif: ${applicationCount}`);
