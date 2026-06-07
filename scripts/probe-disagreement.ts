/**
 * Controlled test of cross-paper disagreement detection: two papers that clearly
 * contradict + one unrelated paper. Expect ONE disagreement (A vs B), not C.
 * Run with: npx tsx scripts/probe-disagreement.ts
 */
import { config, createLLMClient, findDisagreements, PaperSchema } from "../src/lib/index";

const papers = [
  PaperSchema.parse({
    paperId: "a",
    title: "Coffee and Memory: A Positive Effect",
    abstract:
      "In a randomized study of 200 adults, daily coffee consumption significantly improved short-term memory recall compared to placebo. We conclude that caffeine enhances memory performance.",
  }),
  PaperSchema.parse({
    paperId: "b",
    title: "No Memory Benefit from Caffeine",
    abstract:
      "Across three double-blind trials, we found that coffee consumption had no statistically significant effect on memory recall. Caffeine did not improve performance on any memory task.",
  }),
  PaperSchema.parse({
    paperId: "c",
    title: "Global Coffee Cultivation Trends",
    abstract:
      "This paper reviews global coffee bean production and export economics over the past decade.",
  }),
];

async function main(): Promise<void> {
  const llm = createLLMClient();
  const items = await findDisagreements(papers, { llm, model: config.llm.summaryModel });
  console.log(`Found ${items.length} disagreement(s):\n`);
  console.log(JSON.stringify(items, null, 2));
}

main().catch((err) => {
  console.error("probe failed:", err);
  process.exit(1);
});
