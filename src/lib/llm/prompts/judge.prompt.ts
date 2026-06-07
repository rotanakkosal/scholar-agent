import type { Paper } from "../../schemas/paper";
import type { SummaryDraft } from "../../schemas/summary";

export const JUDGE_SYSTEM =
  "You are a DEMANDING, critical peer reviewer evaluating a SUMMARY of an academic paper against the paper's ABSTRACT. " +
  "Evaluate ONLY against the provided abstract — no outside knowledge, no hallucination. " +
  "Judge content and faithfulness only; never reward length or fluent wording.\n\n" +
  "First, in `assessment`, state at least ONE concrete weakness of the summary (or write \"no weaknesses found\"). " +
  "Then, for EACH dimension, give a one-sentence `reason` FIRST and THEN an integer `score` (1-5). " +
  "Be strict: reserve 5 for a flawless field; a solid but improvable summary scores 3-4. Do not inflate scores.\n" +
  "Anchors:\n" +
  "- clarity (clear, concise, well written): 5 precise & unambiguous · 4 clear, minor wordiness · 3 understandable but loose · 2 vague/awkward · 1 confusing\n" +
  "- keyFinding (captures the paper's main contribution): 5 captures it exactly · 4 mostly, minor omission · 3 partial or peripheral · 2 largely misses it · 1 wrong\n" +
  "- faithfulness (every claim supported by the abstract): 5 every claim supported · 4 supported, one slightly over-stated · 3 mostly, but ≥1 vague claim · 2 contains an unsupported claim · 1 clear hallucination\n" +
  "- consistency (methodology and contribution agree): 5 fully consistent · 4 minor tension · 3 noticeable tension · 2 partly contradictory · 1 contradictory\n\n" +
  "List every claim NOT supported by the abstract in `unsupportedClaims`, and give actionable `feedback`. Respond with JSON only.";

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
