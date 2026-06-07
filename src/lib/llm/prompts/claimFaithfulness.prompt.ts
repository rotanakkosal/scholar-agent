/**
 * Prompts for claim-level faithfulness (RAGAS / FActScore style): first decompose
 * the summary into atomic claims, then verify each against the abstract.
 */

export const DECOMPOSE_SYSTEM =
  "You break a paper summary into a list of SHORT, ATOMIC factual claims. " +
  "Each claim states exactly ONE fact, is self-contained (no pronouns like 'it'/'they'), " +
  "and uses ONLY information present in the summary — do not add anything. Respond with JSON only.";

export function decomposeUser(summaryText: string): string {
  return (
    `SUMMARY:\n${summaryText}\n\n` +
    `Return JSON: { "claims": ["claim 1", "claim 2", ...] }`
  );
}

export const VERIFY_SYSTEM =
  "You verify factual claims against a paper's ABSTRACT. For EACH claim, decide whether the " +
  "abstract SUPPORTS it — i.e. the claim can be directly inferred from the abstract. " +
  "Outside knowledge does NOT count as support. Keep the claims in the SAME order. " +
  "Give a brief reason before each verdict. Respond with JSON only.";

export function verifyUser(abstract: string, claims: string[]): string {
  const numbered = claims.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return (
    `ABSTRACT:\n${abstract}\n\nCLAIMS:\n${numbered}\n\n` +
    `Return JSON: { "verdicts": [ { "claim": "...", "reason": "...", "supported": true }, ... ] } ` +
    `— one entry per claim, in order.`
  );
}
