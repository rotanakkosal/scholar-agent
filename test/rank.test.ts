import { describe, it, expect } from "vitest";
import { dedupePapers, rankTopK } from "../src/lib/pipeline/rank";
import { PaperSchema, type Paper } from "../src/lib/schemas/paper";

function paper(p: Partial<Paper> & { paperId: string; title: string }): Paper {
  return PaperSchema.parse(p);
}

describe("dedupePapers", () => {
  it("dedupes by DOI (case-insensitive) and merges sources", () => {
    const a = paper({ paperId: "1", title: "A", doi: "10.1/x", source: ["keyword"] });
    const b = paper({ paperId: "2", title: "B", doi: "10.1/X", source: ["citation"] });
    const out = dedupePapers([a, b]);
    expect(out).toHaveLength(1);
    expect([...out[0].source].sort()).toEqual(["citation", "keyword"]);
  });

  it("dedupes by paperId when there is no DOI", () => {
    const a = paper({ paperId: "same", title: "A", doi: null, source: ["keyword"] });
    const b = paper({ paperId: "same", title: "A (v2)", doi: null, source: ["citation"] });
    expect(dedupePapers([a, b])).toHaveLength(1);
  });

  it("prefers the duplicate that has an abstract", () => {
    const noAbs = paper({ paperId: "1", title: "A", doi: "10/x", abstract: null });
    const withAbs = paper({ paperId: "2", title: "A2", doi: "10/x", abstract: "real abstract" });
    const out = dedupePapers([noAbs, withAbs]);
    expect(out[0].abstract).toBe("real abstract");
  });
});

describe("rankTopK", () => {
  it("limits results to k", () => {
    const ps = [1, 2, 3, 4].map((i) => paper({ paperId: String(i), title: `T${i}`, s2RelevanceRank: i }));
    expect(rankTopK(ps, 2)).toHaveLength(2);
  });

  it("ranks a well-cited paper with an abstract above a bare one", () => {
    const strong = paper({
      paperId: "1",
      title: "Strong",
      abstract: "abs",
      citationCount: 100,
      s2RelevanceRank: 0,
    });
    const weak = paper({
      paperId: "2",
      title: "Weak",
      abstract: null,
      citationCount: 0,
      s2RelevanceRank: 5,
    });
    const out = rankTopK([weak, strong], 2);
    expect(out[0].paperId).toBe("1");
  });

  it("returns an empty array for no input", () => {
    expect(rankTopK([], 5)).toEqual([]);
  });
});
