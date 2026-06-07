import { describe, it, expect } from "vitest";
import { refinePaper } from "../src/lib/pipeline/refineLoop";
import { PaperSchema } from "../src/lib/schemas/paper";
import { fakeClient, summaryJson, judgeJson } from "./helpers";

const paper = PaperSchema.parse({
  paperId: "p1",
  title: "Test Paper",
  abstract: "retrieval augmented generation parametric memory",
});

const summaryClient = fakeClient(() => summaryJson);
const base = { summaryClient, summaryModel: "s", judgeModel: "j", maxRounds: 2 } as const;

describe("refinePaper (Summary → Judge → Refine loop)", () => {
  it("passes on round 1 when the judge approves", async () => {
    const judgeClient = fakeClient(() => judgeJson(5));
    const res = await refinePaper(paper, { ...base, judgeClient });
    expect(res.rounds).toBe(1);
    expect(res.verdict.pass).toBe(true);
    expect(res.verdict.overall).toBe(5);
  });

  it("refines then passes by round 2", async () => {
    const judgeClient = fakeClient((_o, call) => judgeJson(call === 0 ? 3 : 5));
    const res = await refinePaper(paper, { ...base, judgeClient });
    expect(res.rounds).toBe(2);
    expect(res.verdict.pass).toBe(true);
  });

  it("keeps the BEST draft when a revision regresses and never passes", async () => {
    // round 1 overall 3, round 2 overall 2 → must return the round-1 verdict (3)
    const judgeClient = fakeClient((_o, call) => judgeJson(call === 0 ? 3 : 2));
    const res = await refinePaper(paper, { ...base, judgeClient });
    expect(res.rounds).toBe(2);
    expect(res.verdict.pass).toBe(false);
    expect(res.verdict.overall).toBe(3);
  });

  it("computes a faithfulness overlap on the verdict", async () => {
    const judgeClient = fakeClient(() => judgeJson(5));
    const res = await refinePaper(paper, { ...base, judgeClient });
    expect(res.verdict.faithfulnessOverlap).toBeGreaterThanOrEqual(0);
    expect(res.verdict.faithfulnessOverlap).toBeLessThanOrEqual(1);
  });
});
