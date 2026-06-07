import type { LLMClient } from "../llm/index";
import { summarize } from "../pipeline/summaryAgent";
import { judge } from "../pipeline/judge";
import type { EvalCase } from "./fixtures";

export interface JudgeConfig {
  name: string;
  client: LLMClient;
  model: string;
}

export interface CandidateOutcome {
  overall: number;
  pass: boolean;
  faithfulness: number;
  unsupported: number;
}

export interface PerCaseResult {
  paperId: string;
  title: string;
  goodGrounding: number;
  badGrounding: number;
  judges: Record<string, { good: CandidateOutcome; bad: CandidateOutcome }>;
}

export interface JudgeDiscrimination {
  /** Real summaries correctly passed (higher is better). */
  goodPassRate: number;
  /** Flawed summaries that slipped through (LOWER is better). */
  badPassRate: number;
  /** Fraction of correct verdicts overall: pass-good + fail-bad. */
  detectionAccuracy: number;
  /** Mean overall(good) − overall(bad): higher = sharper discrimination. */
  meanScoreGap: number;
  meanGoodOverall: number;
  meanBadOverall: number;
}

export interface BenchmarkResult {
  cases: number;
  summaryModel: string;
  perJudge: Record<string, JudgeDiscrimination>;
  perCase: PerCaseResult[];
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function outcome(v: Awaited<ReturnType<typeof judge>>): CandidateOutcome {
  return {
    overall: v.overall,
    pass: v.pass,
    faithfulness: v.scores.faithfulness.score,
    unsupported: v.unsupportedClaims.length,
  };
}

/**
 * Judge-ablation by DISCRIMINATION: for each paper, summarize once (the worker),
 * then have each judge score BOTH the real summary and a deliberately flawed one.
 * A good judge passes the real summary and rejects the flawed one — this reveals
 * differences between judges that a "good summaries only" test cannot.
 */
export async function runBenchmark(
  cases: EvalCase[],
  summaryClient: LLMClient,
  summaryModel: string,
  judges: JudgeConfig[],
  onProgress?: (msg: string) => void,
): Promise<BenchmarkResult> {
  const perCase: PerCaseResult[] = [];

  for (let i = 0; i < cases.length; i++) {
    const { paper, bad } = cases[i];
    onProgress?.(`[${i + 1}/${cases.length}] ${paper.title}`);
    const good = await summarize(paper, { llm: summaryClient, model: summaryModel });

    const judges_: PerCaseResult["judges"] = {};
    let goodGrounding = 0;
    let badGrounding = 0;
    for (const jc of judges) {
      const vg = await judge(paper, good, { llm: jc.client, model: jc.model });
      const vb = await judge(paper, bad, { llm: jc.client, model: jc.model });
      goodGrounding = vg.faithfulnessOverlap;
      badGrounding = vb.faithfulnessOverlap;
      judges_[jc.name] = { good: outcome(vg), bad: outcome(vb) };
      onProgress?.(
        `    ${jc.name}: good ${vg.pass ? "PASS" : "fail"} ${vg.overall.toFixed(1)} | ` +
          `bad ${vb.pass ? "PASS(!)" : "fail✓"} ${vb.overall.toFixed(1)}`,
      );
    }
    perCase.push({
      paperId: paper.paperId,
      title: paper.title,
      goodGrounding,
      badGrounding,
      judges: judges_,
    });
  }

  const perJudge: Record<string, JudgeDiscrimination> = {};
  for (const jc of judges) {
    const goods = perCase.map((c) => c.judges[jc.name].good);
    const bads = perCase.map((c) => c.judges[jc.name].bad);
    const detection = perCase.map((c) => {
      const g = c.judges[jc.name].good.pass ? 1 : 0;
      const b = c.judges[jc.name].bad.pass ? 0 : 1; // correct = bad rejected
      return (g + b) / 2;
    });
    perJudge[jc.name] = {
      goodPassRate: mean(goods.map((o) => (o.pass ? 1 : 0))),
      badPassRate: mean(bads.map((o) => (o.pass ? 1 : 0))),
      detectionAccuracy: mean(detection),
      meanScoreGap: mean(perCase.map((c) => c.judges[jc.name].good.overall - c.judges[jc.name].bad.overall)),
      meanGoodOverall: mean(goods.map((o) => o.overall)),
      meanBadOverall: mean(bads.map((o) => o.overall)),
    };
  }

  return { cases: perCase.length, summaryModel, perJudge, perCase };
}
