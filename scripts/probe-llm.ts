/**
 * Structured-output smoke test against the configured LLM server.
 * Confirms JSON-schema-constrained generation + Zod validation work end to end.
 * Run with: npx tsx scripts/probe-llm.ts
 */
import { z } from "zod";
import { config, createLLMClient, callStructured } from "../src/lib/index";

const Schema = z.object({
  city: z.string(),
  country: z.string(),
  populationMillions: z.number(),
});

async function main(): Promise<void> {
  console.log(`Probing structured output on "${config.llm.summaryModel}" @ ${config.llm.baseUrl}\n`);
  const llm = createLLMClient();
  const out = await callStructured({
    client: llm,
    model: config.llm.summaryModel,
    schema: Schema,
    messages: [
      { role: "system", content: "Extract structured data from the user's text. Respond with JSON only." },
      { role: "user", content: "Tokyo is the capital of Japan and is home to about 14 million people." },
    ],
    temperature: 0,
    maxTokens: 200,
  });
  console.log("Parsed object:", out);
  console.log("\nStructured output OK ✔");
}

main().catch((err) => {
  console.error("Structured probe FAILED:", err);
  process.exit(1);
});
