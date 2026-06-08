/**
 * Verify "find more": a second search that excludes the first batch returns
 * genuinely NEW papers (zero overlap). Run: npx tsx scripts/probe-findmore.ts
 */
import { config, createLLMClient, SemanticScholarClient, searchAgent, rankTopK } from "../src/lib/index";

async function main(): Promise<void> {
  const query = "retrieval augmented generation";
  const llm = createLLMClient();
  const s2 = new SemanticScholarClient();
  const common = {
    query,
    strategies: ["keyword", "citation"] as ("keyword" | "citation")[],
    model: config.llm.summaryModel,
    llm,
    s2,
  };

  const first = rankTopK(await searchAgent({ ...common, topKHint: 5 }), 5);
  const firstIds = first.map((p) => p.paperId);
  console.log("\n=== First batch ===");
  first.forEach((p) => console.log(" •", p.title));

  const more = rankTopK(await searchAgent({ ...common, topKHint: 5, excludePaperIds: firstIds }), 5);
  console.log("\n=== Find more (excluding first batch) ===");
  more.forEach((p) => console.log(" •", p.title));

  const overlap = more.filter((p) => firstIds.includes(p.paperId)).length;
  console.log(`\nOverlap with first batch: ${overlap} (expected 0)`);
}

main().catch((e) => {
  console.error("probe failed:", e);
  process.exit(1);
});
