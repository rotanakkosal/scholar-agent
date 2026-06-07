/** One-off: fetch real abstracts for well-known papers to seed benchmark fixtures. */
import { SemanticScholarClient } from "../src/lib/index";

const queries = [
  "attention is all you need transformer",
  "deep residual learning for image recognition",
  "bert pre-training deep bidirectional transformers language understanding",
  "adam a method for stochastic optimization",
  "generative adversarial nets goodfellow",
  "batch normalization accelerating deep network training",
];

async function main(): Promise<void> {
  const s2 = new SemanticScholarClient();
  for (const q of queries) {
    const res = await s2.search(q, { limit: 1 });
    const p = res[0];
    if (!p) {
      console.log(`NO RESULT: ${q}\n----`);
      continue;
    }
    console.log(
      JSON.stringify(
        {
          paperId: p.paperId,
          title: p.title,
          year: p.year,
          doi: p.doi,
          hasAbstract: !!p.abstract,
          abstract: p.abstract,
        },
        null,
        2,
      ),
    );
    console.log("----");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
