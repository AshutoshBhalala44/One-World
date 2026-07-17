import { describe, it, expect } from "vitest";
import { searchCountries, suggestCountries } from "./CountryCodePicker";

// Simulates a user typing a query character by character and measures
// the time to compute search + suggestion results for each keystroke.
// Frame budget: 16ms per keystroke (60fps). We assert a comfortable
// margin so tests remain stable on slower CI machines.
const KEYSTROKE_BUDGET_MS = 16;
const AVG_BUDGET_MS = 4;

const measureTyping = (query: string) => {
  const perKeystroke: number[] = [];
  let partial = "";
  for (const ch of query) {
    partial += ch;
    const start = performance.now();
    const results = searchCountries(partial);
    if (results.length === 0) suggestCountries(partial);
    perKeystroke.push(performance.now() - start);
  }
  const max = Math.max(...perKeystroke);
  const avg = perKeystroke.reduce((a, b) => a + b, 0) / perKeystroke.length;
  return { perKeystroke, max, avg };
};

describe("CountryCodePicker search performance", () => {
  it("handles a rapid full-name query within frame budget", () => {
    const { max, avg } = measureTyping("united states");
    expect(max).toBeLessThan(KEYSTROKE_BUDGET_MS);
    expect(avg).toBeLessThan(AVG_BUDGET_MS);
  });

  it("handles a rapid dial-code query within frame budget", () => {
    const { max, avg } = measureTyping("+1234");
    expect(max).toBeLessThan(KEYSTROKE_BUDGET_MS);
    expect(avg).toBeLessThan(AVG_BUDGET_MS);
  });

  it("handles a typo query that triggers fuzzy suggestions within budget", () => {
    // no exact match => suggestCountries runs each keystroke (worst case)
    const { max, avg } = measureTyping("untied statez");
    expect(max).toBeLessThan(KEYSTROKE_BUDGET_MS * 2); // fuzzy is heavier
    expect(avg).toBeLessThan(AVG_BUDGET_MS * 2);
  });

  it("sustains 200 rapid mixed keystrokes without spikes", () => {
    const queries = [
      "u", "us", "usa",
      "de", "deu", "deutsch", "deutschland",
      "+4", "+49",
      "hol", "holl", "holland",
      "cze", "czec", "czechia",
      "xk", "kos", "koso", "kosovo",
      "burma", "myanmar",
      "cote", "cote d", "cote divoire",
    ];
    const timings: number[] = [];
    // ~10 loops * 22 queries ≈ 220 keystroke batches
    for (let i = 0; i < 10; i++) {
      for (const q of queries) {
        const start = performance.now();
        const results = searchCountries(q);
        if (results.length === 0) suggestCountries(q);
        timings.push(performance.now() - start);
      }
    }
    const max = Math.max(...timings);
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    // No individual query should exceed a single frame
    expect(max).toBeLessThan(KEYSTROKE_BUDGET_MS);
    expect(avg).toBeLessThan(AVG_BUDGET_MS);
  });

  it("degrades gracefully on pathological long input", () => {
    const long = "z".repeat(500);
    const start = performance.now();
    const results = searchCountries(long);
    if (results.length === 0) suggestCountries(long);
    const elapsed = performance.now() - start;
    // Even worst-case single call should stay well under 50ms
    expect(elapsed).toBeLessThan(50);
  });
});
