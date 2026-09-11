"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const emailSchema = z.email("Masukkan alamat email yang valid.").transform((value) =>
  value.trim().toLocaleLowerCase("en-US"),
);

const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password minimal 8 karakter.").max(128, "Password maksimal 128 karakter."),
});

const signUpSchema = credentialsSchema
  .extend({
    fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(100, "Nama lengkap maksimal 100 karakter."),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: "Konfirmasi password belum sama.",
    path: ["confirmation"],
  });

async function ensureProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  user: { id: string; email?: string; user_metadata: Record<string, unknown> },
) {
  const email = user.email?.toLocaleLowerCase("en-US");
  if (!email) return false;

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) return true;

  const initialAdmin = process.env.INITIAL_ADMIN_EMAIL?.toLocaleLowerCase("en-US");
  const { data: allowed } = await supabase
    .from("access_allowlist")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null;
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: fullName || email.split("@")[0],
    locale: "id-ID",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    is_admin: allowed?.role === "admin" || email === initialAdmin,
  });

  return !error;
}

export async function signUpWithPassword(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa kembali data pendaftaran." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Supabase belum dikonfigurasi." };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/hari-ini`,
    },
  });

  if (error) {
    return { status: "error", message: "Akun belum dapat dibuat. Periksa data lalu coba lagi beberapa saat." };
  }

  if (data.session && data.user) {
    if (!(await ensureProfile(supabase, data.user))) {
      await supabase.auth.signOut();
      return { status: "error", message: "Akun dibuat, tetapi profil belum dapat disiapkan. Coba masuk kembali." };
    }
    revalidatePath("/", "layout");
    redirect("/hari-ini");
  }

  return {
    status: "success",
    message: "Periksa inbox atau folder spam. Buka tautan konfirmasi sebelum masuk ke Kendali.",
  };
}

export async function signInWithPassword(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Periksa email dan password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Supabase belum dikonfigurasi." };

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { status: "error", message: "Email atau password tidak cocok." };
  }

  if (!(await ensureProfile(supabase, data.user))) {
    await supabase.auth.signOut();
    return { status: "error", message: "Profil akun belum dapat disiapkan. Coba lagi beberapa saat." };
  }

  revalidatePath("/", "layout");
  redirect("/hari-ini");
}

export async function requestPasswordReset(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Email tidak valid." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Supabase belum dikonfigurasi." };
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/callback?next=/atur-ulang-password`,
  });

  if (error) return { status: "error", message: "Email pemulihan belum dapat dikirim. Coba lagi beberapa saat." };
  return {
    status: "success",
    message: "Jika email terdaftar, tautan untuk membuat password baru sudah dikirim.",
  };
}

export async function updatePassword(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({
      password: z.string().min(8, "Password minimal 8 karakter.").max(128),
      confirmation: z.string(),
    })
    .refine((value) => value.password === value.confirmation, {
      message: "Konfirmasi password belum sama.",
      path: ["confirmation"],
    })
    .safeParse({
      password: formData.get("password"),
      confirmation: formData.get("confirmation"),
    });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Password belum valid." };
  }

  const auth = await getAuthenticatedUser();
  if (!auth) return { status: "error", message: "Tautan sudah kedaluwarsa. Minta email pemulihan baru." };
  const { error } = await auth.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "Password belum dapat diperbarui. Minta tautan baru lalu coba lagi." };

  revalidatePath("/", "layout");
  redirect("/hari-ini?password=updated");
}
