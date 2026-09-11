const DECIMAL_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export function decimalToMinor(value: string): bigint {
  const normalized = value.trim().replace(/,/g, "");
  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error("Nominal harus berupa angka dengan maksimal dua desimal.");
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -minor : minor;
}

export function minorToDecimal(value: bigint): string {
  const negative = value < 0n;
  const unsigned = negative ? -value : value;
  const whole = unsigned / 100n;
  const fraction = (unsigned % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function formatIdr(value: bigint | null): string {
  if (value === null) return "—";
  const safe = Number(value / 100n);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function accountBalance(
  openingMinor: bigint,
  movements: Array<{ direction: "in" | "out"; amountMinor: bigint; state: "draft" | "posted" | "void" }>,
): bigint {
  return movements.reduce((balance, movement) => {
    if (movement.state !== "posted") return balance;
    return movement.direction === "in"
      ? balance + movement.amountMinor
      : balance - movement.amountMinor;
  }, openingMinor);
}

export function budgetUsage(postedExpenseMinor: bigint, limitMinor: bigint): number {
  if (limitMinor <= 0n) return 0;
  return Number((postedExpenseMinor * 10_000n) / limitMinor) / 100;
}
