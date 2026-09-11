import { describe, expect, it } from "vitest";
import { validateApplicationCsv } from "../../src/lib/domain/imports";

describe("application CSV", () => {
  it("returns row-specific errors", () => {
    const rows = validateApplicationCsv("company,position,stage,employment_type,applied_at\nPT Satu,Engineer,applied,permanent,2026-09-07\nPT Dua,,unknown,permanent,2026-99-01");
    expect(rows[0]?.errors).toHaveLength(0);
    expect(rows[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[1]?.errors.length).toBeGreaterThan(0);
  });
});
