/**
 * Dev CLI for the full pipeline.
 *   npx tsx scripts/review.ts "<query>" [--k 5] [--t 2] [--strategies keyword,citation]
 * Progress prints to stderr; the final results table prints as JSON to stdout.
 */
import { runReview, JobParamsSchema } from "../src/lib/index";
import type { ProgressEventInput } from "../src/lib/index";

function getFlag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function printEvent(e: ProgressEventInput): void {
  switch (e.type) {
    case "phase":
      console.error(`\n[${e.phase} ${e.state}]`);
      break;
    case "search_strategy":
      console.error(`  · ${e.strategy}: ${e.queries.join(" | ")}`);
      break;
    case "papers_found":
      console.error(`  · ${e.found} candidates → ${e.afterDedup} kept after dedup/rank`);
      break;
    case "paper_start":
      console.error(`\n  [${e.index}/${e.total}] ${e.title}`);
      break;
    case "summary_round": {
      const s = e.verdict.scores;
      const unsup = e.verdict.unsupportedClaims.length;
      console.error(
        `     round ${e.round}: ${e.verdict.pass ? "PASS" : "fail"} ` +
          `(overall ${e.verdict.overall.toFixed(2)}; C${s.clarity.score} K${s.keyFinding.score} ` +
          `F${s.faithfulness.score} X${s.consistency.score}${unsup ? `; ${unsup} unsupported` : ""})`,
      );
      break;
    }
    case "paper_done":
      console.error("     ✓ done");
      break;
    case "disagreements":
      if (e.items.length === 0) {
        console.error("\n[disagreements] none clearly found across abstracts");
      } else {
        console.error(`\n[disagreements] ${e.items.length} possible (from abstracts — verify):`);
        for (const d of e.items) {
          console.error(`  • ${d.topic}`);
          for (const s of d.sides) console.error(`     - ${s.title}: "${s.quote}"`);
        }
      }
      break;
    case "log":
      console.error(`  ${e.level}: ${e.message}`);
      break;
    case "error":
      console.error(`  ERROR: ${e.message}`);
      break;
    default:
      break;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const query = args.find((a) => !a.startsWith("--"));
  if (!query) {
    console.error(
      'Usage: npx tsx scripts/review.ts "<query>" [--k 5] [--t 2] [--strategies keyword,citation]',
    );
    process.exit(1);
  }

  const params = JobParamsSchema.parse({
    query,
    topK: Number(getFlag(args, "k") ?? 5),
    maxRounds: Number(getFlag(args, "t") ?? 2),
    strategies: (getFlag(args, "strategies") ?? "keyword")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const t0 = Date.now();
  const rows = await runReview(params, { emit: printEvent });

  console.log("\n================ RESULTS ================\n");
  console.log(
    JSON.stringify(
      rows.map((r) => ({
        ...r.summary,
        verdict: { pass: r.verdict.pass, overall: r.verdict.overall, scores: r.verdict.scores },
      })),
      null,
      2,
    ),
  );
  console.error(`\nDone: ${rows.length} papers in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
