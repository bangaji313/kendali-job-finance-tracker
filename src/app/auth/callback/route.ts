import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedDestinations = new Set(["/hari-ini", "/atur-ulang-password"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  const requestedDestination = url.searchParams.get("next") ?? "/hari-ini";
  const destination = allowedDestinations.has(requestedDestination) ? requestedDestination : "/hari-ini";
  const supabase = await createSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/masuk?error=callback", url.origin));

  const { data, error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error || !data.user.email) return NextResponse.redirect(new URL("/masuk?error=session", url.origin));

  const email = data.user.email.toLocaleLowerCase("en-US");
  const initialAdmin = process.env.INITIAL_ADMIN_EMAIL?.toLocaleLowerCase("en-US");
  const { data: allowed } = await supabase.from("access_allowlist").select("email,role").eq("email", email).maybeSingle();
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
