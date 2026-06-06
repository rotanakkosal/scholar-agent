import { config } from "../config";
import { callStructured, type LLMClient } from "../llm/index";
import { SUMMARY_SYSTEM, summaryUser, reviseUser } from "../llm/prompts/summary.prompt";
import { SummaryDraftSchema, type SummaryDraft } from "../schemas/summary";
import type { Paper } from "../schemas/paper";
import type { JudgeVerdict } from "../schemas/judge";

export interface SummaryAgentDeps {
  llm: LLMClient;
  model: string;
  signal?: AbortSignal;
}

/** First-pass extraction of methodology + contribution from a paper's abstract. */
export function summarize(paper: Paper, deps: SummaryAgentDeps): Promise<SummaryDraft> {
  return callStructured({
    client: deps.llm,
    model: deps.model,
    schema: SummaryDraftSchema,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM },
      { role: "user", content: summaryUser(paper) },
    ],
    temperature: config.pipeline.summaryTemperature,
    numCtx: config.llm.numCtx,
    maxTokens: config.pipeline.maxOutputTokens,
    signal: deps.signal,
  });
}

/** Revise a summary using the judge's feedback + list of unsupported claims. */
export function revise(
  paper: Paper,
  previous: SummaryDraft,
  verdict: JudgeVerdict,
  deps: SummaryAgentDeps,
): Promise<SummaryDraft> {
  return callStructured({
    client: deps.llm,
    model: deps.model,
    schema: SummaryDraftSchema,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM },
      { role: "user", content: reviseUser(paper, previous, verdict) },
    ],
    temperature: config.pipeline.summaryTemperature,
    numCtx: config.llm.numCtx,
    maxTokens: config.pipeline.maxOutputTokens,
    signal: deps.signal,
  });
}
