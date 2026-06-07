import { describe, it, expect } from "vitest";
import { assessClaimFaithfulness } from "../src/lib/pipeline/claimFaithfulness";
import { fakeClient } from "./helpers";

describe("assessClaimFaithfulness", () => {
  it("decomposes, verifies, and scores supported/total", async () => {
    const client = fakeClient((_opts, call) => {
      if (call === 0) {
        return JSON.stringify({ claims: ["A uses method X", "A achieves 99% accuracy"] });
      }
      return JSON.stringify({
        verdicts: [
          { claim: "A uses method X", reason: "stated in abstract", supported: true },
          { claim: "A achieves 99% accuracy", reason: "not in abstract", supported: false },
        ],
      });
    });

    const cf = await assessClaimFaithfulness(
      { methodology: "uses method X", contribution: "achieves results" },
      "Paper A uses method X to improve results.",
      { llm: client, model: "fake" },
    );

    expect(cf).not.toBeNull();
    expect(cf!.total).toBe(2);
    expect(cf!.supported).toBe(1);
    expect(cf!.score).toBe(0.5);
    expect(cf!.claims[1].supported).toBe(false);
  });

  it("returns null when there is no abstract (nothing to ground against)", async () => {
    const client = fakeClient(() => "{}");
    const cf = await assessClaimFaithfulness(
      { methodology: "x", contribution: "y" },
      null,
      { llm: client, model: "fake" },
    );
    expect(cf).toBeNull();
  });

  it("treats a missing verdict as unsupported (conservative)", async () => {
    const client = fakeClient((_opts, call) => {
      if (call === 0) return JSON.stringify({ claims: ["c1", "c2"] });
      // Only one verdict returned for two claims.
      return JSON.stringify({ verdicts: [{ claim: "c1", reason: "ok", supported: true }] });
    });

    const cf = await assessClaimFaithfulness(
      { methodology: "m", contribution: "c" },
      "an abstract",
      { llm: client, model: "fake" },
    );

    expect(cf!.total).toBe(2);
    expect(cf!.supported).toBe(1);
    expect(cf!.claims[1].supported).toBe(false);
  });
});
