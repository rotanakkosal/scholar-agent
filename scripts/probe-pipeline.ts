/**
 * Smoke test for the Summary → Judge → Refine loop on a fixed sample paper
 * (no Semantic Scholar needed). Verifies the core evaluation loop end to end.
 * Run with: npx tsx scripts/probe-pipeline.ts
 */
import { config, createLLMClient, refinePaper, PaperSchema } from "../src/lib/index";

const paper = PaperSchema.parse({
  paperId: "demo-rag",
  title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
  year: 2020,
  abstract:
    "Large pre-trained language models store factual knowledge in their parameters and achieve " +
    "state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to " +
    "access and precisely manipulate knowledge is still limited, and their decisions are hard to " +
    "explain. We introduce retrieval-augmented generation (RAG), models which combine a pre-trained " +
    "parametric seq2seq model with a non-parametric memory — a dense vector index of Wikipedia " +
    "accessed with a neural retriever. We fine-tune and evaluate RAG on a wide range of " +
    "knowledge-intensive NLP tasks and set the state of the art on three open-domain question " +
    "answering tasks, generating more specific, diverse, and factual language than a parametric-only baseline.",
});

async function main(): Promise<void> {
  console.log(`Running Summary→Judge→Refine on a sample paper using "${config.llm.summaryModel}"\n`);
  const llm = createLLMClient();
  const t0 = Date.now();

  const judgeClient = createLLMClient({
    provider: config.judge.provider,
    baseUrl: config.judge.baseUrl,
    apiKey: config.judge.apiKey,
    disableThinking: config.judge.disableThinking,
  });
  const res = await refinePaper(paper, {
    summaryClient: llm,
    summaryModel: config.llm.summaryModel,
    judgeClient,
    judgeModel: config.judge.model,
    maxRounds: config.pipeline.maxRounds,
    onRound: (round, v) => {
      const s = v.scores;
      console.log(
        `round ${round}: ${v.pass ? "PASS" : "fail"} — overall ${v.overall.toFixed(2)} ` +
          `(clarity ${s.clarity.score}, keyFinding ${s.keyFinding.score}, ` +
          `faithfulness ${s.faithfulness.score}, consistency ${s.consistency.score})` +
          (v.unsupportedClaims.length ? `\n        unsupported: ${v.unsupportedClaims.join("; ")}` : ""),
      );
    },
  });

  console.log("\nFinal summary:");
  console.log("  methodology :", res.draft.methodology);
  console.log("  contribution:", res.draft.contribution);
  console.log(
    `\nrounds=${res.rounds} pass=${res.verdict.pass} overall=${res.verdict.overall.toFixed(2)} ` +
      `(${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  );
}

main().catch((err) => {
  console.error("Pipeline probe FAILED:", err);
  process.exit(1);
});
