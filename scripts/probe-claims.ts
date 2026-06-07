/**
 * Live check of claim-level faithfulness against a real model.
 * A faithful draft should score high; a hallucinated one should score low.
 * Run with: npx tsx scripts/probe-claims.ts
 */
import { config, createLLMClient, assessClaimFaithfulness } from "../src/lib/index";

const abstract =
  "We introduce Adam, a first-order gradient-based optimizer based on adaptive estimates of " +
  "lower-order moments. The method has little memory requirements and is well suited for problems " +
  "with very noisy or sparse gradients.";

const good = {
  methodology: "Adam is a first-order optimizer that uses adaptive estimates of lower-order moments.",
  contribution: "It has low memory requirements and works well with noisy or sparse gradients.",
};
const bad = {
  methodology: "Adam is a second-order optimizer that computes the full Hessian matrix.",
  contribution: "It requires very large memory and achieves 99% accuracy on ImageNet.",
};

async function main(): Promise<void> {
  const llm = createLLMClient(); // worker model (reliable)
  for (const [name, draft] of [
    ["GOOD draft", good],
    ["BAD draft (hallucinated)", bad],
  ] as const) {
    const cf = await assessClaimFaithfulness(draft, abstract, {
      llm,
      model: config.llm.summaryModel,
    });
    console.log(`\n=== ${name} ===`);
    console.log(cf ? `score ${cf.supported}/${cf.total}` : "null");
    console.log(JSON.stringify(cf?.claims, null, 2));
  }
}

main().catch((e) => {
  console.error("probe failed:", e);
  process.exit(1);
});
