/**
 * Health check — verifies the external dependencies before any real run:
 *   1. the worker LLM (Qwen), 2. the judge LLM (Gemma), 3. Semantic Scholar.
 * Run with: npm run health
 */
import { config, createLLMClient, SemanticScholarClient } from "../src/lib/index";
import type { LLMClientOverrides } from "../src/lib/index";

async function checkLLM(
  label: string,
  wantModel: string,
  overrides?: LLMClientOverrides,
): Promise<boolean> {
  process.stdout.write(`${label.padEnd(14)}: `);
  try {
    const models = await createLLMClient(overrides).listModels();
    const present = models.some(
      (m) => m === wantModel || m.startsWith(`${wantModel}:`) || wantModel.startsWith(m),
    );
    console.log(`OK — ${models.length} model(s); ${present ? "✓" : "✗"} ${wantModel}`);
    if (!present) console.log(`                available: ${models.slice(0, 12).join(", ")}`);
    return true;
  } catch (err) {
    console.log("UNREACHABLE —", (err as Error).message);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("Scholar Agent — health check\n");
  console.log("Configuration");
  console.log(`  worker (summary): ${config.llm.summaryModel} @ ${config.llm.baseUrl}`);
  console.log(`  judge           : ${config.judge.model} @ ${config.judge.baseUrl}`);
  console.log(`  S2              : ${config.s2.baseUrl} (key ${config.s2.apiKey ? "set" : "none"})`);
  console.log();

  const workerOk = await checkLLM("Worker LLM", config.llm.summaryModel);
  const judgeOk = await checkLLM("Judge LLM", config.judge.model, {
    provider: config.judge.provider,
    baseUrl: config.judge.baseUrl,
    apiKey: config.judge.apiKey,
    disableThinking: config.judge.disableThinking,
  });

  process.stdout.write("Semantic Schol: ");
  const s2Health = await new SemanticScholarClient().health();
  if (s2Health.ok) console.log(`OK — sample: "${s2Health.sample}"`);
  else console.log("FAILED —", s2Health.error);
  console.log();

  console.log(
    workerOk && judgeOk && s2Health.ok
      ? "All systems go."
      : "Some checks failed (see above).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
