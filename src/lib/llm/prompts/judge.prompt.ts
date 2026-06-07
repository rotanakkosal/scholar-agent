import type { Paper } from "../../schemas/paper";
import type { SummaryDraft } from "../../schemas/summary";

export const JUDGE_SYSTEM =
  "You are a strict reviewer evaluating a SUMMARY of an academic paper against the paper's ABSTRACT. " +
  "Evaluate ONLY against the provided abstract — do not use outside knowledge and do not hallucinate.\n\n" +
  "First write a brief `assessment` (2-4 sentences: what the summary gets right and what is wrong). " +
  "Then, for EACH dimension, give a one-sentence `reason` FIRST and THEN an integer `score` (1-5) using these anchors:\n" +
  "- clarity (clear, concise, well written): 5 precise & unambiguous · 3 understandable but loose/wordy · 1 confusing or contradictory\n" +
  "- keyFinding (captures the paper's main contribution): 5 captures it exactly · 3 partial or peripheral · 1 misses or misstates it\n" +
  "- faithfulness (every claim supported by the abstract): 5 fully supported, no outside info · 3 mostly, but ≥1 vague/unverifiable claim · 1 clear hallucination or contradiction\n" +
  "- consistency (methodology and contribution agree): 5 fully consistent · 3 minor tension · 1 contradictory\n\n" +
  "List every claim NOT supported by the abstract in `unsupportedClaims`, and give brief actionable `feedback`. Respond with JSON only.";

export function judgeUser(paper: Paper, draft: SummaryDraft): string {
  return (
    `PAPER\nTitle: ${paper.title}\n` +
    `Abstract: ${paper.abstract ?? "(no abstract available)"}\n` +
    (paper.tldr ? `TLDR: ${paper.tldr}\n` : "") +
    `\nSUMMARY TO EVALUATE\nmethodology: ${draft.methodology}\ncontribution: ${draft.contribution}\n\n` +
    `Return JSON: { "assessment": "...", "scores": { ` +
    `"clarity": {"reason": "...", "score": N}, "keyFinding": {"reason": "...", "score": N}, ` +
    `"faithfulness": {"reason": "...", "score": N}, "consistency": {"reason": "...", "score": N} }, ` +
    `"feedback": "...", "unsupportedClaims": ["..."] }`
  );
}
