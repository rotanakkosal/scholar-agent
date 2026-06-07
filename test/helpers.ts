import type { ChatOptions, LLMClient } from "../src/lib/llm/LLMClient";

/** A fake LLM client whose responses are scripted by `responder` (offline tests). */
export function fakeClient(responder: (opts: ChatOptions, call: number) => string): LLMClient {
  let call = 0;
  return {
    provider: "fake",
    async chat(opts: ChatOptions): Promise<string> {
      return responder(opts, call++);
    },
    async listModels(): Promise<string[]> {
      return ["fake"];
    },
  };
}

/** Build a JudgeDraft JSON string with a uniform score across all dimensions. */
export function judgeJson(score: number, unsupported: string[] = []): string {
  const dim = (s: number) => ({ reason: "reason", score: s });
  return JSON.stringify({
    assessment: "overall assessment",
    scores: {
      clarity: dim(score),
      keyFinding: dim(score),
      faithfulness: dim(score),
      consistency: dim(score),
    },
    feedback: "feedback",
    unsupportedClaims: unsupported,
  });
}

export const summaryJson = JSON.stringify({
  methodology: "a method",
  contribution: "a contribution",
});
