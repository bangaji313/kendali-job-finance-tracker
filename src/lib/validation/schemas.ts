import { z } from "zod";
import {
  applicationStages,
  employmentTypes,
  transactionKinds,
  transactionStates,
} from "@/lib/domain/types";

const id = z.string().uuid();
const date = z.iso.date();
const money = z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Gunakan angka dengan maksimal dua desimal.");

export const applicationInputSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  position: z.string().trim().min(1).max(160),
  stage: z.enum(applicationStages),
  employmentType: z.enum(employmentTypes).default("permanent"),
  appliedAt: date.nullable().default(null),
  location: z.string().trim().max(160).nullable().default(null),
  workMode: z.enum(["onsite", "hybrid", "remote"]).nullable().default(null),
  source: z.string().trim().max(160).nullable().default(null),
  compensationAmount: money.nullable().default(null),
  currency: z.literal("IDR").default("IDR"),
  payPeriod: z.enum(["hourly", "daily", "monthly", "yearly"]).nullable().default(null),
  contractMonths: z.coerce.number().int().positive().max(600).nullable().default(null),
  contractStart: date.nullable().default(null),
  contractEnd: date.nullable().default(null),
  notes: z.string().trim().max(10_000).nullable().default(null),
  nextAction: z.string().trim().max(500).nullable().default(null),
  nextActionAt: z.iso.datetime({ offset: true }).nullable().default(null),
});

export const transactionInputSchema = z
  .object({
    kind: z.enum(transactionKinds),
    state: z.enum(transactionStates).default("posted"),
    amount: money,
    occurredAt: date,
    description: z.string().trim().min(1).max(240),
    sourceAccountId: id.nullable().default(null),
    destinationAccountId: id.nullable().default(null),
    categoryId: id.nullable().default(null),
    currency: z.literal("IDR").default("IDR"),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "income" && (!value.destinationAccountId || value.sourceAccountId)) {
      ctx.addIssue({ code: "custom", path: ["destinationAccountId"], message: "Pemasukan membutuhkan satu akun tujuan." });
    }
    if (value.kind === "expense" && (!value.sourceAccountId || value.destinationAccountId)) {
      ctx.addIssue({ code: "custom", path: ["sourceAccountId"], message: "Pengeluaran membutuhkan satu akun sumber." });
    }
    if (
      value.kind === "transfer" &&
      (!value.sourceAccountId || !value.destinationAccountId || value.sourceAccountId === value.destinationAccountId)
    ) {
      ctx.addIssue({ code: "custom", path: ["destinationAccountId"], message: "Transfer membutuhkan dua akun yang berbeda." });
    }
  });

export const csvUploadSchema = z.object({
  csv: z.string().min(1).max(5_000_000),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.url().max(2_048),
  expirationTime: z.number().nullable(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type TransactionInput = z.infer<typeof transactionInputSchema>;
