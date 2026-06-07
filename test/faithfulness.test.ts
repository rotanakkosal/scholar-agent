import { describe, it, expect } from "vitest";
import { groundedness } from "../src/lib/eval/faithfulness";

describe("groundedness", () => {
  it("returns 0 when the abstract is null", () => {
    expect(groundedness("anything here at all", null)).toBe(0);
  });

  it("returns 0 for an empty summary", () => {
    expect(groundedness("", "some abstract text")).toBe(0);
  });

  it("is high when summary words appear in the abstract", () => {
    const abstract = "retrieval augmented generation combines parametric and nonparametric memory";
    const summary = "retrieval augmented generation combines parametric memory";
    expect(groundedness(summary, abstract)).toBeGreaterThan(0.8);
  });

  it("is low when the summary is unrelated to the abstract", () => {
    const abstract = "retrieval augmented generation combines parametric memory";
    const summary = "blockchain cryptocurrency mining quantum hardware";
    expect(groundedness(summary, abstract)).toBeLessThan(0.2);
  });

  it("always returns a value in [0,1]", () => {
    const v = groundedness("retrieval memory blockchain", "retrieval augmented memory");
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});
