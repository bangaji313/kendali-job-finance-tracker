import { cache } from "react";
import type {
  ApplicationStage,
  ApplicationSummary,
  EmploymentType,
  TransactionKind,
  TransactionState,
  TransactionSummary,
} from "@/lib/domain/types";
import { decimalToMinor } from "@/lib/domain/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspaceData = {
  configured: boolean;
  signedIn: boolean;
  isAdmin: boolean;
  displayName: string;
  applications: ApplicationSummary[];
  transactions: TransactionSummary[];
  accounts: Array<{ id: string; name: string; kind: "cash" | "bank" | "ewallet" | "other"; balanceMinor: bigint; openingBalance: string }>;
  categories: Array<{ id: string; name: string; kind: "income" | "expense" }>;
  reminders: Array<{ id: string; title: string; dueAt: string; state: "pending" | "done" | "snoozed" }>;
  activities: Array<{ id: string; applicationId: string; kind: string; fromStage: string | null; toStage: string | null; body: string | null; createdAt: string }>;
  budgets: Array<{ id: string; category: string; limitMinor: bigint; spentMinor: bigint }>;
  goals: Array<{ id: string; name: string; targetMinor: bigint; savedMinor: bigint; targetDate: string | null }>;
};

type ApplicationRow = {
  id: string;
  position: string;
  stage: ApplicationStage;
  employment_type: EmploymentType;
  applied_at: string | null;
  next_action: string | null;
  next_action_at: string | null;
  location: string | null;
  work_mode: "onsite" | "hybrid" | "remote" | null;
  source: string | null;
  compensation_amount: string | number | null;
  pay_period: "hourly" | "daily" | "monthly" | "yearly" | null;
  contract_months: number | null;
  contract_start: string | null;
  contract_end: string | null;
  notes: string | null;
  companies: { name: string } | Array<{ name: string }> | null;
};

type TransactionRow = {
  id: string;
  occurred_at: string;
  kind: TransactionKind;
  state: TransactionState;
  description: string;
  amount: string | number;
  source_account_id: string | null;
  destination_account_id: string | null;
  category_id: string | null;
  categories: { name: string } | Array<{ name: string }> | null;
};

const empty: WorkspaceData = {
  configured: false,
  signedIn: false,
  isAdmin: false,
  displayName: "teman",
  applications: [],
  transactions: [],
  accounts: [],
  categories: [],
  reminders: [],
  activities: [],
  budgets: [],
  goals: [],
};

function toMinor(value: unknown): bigint {
  return decimalToMinor(String(value ?? "0"));
}

export const getWorkspaceData = cache(async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ...empty, configured: true };

  const [profile, applications, activities, transactions, accounts, accountRecords, categories, reminders, budgets, goals] = await Promise.all([
    supabase.from("profiles").select("display_name,is_admin").eq("id", auth.user.id).maybeSingle(),
    supabase.from("applications").select("id,position,stage,employment_type,applied_at,next_action,next_action_at,location,work_mode,source,compensation_amount,pay_period,contract_months,contract_start,contract_end,notes,companies!applications_company_id_fkey(name)").is("archived_at", null).order("updated_at", { ascending: false }).limit(100),
    supabase.from("application_activities").select("id,application_id,kind,from_stage,to_stage,body,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("money_transactions").select("id,occurred_at,kind,state,description,amount,source_account_id,destination_account_id,category_id,categories!money_transactions_category_id_fkey(name)").is("archived_at", null).order("occurred_at", { ascending: false }).limit(100),
    supabase.from("account_balances").select("id,name,kind,balance").order("name"),
    supabase.from("accounts").select("id,opening_balance").is("archived_at", null),
    supabase.from("categories").select("id,name,kind").is("archived_at", null).order("name"),
    supabase.from("reminders").select("id,title,due_at,state").in("state", ["pending", "snoozed"]).order("due_at").limit(100),
    supabase.from("budget_progress").select("id,category,limit_amount,spent_amount").order("category"),
    supabase.from("goal_progress").select("id,name,target_amount,saved_amount,target_date").order("target_date"),
  ]);

  const rows = (applications.data ?? []) as ApplicationRow[];
  const transactionRows = (transactions.data ?? []) as TransactionRow[];
  return {
    configured: true,
    signedIn: true,
    isAdmin: profile.data?.is_admin ?? false,
    displayName: profile.data?.display_name || auth.user.user_metadata.full_name || "teman",
    applications: rows.map((row) => ({
      id: row.id,
      company: (Array.isArray(row.companies) ? row.companies[0]?.name : row.companies?.name) ?? "—",
      position: row.position,
      stage: row.stage,
      employmentType: row.employment_type,
      appliedAt: row.applied_at,
      nextAction: row.next_action,
      nextActionAt: row.next_action_at,
      location: row.location,
      workMode: row.work_mode,
      source: row.source,
      compensationAmount: row.compensation_amount == null ? null : String(row.compensation_amount),
      payPeriod: row.pay_period,
      contractMonths: row.contract_months,
      contractStart: row.contract_start,
      contractEnd: row.contract_end,
      notes: row.notes,
    })),
    activities: (activities.data ?? []).map((row) => ({ id: row.id, applicationId: row.application_id, kind: row.kind, fromStage: row.from_stage, toStage: row.to_stage, body: row.body, createdAt: row.created_at })),
    transactions: transactionRows.map((row) => ({
      id: row.id,
      occurredAt: row.occurred_at,
      kind: row.kind,
      state: row.state,
      description: row.description,
      category: (Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name) ?? null,
      amountMinor: toMinor(row.amount),
      amount: String(row.amount),
      sourceAccountId: row.source_account_id,
      destinationAccountId: row.destination_account_id,
      categoryId: row.category_id,
    })),
    accounts: (accounts.data ?? []).map((row) => ({ id: row.id, name: row.name, kind: row.kind, balanceMinor: toMinor(row.balance), openingBalance: String(accountRecords.data?.find((record) => record.id === row.id)?.opening_balance ?? "0") })),
    categories: (categories.data ?? []).map((row) => ({ id: row.id, name: row.name, kind: row.kind })),
    reminders: (reminders.data ?? []).map((row) => ({ id: row.id, title: row.title, dueAt: row.due_at, state: row.state })),
    budgets: (budgets.data ?? []).map((row) => ({ id: row.id, category: row.category, limitMinor: toMinor(row.limit_amount), spentMinor: toMinor(row.spent_amount) })),
    goals: (goals.data ?? []).map((row) => ({ id: row.id, name: row.name, targetMinor: toMinor(row.target_amount), savedMinor: toMinor(row.saved_amount), targetDate: row.target_date })),
  };
});
