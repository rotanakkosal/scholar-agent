import type { Paper } from "../../schemas/paper";

export const DISAGREEMENT_SYSTEM =
  "You compare the ABSTRACTS of several academic papers and identify CLEAR disagreements — " +
  "places where two or more papers state OPPOSING conclusions about the SAME question. " +
  "Be conservative:\n" +
  "- Only report a disagreement when the abstracts EXPLICITLY state contradictory findings.\n" +
  "- A mere difference in topic, scope, method, or emphasis is NOT a disagreement.\n" +
  "- Quote the EXACT sentence from each paper's abstract as evidence (do not paraphrase).\n" +
  "- Use ONLY the abstracts; do not infer beyond them.\n" +
  "If there are no clear disagreements, return an empty list. Respond with JSON only.";

export function disagreementUser(papers: Array<{ title: string; abstract: string | null }>): string {
  const blocks = papers
    .map((p, i) => `[${i + 1}] ${p.title}\nAbstract: ${p.abstract ?? "(none)"}`)
    .join("\n\n");
  return (
    `PAPERS:\n${blocks}\n\n` +
    `Return JSON: { "disagreements": [ { "topic": "the contested question", ` +
    `"conflicting": [ { "paperIndex": N, "quote": "exact sentence from that paper's abstract" }, ... ] } ] }`
  );
}

/** Re-export Paper type for callers that want the input shape. */
export type { Paper };
