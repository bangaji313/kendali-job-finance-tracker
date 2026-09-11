import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.REMINDER_DISPATCH_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || supplied !== expected) return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!url || !secret || !publicKey || !privateKey || !subject) return Response.json({ error: "Konfigurasi scheduler belum lengkap." }, { status: 503 });

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: recurringError } = await supabase.rpc("internal_generate_recurring_drafts", { p_through: new Date().toISOString().slice(0, 10) });
  if (recurringError) return Response.json({ error: "Draft rutin belum dapat dibuat." }, { status: 500 });
  const { data: reminders, error } = await supabase.from("due_reminders").select("id,user_id,title").limit(100);
  if (error) return Response.json({ error: "Reminder belum dapat diambil." }, { status: 500 });
  let delivered = 0;
  for (const reminder of reminders ?? []) {
    const { data: subscriptions } = await supabase.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", reminder.user_id).eq("is_active", true);
    for (const subscription of subscriptions ?? []) {
      const idempotencyKey = `${reminder.id}:${subscription.id}`;
      const { error: reservationError } = await supabase.from("notification_deliveries").insert({ reminder_id: reminder.id, user_id: reminder.user_id, push_subscription_id: subscription.id, idempotency_key: idempotencyKey, state: "processing" });
      if (reservationError) continue;
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "Kendali", body: reminder.title, tag: reminder.id, url: "/notifikasi" }));
        await supabase.from("notification_deliveries").update({ state: "sent", sent_at: new Date().toISOString() }).eq("idempotency_key", idempotencyKey);
        delivered += 1;
      } catch {
        await supabase.from("notification_deliveries").update({ state: "failed", failed_at: new Date().toISOString() }).eq("idempotency_key", idempotencyKey);
      }
    }
  }
  return Response.json({ scanned: reminders?.length ?? 0, delivered });
}
