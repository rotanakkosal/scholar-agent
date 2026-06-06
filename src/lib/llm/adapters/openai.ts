import type { ChatOptions, LLMClient } from "../LLMClient";

/**
 * OpenAI-compatible adapter (POST /v1/chat/completions). Works with vLLM,
 * LM Studio, llama.cpp server, LiteLLM, and Ollama's /v1 endpoint. Structured
 * output via `response_format: { type: "json_schema", ... }` — we keep
 * `strict: false` for broad server compatibility and rely on the Zod
 * validate-and-repair loop as the real guarantee.
 */
export class OpenAIAdapter implements LLMClient {
  readonly provider = "openai";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
    private readonly timeoutMs = 120_000,
  ) {}

  /** Normalize so the path ends up as `<base>/v1/...` exactly once. */
  private url(path: string): string {
    const b = this.baseUrl.replace(/\/+$/, "");
    return b.endsWith("/v1") ? `${b}${path}` : `${b}/v1${path}`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  async chat(opts: ChatOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0,
      stream: false,
    };
    if (opts.seed !== undefined) body.seed = opts.seed;
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (opts.jsonSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: "structured_output", schema: opts.jsonSchema, strict: false },
      };
    }

    const res = await fetch(this.url("/chat/completions"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: opts.signal ?? AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI /chat/completions ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(this.url("/models"), {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`OpenAI /models ${res.status}`);
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    return (data.data ?? []).map((m) => m.id);
  }
}
