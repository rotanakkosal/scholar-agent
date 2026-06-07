import type { Paper } from "../../schemas/paper";
import type { SummaryDraft } from "../../schemas/summary";
import type { JudgeVerdict } from "../../schemas/judge";

export const SUMMARY_SYSTEM =
  "You are a meticulous research assistant extracting structured information from an academic paper. " +
  "You are given ONLY the paper's title and abstract (and possibly a one-line TLDR). Extract:\n" +
  "- methodology: the methods / approach / techniques the paper uses.\n" +
  "- contribution: the paper's main contribution or key finding.\n\n" +
  "Rules:\n" +
  "- Use ONLY the provided text. Do NOT use outside knowledge or invent details.\n" +
  '- If the abstract does not state something, write exactly: "Not stated in abstract".\n' +
  "- Be concise: 1-3 sentences per field. Respond with JSON only.";

function paperBlock(paper: Paper): string {
  const parts = [`Title: ${paper.title}`];
  if (paper.year) parts.push(`Year: ${paper.year}`);
  parts.push(`Abstract: ${paper.abstract ?? "(no abstract available)"}`);
  if (paper.tldr) parts.push(`TLDR: ${paper.tldr}`);
  return parts.join("\n");
}

export function summaryUser(paper: Paper): string {
  return `${paperBlock(paper)}\n\nReturn JSON: { "methodology": "...", "contribution": "..." }`;
}

export function reviseUser(paper: Paper, previous: SummaryDraft, verdict: JudgeVerdict): string {
  const claims = verdict.unsupportedClaims.length
    ? "\nClaims NOT supported by the abstract (remove or rephrase each so the abstract supports it):\n" +
      verdict.unsupportedClaims.map((c) => `- ${c}`).join("\n")
    : "";
  return (
    `${paperBlock(paper)}\n\n` +
    `Your previous summary:\n  methodology: ${previous.methodology}\n  contribution: ${previous.contribution}\n\n` +
    `A reviewer found issues:\n${verdict.feedback}${claims}\n\n` +
    `Revise carefully: KEEP everything that is already correct and supported by the abstract, and change ` +
    `ONLY what is needed to fix the issues above. Do not add any new claim that the abstract does not state ` +
    `(write exactly "Not stated in abstract" if a field is unsupported). ` +
    `Return JSON: { "methodology": "...", "contribution": "..." }`
  );
}
