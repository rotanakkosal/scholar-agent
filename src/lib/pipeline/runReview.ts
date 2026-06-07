import { config } from "../config";
import { createLLMClient, type LLMClient } from "../llm/index";
import { SemanticScholarClient } from "../clients/SemanticScholarClient";
import { JobParamsSchema, type JobParams } from "../schemas/job";
import type { PaperSummary } from "../schemas/summary";
import type { JudgeVerdict } from "../schemas/judge";
import type { ProgressEmitter } from "../schemas/events";
import { searchAgent } from "./searchAgent";
import { rankTopK } from "./rank";
import { refinePaper } from "./refineLoop";
import { assessClaimFaithfulness } from "./claimFaithfulness";
import { findDisagreements } from "./disagreements";

export interface RunReviewDeps {
  /** Worker/summary client (defaults to the configured LLM endpoint). */
  llm?: LLMClient;
  /** Judge client (defaults to the configured judge endpoint — e.g. Gemma). */
  judgeLlm?: LLMClient;
  s2?: SemanticScholarClient;
  emit?: ProgressEmitter;
  signal?: AbortSignal;
}

/** A results row plus the judge's final verdict (handy for the UI / metrics). */
export interface ReviewRow {
  summary: PaperSummary;
  verdict: JudgeVerdict;
}

/**
 * Full pipeline: Search → rank Top-K → (per paper) Summary↔Judge refine loop →
 * assemble the final results table. Emits progress events throughout.
 */
export async function runReview(rawParams: JobParams, deps: RunReviewDeps = {}): Promise<ReviewRow[]> {
  const params = JobParamsSchema.parse(rawParams);
  const llm = deps.llm ?? createLLMClient();
  const judgeLlm =
    deps.judgeLlm ??
    createLLMClient({
      provider: config.judge.provider,
      baseUrl: config.judge.baseUrl,
      apiKey: config.judge.apiKey,
      disableThinking: config.judge.disableThinking,
    });
  const s2 = deps.s2 ?? new SemanticScholarClient();
  const emit = deps.emit;
  const summaryModel = params.summaryModel ?? config.llm.summaryModel;
  const judgeModel = params.judgeModel ?? config.judge.model;

  // --- Search Phase ---
  emit?.({ type: "phase", phase: "search", state: "start" });
  const candidates = await searchAgent({
    query: params.query,
    strategies: params.strategies,
    topKHint: params.topK,
    yearFrom: params.yearFrom,
    model: summaryModel,
    llm,
    s2,
    emit,
    signal: deps.signal,
  });
  const topK = rankTopK(candidates, params.topK);
  emit?.({ type: "papers_found", found: candidates.length, afterDedup: topK.length });
  emit?.({ type: "phase", phase: "search", state: "end" });

  // --- Evaluation Phase (per paper) ---
  emit?.({ type: "phase", phase: "evaluation", state: "start" });
  const rows: ReviewRow[] = [];
  let index = 0;
  for (const paper of topK) {
    index++;
    emit?.({
      type: "paper_start",
      paperId: paper.paperId,
      index,
      total: topK.length,
      title: paper.title,
    });

    const { draft, verdict, rounds } = await refinePaper(paper, {
      summaryClient: llm,
      summaryModel,
      judgeClient: judgeLlm,
      judgeModel,
      maxRounds: params.maxRounds,
      signal: deps.signal,
      onRound: (round, v) =>
        emit?.({ type: "summary_round", paperId: paper.paperId, round, verdict: v }),
    });

    // Claim-level faithfulness on the final draft (RAGAS-style), via the judge
    // model so the summarizer doesn't grade itself. Best-effort: never blocks.
    let claimFaithfulness = null;
    try {
      claimFaithfulness = await assessClaimFaithfulness(draft, paper.abstract, {
        llm: judgeLlm,
        model: judgeModel,
        signal: deps.signal,
      });
    } catch (err) {
      emit?.({
        type: "log",
        level: "warn",
        message: `claim-faithfulness failed for "${paper.title}": ${(err as Error).message}`,
      });
    }

    const summary: PaperSummary = {
      paperId: paper.paperId,
      title: paper.title,
      abstract: paper.abstract ?? "",
      publishedYear: paper.year,
      doi: paper.doi,
      methodology: draft.methodology,
      contribution: draft.contribution,
      revisions: Math.max(0, rounds - 1),
      abstractAvailable: !!paper.abstract,
    };
    rows.push({ summary, verdict: { ...verdict, claimFaithfulness } });
    emit?.({ type: "paper_done", paperId: paper.paperId, summary, claimFaithfulness });
  }
  emit?.({ type: "phase", phase: "evaluation", state: "end" });

  // --- Cross-paper disagreements (candidate, abstract-only; never blocks the run) ---
  try {
    const items = await findDisagreements(topK, {
      llm,
      model: summaryModel,
      signal: deps.signal,
    });
    emit?.({ type: "disagreements", items });
  } catch (err) {
    emit?.({ type: "log", level: "warn", message: `disagreement check failed: ${(err as Error).message}` });
  }

  emit?.({ type: "done", result: rows.map((r) => r.summary) });
  return rows;
}
