import { describe, expect, it } from "vitest";

type Oklch = [number, number, number];

function luminance([lightness, chroma, hue]: Oklch) {
  const radians = hue * Math.PI / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3);
  const red = Math.min(1, Math.max(0, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
  const green = Math.min(1, Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s));
  const blue = Math.min(1, Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratio(first: Oklch, second: Oklch) {
  const [lighter, darker] = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

const paper: Oklch = [0.972, 0.008, 55];
const paperMuted: Oklch = [0.944, 0.012, 55];
const ink: Oklch = [0.18, 0.018, 42];
const muted: Oklch = [0.46, 0.018, 45];
const accent: Oklch = [0.50, 0.19, 33];
const accentInk: Oklch = [0.98, 0.008, 55];
const focus: Oklch = [0.48, 0.20, 28];
const ruleStrong: Oklch = [0.58, 0.018, 55];

describe("Hallmark contrast tokens", () => {
  it.each([
    ["ink / paper", ink, paper, 4.5],
    ["muted / paper", muted, paper, 4.5],
    ["muted / paper-muted", muted, paperMuted, 4.5],
    ["accent / paper", accent, paper, 4.5],
    ["accent-ink / accent", accentInk, accent, 4.5],
    ["focus / paper", focus, paper, 3],
    ["control boundary / paper", ruleStrong, paper, 3],
  ] as Array<[string, Oklch, Oklch, number]>) ("passes %s", (_label, foreground, background, minimum) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});
