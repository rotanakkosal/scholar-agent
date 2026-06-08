/**
 * Verify the publication-year filter: a 2024–2026 search should only return
 * papers within that range. Run: npx tsx scripts/probe-years.ts
 */
import { config, createLLMClient, SemanticScholarClient, searchAgent, rankTopK } from "../src/lib/index";

async function main(): Promise<void> {
  const llm = createLLMClient();
  const s2 = new SemanticScholarClient();
  // Keyword only — citation snowballing intentionally ignores the year filter.
  const papers = rankTopK(
    await searchAgent({
      query: "retrieval augmented generation",
      strategies: ["keyword"] as ("keyword" | "citation")[],
      topKHint: 8,
      yearFrom: 2024,
      yearTo: 2026,
      model: config.llm.summaryModel,
      llm,
      s2,
    }),
    8,
  );
  papers.forEach((p) => console.log(`${p.year ?? "?"} — ${p.title}`));
  const outOfRange = papers.filter((p) => p.year != null && (p.year < 2024 || p.year > 2026));
  console.log(`\nPapers out of 2024–2026 range: ${outOfRange.length} (expected 0)`);
}

main().catch((e) => {
  console.error("probe failed:", e);
  process.exit(1);
});
