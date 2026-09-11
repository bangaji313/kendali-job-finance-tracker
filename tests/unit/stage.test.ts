import { describe, expect, it } from "vitest";
import { applicationStages, stageLabels, type ApplicationStage } from "../../src/lib/domain/types";
import { validateApplicationCsv } from "../../src/lib/domain/imports";

// ---------------------------------------------------------------------------
// Stage transition
// ---------------------------------------------------------------------------
describe("stage ordering", () => {
  it("applicationStages contains all required stages in pipeline order", () => {
    const required: ApplicationStage[] = [
      "saved", "applied", "screening", "assessment",
      "interview", "offer", "accepted", "rejected", "withdrawn", "archived",
    ];
    expect(applicationStages).toEqual(required);
  });

  it("stageLabels has an id-ID label for every stage", () => {
    for (const stage of applicationStages) {
      expect(stageLabels[stage]).toBeTruthy();
      expect(typeof stageLabels[stage]).toBe("string");
    }
  });

  it("terminal stages are at the end of the array", () => {
    const terminal: ApplicationStage[] = ["accepted", "rejected", "withdrawn", "archived"];
    const lastFour = applicationStages.slice(-4);
    expect(lastFour).toEqual(terminal);
  });
});

// ---------------------------------------------------------------------------
// Locale / date formatting
// ---------------------------------------------------------------------------
describe("locale and date formatting (id-ID, Asia/Jakarta)", () => {
  const tz = "Asia/Jakarta";
  const locale = "id-ID";

  it("formats a known date to id-ID medium style", () => {
    const date = new Date("2026-09-07T00:00:00Z");
    const formatted = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: tz }).format(date);
    // id-ID medium: "7 Sep 2026"
    expect(formatted).toMatch(/7/);
    expect(formatted).toMatch(/2026/);
  });

  it("formats IDR currency with no fraction digits", () => {
    const amount = 1_500_000;
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
    expect(formatted).toMatch(/1[.,]500[.,]000/); // id-ID uses dot or comma as thousand separator
    expect(formatted).toMatch(/Rp/);
  });

  it("Asia/Jakarta is UTC+7 offset (non-DST)", () => {
    const date = new Date("2026-09-07T00:00:00Z");
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(date), 10);
    expect(hour).toBe(7); // midnight UTC = 07:00 WIB
  });

  it("toISOString date slice gives YYYY-MM-DD without TZ drift for UTC dates", () => {
    const iso = new Date("2026-09-07T00:00:00Z").toISOString();
    expect(iso.slice(0, 10)).toBe("2026-09-07");
  });
});

// ---------------------------------------------------------------------------
// CSV fingerprint — duplicate detection
// ---------------------------------------------------------------------------
describe("CSV fingerprint deduplication", () => {
  const csvWithDuplicate =
    "company,position,stage,employment_type,applied_at\n" +
    "PT Satu,Engineer,applied,permanent,2026-09-07\n" +
    "PT Satu,Engineer,applied,permanent,2026-09-07"; // exact duplicate

  it("two identical rows produce the same fingerprint", () => {
    const rows = validateApplicationCsv(csvWithDuplicate);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.fingerprint).not.toBeNull();
    expect(rows[1]?.fingerprint).not.toBeNull();
    expect(rows[0]?.fingerprint).toBe(rows[1]?.fingerprint);
  });

  it("different companies produce different fingerprints", () => {
    const csv =
      "company,position,stage,employment_type,applied_at\n" +
      "PT Satu,Engineer,applied,permanent,2026-09-07\n" +
      "PT Dua,Engineer,applied,permanent,2026-09-07";
    const rows = validateApplicationCsv(csv);
    expect(rows[0]?.fingerprint).not.toBe(rows[1]?.fingerprint);
  });

  it("fingerprint is a 64-char hex string", () => {
    const csv = "company,position,stage,employment_type,applied_at\nPT Tiga,Dev,applied,permanent,2026-09-07";
    const rows = validateApplicationCsv(csv);
    expect(rows[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
});
