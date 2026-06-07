import { config, createLLMClient, SemanticScholarClient } from "@/lib/index";
import type { LLMClientOverrides } from "@/lib/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function pingLLM(overrides?: LLMClientOverrides) {
  const out: { ok: boolean; models: string[]; error?: string } = { ok: false, models: [] };
  try {
    out.models = await createLLMClient(overrides).listModels();
    out.ok = true;
  } catch (err) {
    out.error = (err as Error).message;
  }
  return out;
}

/** GET /api/health — reports worker LLM, judge LLM, and Semantic Scholar reachability. */
export async function GET() {
  const summary = await pingLLM();
  const judge = await pingLLM({
    provider: config.judge.provider,
    baseUrl: config.judge.baseUrl,
    apiKey: config.judge.apiKey,
    disableThinking: config.judge.disableThinking,
  });
  const s2 = await new SemanticScholarClient().health();

  return Response.json({
    summary: {
      ...summary,
      provider: config.llm.provider,
      baseUrl: config.llm.baseUrl,
      model: config.llm.summaryModel,
    },
    judge: {
      ...judge,
      provider: config.judge.provider,
      baseUrl: config.judge.baseUrl,
      model: config.judge.model,
    },
    s2: { ...s2, hasKey: Boolean(config.s2.apiKey) },
  });
}
