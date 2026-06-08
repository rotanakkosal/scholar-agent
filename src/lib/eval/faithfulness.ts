import { tokenize } from "../util/text";

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "is", "are",
  "was", "were", "by", "that", "this", "it", "as", "at", "be", "from", "which", "we",
  "our", "their", "its", "can", "such", "than", "then", "these", "those", "via",
  "using", "used", "use", "based", "paper", "approach", "method", "methods", "model",
  "models", "results", "propose", "proposed", "introduce", "introduces", "study",
]);

export function groundedness(summaryText: string, abstractText: string | null): number {
  if (!abstractText) return 0;
  const abstractTokens = new Set(tokenize(abstractText));
  const summaryTokens = tokenize(summaryText).filter((t) => t.length > 2 && !STOP.has(t));
  if (summaryTokens.length === 0) return 0;
  let hits = 0;
  for (const tok of summaryTokens) if (abstractTokens.has(tok)) hits++;
  return hits / summaryTokens.length;
}
