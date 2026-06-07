import { tokenize } from "../util/text";

/** Common words ignored when measuring grounding (reduces trivial-match noise). */
const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "is", "are",
  "was", "were", "by", "that", "this", "it", "as", "at", "be", "from", "which", "we",
  "our", "their", "its", "can", "such", "than", "then", "these", "those", "via",
  "using", "used", "use", "based", "paper", "approach", "method", "methods", "model",
  "models", "results", "propose", "proposed", "introduce", "introduces", "study",
]);

/**
 * Abstract-grounding score in [0,1]: the fraction of meaningful summary tokens
 * that also appear in the source abstract. A model-independent, deterministic
 * proxy for faithfulness — it complements the LLM judge (which can be biased).
 *
 * Note: paraphrasing legitimately lowers lexical overlap, so this is REPORTED,
 * not used as a hard pass/fail gate.
 */
export function groundedness(summaryText: string, abstractText: string | null): number {
  if (!abstractText) return 0;
  const abstractTokens = new Set(tokenize(abstractText));
  const summaryTokens = tokenize(summaryText).filter((t) => t.length > 2 && !STOP.has(t));
  if (summaryTokens.length === 0) return 0;
  let hits = 0;
  for (const tok of summaryTokens) if (abstractTokens.has(tok)) hits++;
  return hits / summaryTokens.length;
}
