import { describe, it, expect } from "vitest";
import { pickTopCountries, type CountryData } from "./CountryBreakdownChart";

const make = (code: string, total: number): CountryData => ({
  country: code,
  flag: "🏳️",
  code,
  results: { a: total },
});

describe("pickTopCountries", () => {
  it("pins USA first and picks top 3 others by votes", () => {
    const result = pickTopCountries([
      make("GBR", 50),
      make("IND", 100),
      make("USA", 1),
      make("GER", 75),
      make("BRA", 25),
    ]);
    expect(result.map((c) => c.code)).toEqual(["USA", "IND", "GER", "GBR"]);
  });

  it("returns top 4 by votes when USA is missing", () => {
    const result = pickTopCountries([
      make("GBR", 50),
      make("IND", 100),
      make("GER", 75),
      make("BRA", 25),
      make("FRA", 10),
    ]);
    expect(result.map((c) => c.code)).toEqual(["IND", "GER", "GBR", "BRA"]);
    expect(result).toHaveLength(4);
  });

  it("keeps USA pinned even when USA has the fewest votes", () => {
    const result = pickTopCountries([
      make("USA", 0),
      make("IND", 500),
      make("GBR", 400),
      make("GER", 300),
      make("BRA", 200),
    ]);
    expect(result[0].code).toBe("USA");
    expect(result.slice(1).map((c) => c.code)).toEqual(["IND", "GBR", "GER"]);
  });

  it("handles tied votes deterministically by preserving input order on ties", () => {
    const result = pickTopCountries([
      make("USA", 10),
      make("GBR", 50),
      make("IND", 50),
      make("GER", 50),
      make("BRA", 50),
    ]);
    // USA pinned, then ties: stable sort preserves input order for ties
    expect(result.map((c) => c.code)).toEqual(["USA", "GBR", "IND", "GER"]);
  });

  it("returns fewer than 4 when not enough countries have data", () => {
    const result = pickTopCountries([make("USA", 10), make("GBR", 5)]);
    expect(result.map((c) => c.code)).toEqual(["USA", "GBR"]);
  });

  it("returns only USA when it is the only country", () => {
    const result = pickTopCountries([make("USA", 10)]);
    expect(result.map((c) => c.code)).toEqual(["USA"]);
  });

  it("returns empty array when given no countries", () => {
    expect(pickTopCountries([])).toEqual([]);
  });

  it("sums multi-option results when ranking", () => {
    const multi = (code: string, vals: number[]): CountryData => ({
      country: code,
      flag: "🏳️",
      code,
      results: Object.fromEntries(vals.map((v, i) => [`opt${i}`, v])),
    });
    const result = pickTopCountries([
      multi("GBR", [10, 10, 10]), // 30
      multi("IND", [50, 0, 0]),   // 50
      multi("GER", [20, 20, 20]), // 60
      multi("BRA", [5, 5, 5]),    // 15
    ]);
    expect(result.map((c) => c.code)).toEqual(["GER", "IND", "GBR", "BRA"]);
  });

  it("respects a custom max parameter", () => {
    const result = pickTopCountries(
      [
        make("USA", 1),
        make("IND", 100),
        make("GBR", 90),
        make("GER", 80),
        make("BRA", 70),
      ],
      2
    );
    expect(result.map((c) => c.code)).toEqual(["USA", "IND"]);
  });
});
