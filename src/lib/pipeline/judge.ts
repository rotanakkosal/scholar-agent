import { config } from "../config";
import { callStructured, type LLMClient } from "../llm/index";
import { JUDGE_SYSTEM, judgeUser } from "../llm/prompts/judge.prompt";
import { JudgeDraftSchema, type JudgeVerdict } from "../schemas/judge";
import type { Paper } from "../schemas/paper";
import type { SummaryDraft } from "../schemas/summary";
import { groundedness } from "../eval/faithfulness";

export interface JudgeDeps {
  llm: LLMClient;
  model: string;
  signal?: AbortSignal;
}

/**
 * LLM-as-Judge: scores a summary against the rubric, then `pass` and `overall`
 * are computed IN CODE from the scores (the model never decides pass/fail).
 * Faithfulness is gated hardest: it must clear the threshold AND have no
 * unsupported claims.
 */
export async function judge(paper: Paper, draft: SummaryDraft, deps: JudgeDeps): Promise<JudgeVerdict> {
  const result = await callStructured({
    client: deps.llm,
    model: deps.model,
    schema: JudgeDraftSchema,
    messages: [
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: judgeUser(paper, draft) },
    ],
    temperature: config.pipeline.judgeTemperature,
    seed: config.pipeline.judgeSeed,
    numCtx: config.llm.numCtx,
    maxTokens: config.pipeline.maxOutputTokens,
    signal: deps.signal,
  });

  const s = result.scores;
  const overall = (s.clarity.score + s.keyFinding.score + s.faithfulness.score + s.consistency.score) / 4;
  const t = config.rubric.thresholds;
  const pass =
    s.clarity.score >= t.clarity &&
    s.keyFinding.score >= t.keyFinding &&
    s.consistency.score >= t.consistency &&
    s.faithfulness.score >= t.faithfulness &&
    result.unsupportedClaims.length === 0 &&
    overall >= t.overall;

  const faithfulnessOverlap = groundedness(
    `${draft.methodology} ${draft.contribution}`,
    paper.abstract,
  );

  return { ...result, overall, pass, faithfulnessOverlap };
}
