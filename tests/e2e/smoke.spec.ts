import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

test("halaman masuk tampil tanpa error browser", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/masuk");
  await expect(page.getByRole("heading", { name: "Lamaran bergerak. Uang tetap terbaca." })).toBeVisible();
  await expect(page.getByLabel("Alamat email")).toHaveAttribute("autocomplete", "username");
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "current-password");
  await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("halaman daftar menyediakan form akun yang aksesibel", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/daftar");
  await expect(page.getByRole("heading", { name: "Buat ruang kendali Anda." })).toBeVisible();
  await expect(page.getByLabel("Nama lengkap")).toHaveAttribute("autocomplete", "name");
  await expect(page.getByLabel("Alamat email")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByLabel("Konfirmasi password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByRole("button", { name: "Buat akun" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk", exact: true })).toBeVisible();
  await page.getByLabel("Nama lengkap").fill("Pengguna Baru");
  await page.getByLabel("Alamat email").fill("pengguna-baru@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Password-aman-8");
  await page.getByLabel("Konfirmasi password").fill("Password-berbeda-8");
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("status")).toContainText("Konfirmasi password belum sama.");
  await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("layout publik tidak overflow", async ({ page }) => {
  for (const route of ["/masuk", "/daftar", "/lupa-password"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${route} tidak boleh overflow horizontal`).toBe(false);
  }
});

test("login email/password dan alur Lowongan menuju Lamaran bekerja", async ({ page }, testInfo) => {
  test.skip(!supabaseUrl || !publishableKey || !secretKey, "Supabase integration credentials tidak tersedia.");
  const admin = createClient(supabaseUrl!, secretKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = `${Date.now()}-${testInfo.project.name.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  const email = `kendali-e2e-${suffix}@example.com`;
  const password = `Kendali-${suffix}-A9!`;
  const company = `Perusahaan Uji ${suffix}`;
  let userId: string | undefined;

  try {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Pengguna Uji" } });
    expect(created.error).toBeNull();
    userId = created.data.user?.id;
    await page.goto("/masuk");
    await page.getByLabel("Alamat email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/hari-ini$/);
    await expect(page.getByRole("heading", { name: /Selamat datang/i })).toBeVisible();

    await page.goto("/lowongan#tambah");
    await page.getByLabel("Perusahaan", { exact: true }).fill(company);
    await page.getByLabel("Posisi atau program").fill("Graduate Software Engineer");
    await page.getByLabel("Laman resmi untuk melamar").fill("https://example.com/careers/graduate-engineer");
    await page.locator("#new-opportunity-deadline").fill("2026-12-31");
    await page.getByRole("button", { name: "Simpan lowongan" }).click();
    await expect(page.getByRole("status").last()).toContainText("Lowongan tersimpan");
    await page.getByRole("link", { name: company }).click();
    await expect(page.getByRole("heading", { name: "Graduate Software Engineer" })).toBeVisible();

    await page.getByLabel("Nama milestone").fill("Tes daring");
    await page.getByRole("button", { name: "Tambah milestone" }).click();
    await expect(page.getByText("Tes daring", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tandai dilamar" }).click();
    await expect(page).toHaveURL(/\/lamaran\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "Graduate Software Engineer" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});

test("CRUD keuangan menjaga saldo, status, anggaran, dan target", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "desktop", "Skenario CRUD mendalam cukup dijalankan sekali di desktop.");
  test.skip(!supabaseUrl || !publishableKey || !secretKey, "Supabase integration credentials tidak tersedia.");
  const admin = createClient(supabaseUrl!, secretKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = `${Date.now()}-finance`;
  const email = `kendali-e2e-${suffix}@example.com`;
  const password = `Kendali-${suffix}-A9!`;
  let userId: string | undefined;

  try {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Pengguna Finance Uji" } });
    expect(created.error).toBeNull();
    userId = created.data.user?.id;
    await page.goto("/masuk");
    await page.getByLabel("Alamat email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/hari-ini$/);

    await page.goto("/keuangan");
    await expect(page.getByRole("heading", { name: "Kelola keuangan" })).toBeVisible();
    const financeLinks = page.locator(".workspace-link");
    await expect(financeLinks).toHaveCount(4);
    for (const link of await financeLinks.all()) {
      const layout = await link.evaluate((element) => {
        const children = Array.from(element.children);
        const centers = children.map((child) => {
          const rect = child.getBoundingClientRect();
          return rect.top + rect.height / 2;
        });
        return {
          childCount: children.length,
          centerDelta: Math.max(...centers) - Math.min(...centers),
          columnCount: getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
        };
      });
      expect(layout.childCount).toBe(3);
      expect(layout.columnCount).toBe(3);
      expect(layout.centerDelta).toBeLessThan(2);
    }
    const financeHubOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(financeHubOverflow).toBe(false);

    await page.goto("/keuangan/akun#tambah");
    await page.getByLabel("Nama akun").fill("Rekening Uji");
    await page.getByLabel("Saldo awal").fill("1000000");
    await page.getByRole("button", { name: "Simpan akun" }).click();
    await expect(page.getByText("Akun tersimpan.", { exact: true })).toBeVisible();
    await page.getByText("Kelola", { exact: true }).click();
    await page.getByLabel("Nama", { exact: true }).fill("Rekening Utama Uji");
    await page.getByRole("button", { name: "Simpan akun" }).first().click();
    await expect(page.locator("tbody strong", { hasText: "Rekening Utama Uji" })).toBeVisible();

    await page.goto("/keuangan/transaksi#tambah");
    await page.getByLabel("Nominal").fill("125000");
    await page.getByLabel("Keterangan").fill("Belanja kebutuhan uji");
    await page.getByLabel("Akun sumber").selectOption({ label: "Rekening Utama Uji" });
    await page.getByLabel("Kategori").selectOption({ label: "Makanan" });
    await page.getByRole("button", { name: "Simpan transaksi" }).click();
    await expect(page.getByText("Transaksi tersimpan.", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Belanja kebutuhan uji" }).click();
    await expect(page).toHaveURL(/\/keuangan\/transaksi\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "Edit transaksi" })).toBeVisible();
    await page.getByLabel("Keterangan").fill("Belanja bulanan uji");
    await expect(page.locator("#transaction-edit-description")).toHaveValue("Belanja bulanan uji");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Transaksi diperbarui.", { exact: true })).toBeVisible();
    const transactionId = new URL(page.url()).pathname.split("/").at(-1);
    const formTransactionId = await page.locator('input[name="transactionId"]').first().inputValue();
    expect(transactionId).toBe(formTransactionId);
    await expect.poll(async () => {
      const storedTransaction = await admin.from("money_transactions").select("description").eq("id", formTransactionId).single();
      return storedTransaction.data?.description;
    }, { timeout: 10_000 }).toBe("Belanja bulanan uji");
    await page.getByRole("button", { name: "Arsipkan" }).click();
    await expect(page).toHaveURL(/\/keuangan\/transaksi\?archived=/);
    await page.getByRole("button", { name: "Urungkan" }).click();
    await expect.poll(async () => { await page.reload(); return page.getByText("Belanja bulanan uji", { exact: true }).count(); }, { timeout: 10_000 }).toBe(1);
    await page.getByRole("button", { name: "Void" }).click();
    await expect(page.getByText("void", { exact: true })).toBeVisible();

    await page.goto("/keuangan/anggaran#tambah");
    await page.getByLabel("Kategori pengeluaran").selectOption({ label: "Makanan" });
    await page.getByLabel("Batas").fill("500000");
    await page.getByRole("button", { name: "Simpan anggaran" }).click();
    await expect(page.getByText("Anggaran tersimpan.", { exact: true })).toBeVisible();
    await expect(page.locator("strong", { hasText: /^Makanan$/ })).toBeVisible();

    await page.goto("/keuangan/target#tambah");
    await page.getByLabel("Nama target").fill("Dana darurat uji");
    await page.getByLabel("Nominal target").fill("6000000");
    await page.getByRole("button", { name: "Simpan target" }).click();
    await expect(page.getByText("Target tabungan tersimpan.", { exact: true })).toBeVisible();
    await page.getByLabel("Kontribusi manual").fill("250000");
    await page.getByRole("button", { name: "Tambah", exact: true }).click();
    await expect(page.getByText(/Kontribusi manual ditambahkan/)).toBeVisible();
    await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
