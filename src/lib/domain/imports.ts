import Papa from "papaparse";
import { createHash } from "node:crypto";
import { applicationInputSchema, transactionInputSchema } from "@/lib/validation/schemas";

export type ImportRow<T> = {
  row: number;
  value: T | null;
  fingerprint: string | null;
  errors: string[];
};

function fingerprint(parts: unknown[]): string {
  return createHash("sha256")
    .update(parts.map((part) => String(part ?? "").trim().toLocaleLowerCase("id-ID")).join("|"))
    .digest("hex");
}

function parseRows(csv: string): Array<Record<string, string>> {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });
  if (result.errors.length > 0) throw new Error(result.errors[0]?.message ?? "CSV tidak dapat dibaca.");
  return result.data;
}

export function validateApplicationCsv(csv: string): ImportRow<unknown>[] {
  return parseRows(csv).map((row, index) => {
    const parsed = applicationInputSchema.safeParse({
      companyName: row.company,
      position: row.position,
      stage: row.stage,
      employmentType: row.employment_type || "permanent",
      appliedAt: row.applied_at || null,
      location: row.location || null,
      source: row.source || null,
      nextAction: row.next_action || null,
      nextActionAt: row.next_action_at || null,
    });
    return parsed.success
      ? { row: index + 2, value: parsed.data, fingerprint: fingerprint([row.company, row.position, row.applied_at]), errors: [] }
      : { row: index + 2, value: null, fingerprint: null, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  });
}

export function validateTransactionCsv(csv: string): ImportRow<unknown>[] {
  return parseRows(csv).map((row, index) => {
    const parsed = transactionInputSchema.safeParse({
      kind: row.kind,
      state: row.state || "posted",
      amount: row.amount,
      occurredAt: row.occurred_at,
      description: row.description,
      sourceAccountId: row.source_account_id || null,
      destinationAccountId: row.destination_account_id || null,
      categoryId: row.category_id || null,
    });
    return parsed.success
      ? { row: index + 2, value: parsed.data, fingerprint: fingerprint([row.kind, row.amount, row.occurred_at, row.description]), errors: [] }
      : { row: index + 2, value: null, fingerprint: null, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  });
}
