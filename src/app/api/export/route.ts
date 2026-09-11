import Papa from "papaparse";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const scopes = ["applications", "opportunities", "finance", "all"] as const;
const formats = ["csv", "json"] as const;

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const format = url.searchParams.get("format");
  if (!scopes.includes(scope as (typeof scopes)[number]) || !formats.includes(format as (typeof formats)[number])) return Response.json({ error: "Scope atau format tidak didukung." }, { status: 400 });
  if (format === "csv" && scope === "all") return Response.json({ error: "Ekspor seluruh data tersedia dalam format JSON." }, { status: 400 });

  const includeAll = scope === "all";
  const [applications, activities, opportunities, milestones, transactions, accounts, categories, recurringRules, budgets, goals, contributions, reminders, labels, contacts, documents] = await Promise.all([
    scope === "applications" || includeAll ? auth.supabase.from("applications").select("*,companies!applications_company_id_fkey(name)") : Promise.resolve({ data: [] }),
    includeAll ? auth.supabase.from("application_activities").select("*") : Promise.resolve({ data: [] }),
    scope === "opportunities" || includeAll ? auth.supabase.from("job_opportunities").select("*") : Promise.resolve({ data: [] }),
    scope === "opportunities" || includeAll ? auth.supabase.from("job_opportunity_milestones").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("money_transactions").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("accounts").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("categories").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("recurring_rules").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("budgets").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("savings_goals").select("*") : Promise.resolve({ data: [] }),
    scope === "finance" || includeAll ? auth.supabase.from("goal_contributions").select("*") : Promise.resolve({ data: [] }),
    includeAll ? auth.supabase.from("reminders").select("*") : Promise.resolve({ data: [] }),
    includeAll ? auth.supabase.from("labels").select("*") : Promise.resolve({ data: [] }),
    includeAll ? auth.supabase.from("contacts").select("*") : Promise.resolve({ data: [] }),
    includeAll ? auth.supabase.from("documents").select("id,application_id,original_name,mime_type,size_bytes,created_at") : Promise.resolve({ data: [] }),
  ]);
  const payload = { exportedAt: new Date().toISOString(), applications: applications.data ?? [], applicationActivities: activities.data ?? [], opportunities: opportunities.data ?? [], opportunityMilestones: milestones.data ?? [], transactions: transactions.data ?? [], accounts: accounts.data ?? [], categories: categories.data ?? [], recurringRules: recurringRules.data ?? [], budgets: budgets.data ?? [], goals: goals.data ?? [], goalContributions: contributions.data ?? [], reminders: reminders.data ?? [], labels: labels.data ?? [], contacts: contacts.data ?? [], documents: documents.data ?? [] };
  if (format === "json") return new Response(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="kendali-${scope}.json"`, "cache-control": "private, no-store" } });
  const rows = scope === "applications" ? payload.applications : scope === "opportunities" ? payload.opportunities : payload.transactions;
  return new Response(Papa.unparse(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="kendali-${scope}.csv"`, "cache-control": "private, no-store" } });
}
