/**
 * Judge-ablation benchmark (discrimination) — does each judge PASS real summaries
 * and REJECT deliberately-flawed ones? Compares Qwen-as-judge vs Gemma-as-judge.
 * No Semantic Scholar needed. Writes docs/eval/judge-ablation.{json,md}.
 * Run with: npx tsx scripts/benchmark.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config, createLLMClient } from "../src/lib/index";
import { EVAL_CASES } from "../src/lib/eval/fixtures";
import { runBenchmark, type BenchmarkResult } from "../src/lib/eval/benchmark";

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

function toMarkdown(res: BenchmarkResult): string {
  let s = `# Judge Ablation (discrimination) — Qwen vs Gemma\n\n`;
  s += `Summarizer: \`${res.summaryModel}\` · ${res.cases} papers, each judged on a real summary AND a deliberately-flawed (hallucinated) summary.\n\n`;
  s += `| Judge | Good pass↑ | Bad pass↓ | Detection acc.↑ | Score gap↑ | mean good | mean bad |\n`;
  s += `|---|---|---|---|---|---|---|\n`;
  for (const [name, a] of Object.entries(res.perJudge)) {
    s += `| \`${name}\` | ${pct(a.goodPassRate)} | ${pct(a.badPassRate)} | ${pct(a.detectionAccuracy)} | ${a.meanScoreGap.toFixed(2)} | ${a.meanGoodOverall.toFixed(2)} | ${a.meanBadOverall.toFixed(2)} |\n`;
  }
  s += `\nArrows show the desired direction. **Bad pass↓** = flawed summaries that slipped through (lower is better); `;
  s += `**Score gap** = how far the judge separates good from bad (higher = sharper).\n`;
  s += `\n_Small fixture set (${res.cases} papers); expand once a Semantic Scholar key enables live search._\n`;
  return s;
}

async function main(): Promise<void> {
  const summaryClient = createLLMClient();
  const gemmaClient = createLLMClient({
    provider: config.judge.provider,
    baseUrl: config.judge.baseUrl,
    apiKey: config.judge.apiKey,
    disableThinking: config.judge.disableThinking,
  });

  const judges = [
    { name: config.llm.summaryModel, client: summaryClient, model: config.llm.summaryModel },
    { name: config.judge.model, client: gemmaClient, model: config.judge.model },
  ];

  console.error(
    `Judge ablation (discrimination) over ${EVAL_CASES.length} papers — ` +
      `summarizer ${config.llm.summaryModel}, judges: ${judges.map((j) => j.name).join(" vs ")}\n`,
  );

  const res = await runBenchmark(
    EVAL_CASES,
    summaryClient,
    config.llm.summaryModel,
    judges,
    (m) => console.error(m),
  );

  const md = toMarkdown(res);
  console.log("\n" + md);

  const dir = join(process.cwd(), "docs", "eval");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "judge-ablation.json"), JSON.stringify(res, null, 2), "utf8");
  writeFileSync(join(dir, "judge-ablation.md"), md, "utf8");
  console.error("\nWrote docs/eval/judge-ablation.{json,md}");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
