import type { Paper } from "../../schemas/paper";
import type { SummaryDraft } from "../../schemas/summary";

export const JUDGE_SYSTEM =
  "You are a strict reviewer evaluating a SUMMARY of an academic paper against the paper's ABSTRACT. " +
  "Score each rubric dimension from 1 (poor) to 5 (excellent):\n" +
  "- clarity: is the summary clear, concise, and well written?\n" +
  "- keyFinding: does it capture the paper's key finding / contribution?\n" +
  "- faithfulness: is EVERY claim supported by the abstract? (no hallucination, no outside knowledge)\n" +
  "- consistency: are the methodology and contribution mutually consistent and non-contradictory?\n\n" +
  "List every claim in the summary NOT supported by the abstract in `unsupportedClaims`. " +
  "Give brief, actionable `feedback`. Evaluate ONLY against the provided abstract. Respond with JSON only.";

export function judgeUser(paper: Paper, draft: SummaryDraft): string {
  return (
    `PAPER\nTitle: ${paper.title}\n` +
    `Abstract: ${paper.abstract ?? "(no abstract available)"}\n` +
    (paper.tldr ? `TLDR: ${paper.tldr}\n` : "") +
    `\nSUMMARY TO EVALUATE\nmethodology: ${draft.methodology}\ncontribution: ${draft.contribution}\n\n` +
    `Return JSON: { "scores": { "clarity": {"score": N, "reason": "..."}, ` +
    `"keyFinding": {"score": N, "reason": "..."}, "faithfulness": {"score": N, "reason": "..."}, ` +
    `"consistency": {"score": N, "reason": "..."} }, "feedback": "...", "unsupportedClaims": ["..."] }`
  );
}
