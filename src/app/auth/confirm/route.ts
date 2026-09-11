import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedDestinations = new Set(["/hari-ini", "/atur-ulang-password"]);
const allowedTypes = new Set<EmailOtpType>(["email", "recovery"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const requestedDestination = url.searchParams.get("next") ?? "/hari-ini";
  const destination = allowedDestinations.has(requestedDestination) ? requestedDestination : "/hari-ini";
  const supabase = await createSupabaseServerClient();

  if (!tokenHash || !type || !allowedTypes.has(type) || !supabase) {
    return NextResponse.redirect(new URL("/masuk?error=callback", url.origin));
  }

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  const email = data.user?.email?.toLocaleLowerCase("en-US");
  if (error || !data.user || !email) {
    return NextResponse.redirect(new URL("/masuk?error=session", url.origin));
  }

  const initialAdmin = process.env.INITIAL_ADMIN_EMAIL?.toLocaleLowerCase("en-US");
  const { data: allowed } = await supabase.from("access_allowlist").select("role").eq("email", email).maybeSingle();
  const fullName = typeof data.user.user_metadata.full_name === "string" ? data.user.user_metadata.full_name : null;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name: fullName || email.split("@")[0],
    locale: "id-ID",
    timezone: "Asia/Jakarta",
    currency: "IDR",
    is_admin: allowed?.role === "admin" || email === initialAdmin,
  });

  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/masuk?error=profile", url.origin));
  }

  return NextResponse.redirect(new URL(destination, url.origin));
}
