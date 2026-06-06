/**
 * Health check — verifies the two external dependencies before any real run:
 *   1. the LLM server (your remote Qwen/Gemma box) is reachable, and
 *   2. Semantic Scholar responds.
 * Run with: npm run health
 */
import { config, createLLMClient, SemanticScholarClient } from "../src/lib/index";

async function main(): Promise<void> {
  console.log("Scholar Agent — health check\n");

  console.log("Configuration");
  console.log("  LLM provider :", config.llm.provider);
  console.log("  LLM base URL :", config.llm.baseUrl);
  console.log("  summary model:", config.llm.summaryModel);
  console.log("  judge model  :", config.llm.judgeModel);
  console.log("  S2 base URL  :", config.s2.baseUrl);
  console.log("  S2 API key   :", config.s2.apiKey ? "set" : "(none)");
  console.log();

  let llmOk = false;
  process.stdout.write("LLM server    : ");
  try {
    const models = await createLLMClient().listModels();
    llmOk = true;
    console.log(`OK — ${models.length} model(s) available`);
    if (models.length) console.log("                ", models.slice(0, 12).join(", "));
    for (const want of [config.llm.summaryModel, config.llm.judgeModel]) {
      const present = models.some((m) => m === want || m.startsWith(`${want}:`) || want.startsWith(m));
      console.log(`                 ${present ? "✓" : "✗"} ${want}${present ? "" : " (not found on server)"}`);
    }
  } catch (err) {
    console.log("UNREACHABLE —", (err as Error).message);
    console.log("                 Set LLM_BASE_URL / LLM_PROVIDER in .env to your Qwen/Gemma server.");
  }
  console.log();

  process.stdout.write("Semantic Schol: ");
  const s2 = new SemanticScholarClient();
  const s2Health = await s2.health();
  if (s2Health.ok) console.log(`OK — sample paper: "${s2Health.sample}"`);
  else console.log("FAILED —", s2Health.error);
  console.log();

  const ready = llmOk && s2Health.ok;
  console.log(
    ready
      ? "All systems go."
      : "Some checks failed (see above). The LLM check is expected to fail until you configure the server in .env.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
