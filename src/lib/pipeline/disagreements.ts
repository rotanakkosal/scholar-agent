import { z } from "zod";
import { config } from "../config";
import { callStructured, type LLMClient } from "../llm/index";
import { DISAGREEMENT_SYSTEM, disagreementUser } from "../llm/prompts/disagreement.prompt";
import type { Paper } from "../schemas/paper";
import type { Disagreement, DisagreementSide } from "../schemas/disagreement";

/** What the model returns — references papers by 1-based index. */
const LLMReportSchema = z.object({
  disagreements: z
    .array(
      z.object({
        topic: z.string(),
        conflicting: z
          .array(z.object({ paperIndex: z.number().int(), quote: z.string() }))
          .min(2),
      }),
    )
    .default([]),
});

export interface DisagreementDeps {
  llm: LLMClient;
  model: string;
  signal?: AbortSignal;
}

/**
 * Surface CANDIDATE cross-paper disagreements visible in the abstracts, with
 * quoted evidence. Conservative by design — returns [] when nothing clearly
 * conflicts. Abstract-only, so results are hints for a human to verify.
 */
export async function findDisagreements(
  papers: Paper[],
  deps: DisagreementDeps,
): Promise<Disagreement[]> {
  const withAbstracts = papers.filter((p) => p.abstract);
  if (withAbstracts.length < 2) return [];

  const report = await callStructured({
    client: deps.llm,
    model: deps.model,
    schema: LLMReportSchema,
    messages: [
      { role: "system", content: DISAGREEMENT_SYSTEM },
      { role: "user", content: disagreementUser(withAbstracts) },
    ],
    temperature: 0,
    numCtx: config.llm.numCtx,
    maxTokens: config.pipeline.maxOutputTokens,
    signal: deps.signal,
  });

  const out: Disagreement[] = [];
  for (const d of report.disagreements) {
    const sides: DisagreementSide[] = [];
    for (const c of d.conflicting) {
      const paper = withAbstracts[c.paperIndex - 1];
      if (paper) sides.push({ paperId: paper.paperId, title: paper.title, quote: c.quote });
    }
    // Keep only disagreements that still reference >= 2 distinct papers.
    if (new Set(sides.map((s) => s.paperId)).size >= 2) {
      out.push({ topic: d.topic, sides });
    }
  }
  return out;
}
