import type { LLMClient } from "../llm/index";
import type { Paper } from "../schemas/paper";
import type { SummaryDraft } from "../schemas/summary";
import type { JudgeVerdict } from "../schemas/judge";
import { summarize, revise } from "./summaryAgent";
import { judge } from "./judge";

export interface RefineDeps {
  llm: LLMClient;
  summaryModel: string;
  judgeModel: string;
  /** T — maximum judge rounds (each failing round triggers one revision). */
  maxRounds: number;
  signal?: AbortSignal;
  onRound?: (round: number, verdict: JudgeVerdict) => void;
}

export interface RefineResult {
  draft: SummaryDraft;
  verdict: JudgeVerdict;
  /** Number of judge rounds executed (1 = passed/stopped on first try). */
  rounds: number;
}

/**
 * The Evaluation Phase for a single paper (Figure 1's "T Rounds" loop):
 * summarize → judge → (if failing) revise → judge … up to T rounds.
 * Always returns the BEST-scoring draft seen, so a regressing revision can
 * never make the final result worse.
 */
export async function refinePaper(paper: Paper, deps: RefineDeps): Promise<RefineResult> {
  const summaryDeps = { llm: deps.llm, model: deps.summaryModel, signal: deps.signal };
  const judgeDeps = { llm: deps.llm, model: deps.judgeModel, signal: deps.signal };

  let draft = await summarize(paper, summaryDeps);
  let best: { draft: SummaryDraft; verdict: JudgeVerdict } | undefined;
  let rounds = 0;

  const T = Math.max(1, deps.maxRounds);
  while (rounds < T) {
    rounds++;
    const verdict = await judge(paper, draft, judgeDeps);
    deps.onRound?.(rounds, verdict);
    if (!best || verdict.overall > best.verdict.overall) best = { draft, verdict };
    if (verdict.pass || rounds === T) break;
    draft = await revise(paper, draft, verdict, summaryDeps);
  }

  if (!best) throw new Error("refinePaper produced no verdict");
  return { draft: best.draft, verdict: best.verdict, rounds };
}
