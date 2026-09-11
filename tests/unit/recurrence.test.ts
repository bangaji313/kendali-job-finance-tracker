import { describe, expect, it } from "vitest";
import { nextOccurrence, occurrenceKey } from "../../src/lib/domain/recurrence";

describe("recurrence", () => {
  it("clamps monthly dates to the last day", () => {
    expect(nextOccurrence(new Date("2026-01-31T00:00:00Z"), "monthly").toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("makes deterministic occurrence keys", () => {
    expect(occurrenceKey("rule-1", new Date("2026-09-07T12:30:00Z"))).toBe("rule-1:2026-09-07");
  });
});
