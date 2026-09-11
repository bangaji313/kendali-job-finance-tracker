import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const outputDir = path.resolve(process.argv[2] ?? "docs/panduan/images");
const baseUrl = process.env.KENDALI_GUIDE_BASE_URL ?? "http://127.0.0.1:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Credential Supabase belum lengkap.");

await mkdir(outputDir, { recursive: true });
const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = Date.now();
const email = `kendali-guide-${suffix}@example.com`;
const password = `Kendali-Guide-${suffix}-A9!`;
let userId;
let browser;

async function insert(table, values, select = "id") {
  const result = await admin.from(table).insert(values).select(select);
  if (result.error) throw result.error;
  return result.data;
}

async function capture(page, route, name) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false });
  console.log(`  tersimpan | ${name} | ${route}`);
}

try {
  console.log("[1/5] Membuat akun contoh sementara...");
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Pengguna Contoh" },
  });
  if (created.error || !created.data.user) throw created.error ?? new Error("Akun contoh gagal dibuat.");
  userId = created.data.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    display_name: "Pengguna Contoh",
    locale: "id-ID",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    is_admin: false,
  });
  if (profileError) throw profileError;

  console.log("[2/5] Menyiapkan data contoh yang aman...");
  const opportunities = await insert("job_opportunities", [
    {
      user_id: userId,
      company_name: "Agate",
      title: "Project Manager Intern",
      official_apply_url: "https://agate.id/job/project-manager-intern-6/",
      source_url: "https://agate.id/job/project-manager-intern-6/",
      source_name: "Agate Careers",
      program_type: "internship",
      employment_type: "internship",
      location: "Bandung",
      work_mode: "hybrid",
      published_at: "2026-09-03",
      deadline_kind: "unknown",
      status: "applied",
      is_fresh_graduate: true,
      experience_max_years: 0,
      education: "Mahasiswa aktif atau fresh graduate",
      requirements: "Komunikasi, dokumentasi, pengelolaan jadwal, dan minat pada project management",
      notes: "Sudah dilamar pada 11 September 2026",
      last_verified_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      company_name: "GITS Indonesia",
      title: "Project Manager Internship",
      official_apply_url: "https://glints.com/",
      source_name: "Glints",
      program_type: "internship",
      employment_type: "internship",
      location: "Summarecon Bandung",
      work_mode: "hybrid",
      deadline_at: "2026-09-15",
      deadline_kind: "estimated",
      status: "ready",
      is_fresh_graduate: true,
      experience_max_years: 0,
      education: "Fresh graduate Informatika atau jurusan relevan",
      requirements: "Google Workspace, komunikasi, organisasi, dan minat Project Manager",
      notes: "Prioritas tinggi karena bidang dan lokasi sesuai",
      last_verified_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      company_name: "Makers Institute",
      title: "Fullstack Developer Internship",
      official_apply_url: "https://glints.com/",
      source_name: "Glints",
      program_type: "internship",
      employment_type: "internship",
      location: "Bandung",
      work_mode: "onsite",
      deadline_kind: "unknown",
      status: "ready",
      is_fresh_graduate: true,
      experience_max_years: 0,
      education: "S1 Ilmu Komputer atau bidang terkait",
      requirements: "JavaScript, React, database, dan Git",
      notes: "Pilihan alternatif pada jalur software development",
      last_verified_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      company_name: "Michelin",
      title: "IT Software Development and Digitalization Intern",
      official_apply_url: "https://www.michelin.com/en/careers",
      source_name: "LinkedIn",
      program_type: "internship",
      employment_type: "internship",
      location: "Bekasi",
      work_mode: "onsite",
      deadline_kind: "rolling",
      status: "reviewing",
      is_fresh_graduate: true,
      experience_max_years: 0,
      education: "Fresh graduate IT atau Sistem Informasi",
      requirements: "Software, database, Power Platform, dan dokumentasi teknis",
      notes: "Lamaran ditinjau secara rolling",
      last_verified_at: new Date().toISOString(),
    },
  ], "id,company_name,title");

  const agateOpportunity = opportunities.find((item) => item.company_name === "Agate");
  const [agateCompany] = await insert("companies", { user_id: userId, name: "Agate" });
  const [application] = await insert("applications", {
    user_id: userId,
    company_id: agateCompany.id,
    position: "Project Manager Intern",
    stage: "applied",
    employment_type: "internship",
    applied_at: "2026-09-11",
    location: "Bandung",
    work_mode: "hybrid",
    source: "https://agate.id/job/project-manager-intern-6/",
    next_action: "Periksa email konfirmasi dan siapkan follow-up",
    next_action_at: "2026-09-18T09:00:00+07:00",
    source_opportunity_id: agateOpportunity.id,
  });
  await insert("reminders", {
    user_id: userId,
    application_id: application.id,
    title: "Follow-up lamaran Agate",
    due_at: "2026-09-18T09:00:00+07:00",
    state: "pending",
  });

  const [account] = await insert("accounts", {
    user_id: userId,
    name: "Rekening Utama",
    kind: "bank",
    opening_balance: 2000000,
  });
  const { data: categories, error: categoryError } = await admin
    .from("categories")
    .select("id,name,kind")
    .eq("user_id", userId);
  if (categoryError) throw categoryError;
  const category = (name, kind) => categories.find((item) => item.name === name && item.kind === kind)?.id;
  await insert("money_transactions", [
    { user_id: userId, kind: "income", state: "posted", amount: 4500000, occurred_at: "2026-09-01", description: "Gaji bulan September", destination_account_id: account.id, category_id: category("Gaji", "income") },
    { user_id: userId, kind: "expense", state: "posted", amount: 850000, occurred_at: "2026-09-05", description: "Belanja kebutuhan harian", source_account_id: account.id, category_id: category("Makanan", "expense") },
    { user_id: userId, kind: "expense", state: "posted", amount: 350000, occurred_at: "2026-09-08", description: "Transportasi", source_account_id: account.id, category_id: category("Transportasi", "expense") },
  ]);
  await insert("budgets", {
    user_id: userId,
    category_id: category("Makanan", "expense"),
    month: "2026-09-01",
    limit_amount: 1500000,
  });
  const [goal] = await insert("savings_goals", {
    user_id: userId,
    name: "Laptop kerja",
    target_amount: 12000000,
    target_date: "2027-02-28",
  });
  await insert("goal_contributions", {
    user_id: userId,
    goal_id: goal.id,
    amount: 2000000,
    contributed_at: "2026-09-10",
    note: "Saldo awal target",
    is_manual: true,
  });

  console.log("[3/5] Membuka Kendali dan mengambil halaman publik...");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await capture(page, "/masuk", "01-masuk.png");
  await capture(page, "/daftar", "02-daftar.png");

  console.log("[4/5] Masuk ke akun contoh dan mengambil halaman utama...");
  await page.goto(`${baseUrl}/masuk`, { waitUntil: "networkidle" });
  await page.getByLabel("Alamat email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(/\/hari-ini$/);
  await capture(page, "/hari-ini", "03-hari-ini.png");
  await capture(page, "/lowongan", "04-lowongan.png");
  await capture(page, `/lowongan/${agateOpportunity.id}`, "05-detail-lowongan.png");
  await capture(page, "/lamaran", "06-lamaran.png");
  await capture(page, "/keuangan", "07-keuangan.png");
  await capture(page, "/keuangan/transaksi", "08-transaksi.png");
  await capture(page, "/pengaturan", "09-pengaturan.png");
  await browser.close();
  browser = undefined;
  console.log(`[5/5] Selesai | 9 gambar tersedia di ${outputDir}`);
} finally {
  if (browser) await browser.close();
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) console.warn("Akun contoh belum dapat dibersihkan:", removed.error.message);
    else console.log("[Bersih] Akun dan data contoh sementara telah dihapus.");
  }
}
