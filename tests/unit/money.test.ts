import { describe, expect, it } from "vitest";
import { accountBalance, budgetUsage, decimalToMinor, minorToDecimal } from "../../src/lib/domain/money";

describe("money domain", () => {
  it("converts decimal strings without floating point", () => {
    expect(decimalToMinor("1234567.89")).toBe(123456789n);
    expect(minorToDecimal(123456789n)).toBe("1234567.89");
  });

  it("ignores draft and void movements in account balance", () => {
    expect(accountBalance(10000n, [
      { direction: "in", amountMinor: 5000n, state: "posted" },
      { direction: "out", amountMinor: 1000n, state: "posted" },
      { direction: "out", amountMinor: 9000n, state: "draft" },
      { direction: "in", amountMinor: 9999n, state: "void" },
    ])).toBe(14000n);
  });

  it("calculates budget percentage with integer arithmetic", () => {
    expect(budgetUsage(8000n, 10000n)).toBe(80);
  });
});
