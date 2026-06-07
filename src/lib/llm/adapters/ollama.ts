import type { ChatOptions, LLMClient } from "../LLMClient";
import { RetryableHttpError, isRetryableLLMError, retryableStatus, withRetry } from "../retry";

/**
 * Ollama-native adapter (POST /api/chat). Uses the `format` field to pass a
 * JSON Schema for structured output (Ollama >= 0.5.0), and `keep_alive` to keep
 * the model resident in VRAM between calls.
 */
export class OllamaAdapter implements LLMClient {
  readonly provider = "ollama";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
    private readonly timeoutMs = 120_000,
    /** Extra fields merged into every request body (e.g. Ollama think:false). */
    private readonly extraBody?: Record<string, unknown>,
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  private base(): string {
    return this.baseUrl.replace(/\/+$/, "");
  }

  async chat(opts: ChatOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      stream: false,
      format: opts.jsonSchema,
      keep_alive: "10m",
      options: {
        temperature: opts.temperature ?? 0,
        ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
        num_ctx: opts.numCtx ?? 8192,
        ...(opts.maxTokens ? { num_predict: opts.maxTokens } : {}),
      },
    };
    if (this.extraBody) Object.assign(body, this.extraBody);

    return withRetry(
      async () => {
        const res = await fetch(`${this.base()}/api/chat`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: opts.signal ?? AbortSignal.timeout(this.timeoutMs),
        });
        if (retryableStatus(res.status)) throw new RetryableHttpError(res.status);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Ollama /api/chat ${res.status}: ${text.slice(0, 300)}`);
        }
        const data = (await res.json()) as { message?: { content?: string } };
        return data.message?.content ?? "";
      },
      isRetryableLLMError,
      { retries: 4, baseDelayMs: 800, maxDelayMs: 8000 },
    );
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.base()}/api/tags`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Ollama /api/tags ${res.status}`);
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return (data.models ?? []).map((m) => m.name);
  }
}
