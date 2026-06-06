import { config, createLLMClient, SemanticScholarClient } from "@/lib/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — reports LLM-server and Semantic Scholar reachability. */
export async function GET() {
  const llm: { ok: boolean; models: string[]; error?: string } = { ok: false, models: [] };
  try {
    llm.models = await createLLMClient().listModels();
    llm.ok = true;
  } catch (err) {
    llm.error = (err as Error).message;
  }

  const s2 = await new SemanticScholarClient().health();

  return Response.json({
    llm: {
      ...llm,
      provider: config.llm.provider,
      baseUrl: config.llm.baseUrl,
      summaryModel: config.llm.summaryModel,
      judgeModel: config.llm.judgeModel,
    },
    s2: { ...s2, hasKey: Boolean(config.s2.apiKey) },
  });
}
