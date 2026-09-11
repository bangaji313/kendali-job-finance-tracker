import { describe, expect, it } from "vitest";
import { transactionInputSchema } from "../../src/lib/validation/schemas";

const accountA = "00000000-0000-4000-8000-000000000001";
const accountB = "00000000-0000-4000-8000-000000000002";

describe("transaction invariant", () => {
  it("requires two different accounts for transfer", () => {
    const result = transactionInputSchema.safeParse({ kind: "transfer", state: "posted", amount: "10.00", occurredAt: "2026-09-07", description: "Pindah dana", sourceAccountId: accountA, destinationAccountId: accountA });
    expect(result.success).toBe(false);
  });

  it("accepts a valid transfer", () => {
    const result = transactionInputSchema.safeParse({ kind: "transfer", state: "posted", amount: "10.00", occurredAt: "2026-09-07", description: "Pindah dana", sourceAccountId: accountA, destinationAccountId: accountB });
    expect(result.success).toBe(true);
  });
});
