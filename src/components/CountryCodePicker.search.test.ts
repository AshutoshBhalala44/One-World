import { describe, it, expect } from "vitest";
import {
  countries,
  searchCountries,
  suggestCountries,
} from "./CountryCodePicker";

// Countries that share a dial code with others (e.g. +1 US/CA, +7 RU/KZ).
// For these, an exact dial-code query returns multiple matches — the country
// must simply be included in the result set.
const findsSelf = (code: string, results: { code: string }[]) =>
  results.some((r) => r.code === code);

describe("CountryCodePicker search — every country is discoverable", () => {
  it("has a non-trivial number of countries", () => {
    // Guard against accidental regressions that gut the list
    expect(countries.length).toBeGreaterThanOrEqual(190);
  });

  it("has unique ISO codes", () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  describe.each(countries)("$name ($code, $dial)", (country) => {
    it("is findable by full name", () => {
      const results = searchCountries(country.name);
      expect(findsSelf(country.code, results)).toBe(true);
    });

    it("is findable by lowercase name", () => {
      const results = searchCountries(country.name.toLowerCase());
      expect(findsSelf(country.code, results)).toBe(true);
    });

    it("is findable by ISO 2-letter code", () => {
      const results = searchCountries(country.code);
      expect(findsSelf(country.code, results)).toBe(true);
    });

    it("is findable by dial code", () => {
      const results = searchCountries(country.dial);
      expect(findsSelf(country.code, results)).toBe(true);
    });

    it("is findable by dial code without the leading +", () => {
      const results = searchCountries(country.dial.replace(/[^0-9]/g, ""));
      expect(findsSelf(country.code, results)).toBe(true);
    });
  });
});

describe("CountryCodePicker search — normalization", () => {
  it("ignores accents/diacritics", () => {
    // "Côte d'Ivoire" should be findable via "cote divoire"
    const results = searchCountries("cote divoire");
    expect(findsSelf("CI", results)).toBe(true);
  });

  it("ignores punctuation", () => {
    const results = searchCountries("st. lucia");
    expect(findsSelf("LC", results)).toBe(true);
  });

  it("supports multi-word partial matches", () => {
    const results = searchCountries("united king");
    expect(findsSelf("GB", results)).toBe(true);
  });

  it("recognizes common aliases (UK)", () => {
    expect(findsSelf("GB", searchCountries("UK"))).toBe(true);
    expect(findsSelf("GB", searchCountries("Britain"))).toBe(true);
  });

  it("recognizes common aliases (USA/America)", () => {
    expect(findsSelf("US", searchCountries("USA"))).toBe(true);
    expect(findsSelf("US", searchCountries("America"))).toBe(true);
  });

  it("recognizes historical/alternative names", () => {
    expect(findsSelf("MM", searchCountries("Burma"))).toBe(true);
    expect(findsSelf("CZ", searchCountries("Czechia"))).toBe(true);
    expect(findsSelf("NL", searchCountries("Holland"))).toBe(true);
  });

  it("returns full list for empty query", () => {
    expect(searchCountries("").length).toBe(countries.length);
    expect(searchCountries("   ").length).toBe(countries.length);
  });
});

describe("CountryCodePicker — suggestions on typo", () => {
  it("suggests close matches for misspellings", () => {
    const suggestions = suggestCountries("Untied States");
    expect(suggestions.some((c) => c.code === "US")).toBe(true);
  });

  it("returns empty array for empty query", () => {
    expect(suggestCountries("")).toEqual([]);
  });

  it("caps suggestions at the requested limit", () => {
    expect(suggestCountries("x", 3).length).toBeLessThanOrEqual(3);
  });
});
