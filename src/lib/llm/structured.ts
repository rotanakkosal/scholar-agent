import { z } from "zod";
import type { ChatMessage, LLMClient } from "./LLMClient";

export interface StructuredOptions<T> {
  client: LLMClient;
  model: string;
  schema: z.ZodType<T>;
  messages: ChatMessage[];
  temperature?: number;
  seed?: number;
  numCtx?: number;
  maxTokens?: number;
  /** Extra correction attempts after the first try (default 2). */
  maxRepairs?: number;
  signal?: AbortSignal;
}

/** Remove a surrounding ```json ... ``` fence if the model added one. */
function stripFences(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  return fence?.[1] ? fence[1].trim() : t;
}

/** Best-effort extraction of the outermost JSON value if wrapped in prose. */
function extractJson(text: string): string {
  const t = stripFences(text);
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const candidates = [firstObj, firstArr].filter((i) => i >= 0);
  if (candidates.length === 0) return t;
  const start = Math.min(...candidates);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  return end > start ? t.slice(start, end + 1) : t;
}

/**
 * Call the model and return a value validated against `schema`.
 *
 * Strategy: constrain generation with the JSON Schema (`format` / `response_format`),
 * then parse + Zod-validate. On failure, re-prompt with the bad output and the
 * exact Zod errors and try again. This is the reliability backbone for local
 * 7B-class models, which occasionally emit malformed or off-schema JSON.
 */
export async function callStructured<T>(opts: StructuredOptions<T>): Promise<T> {
  const jsonSchema = z.toJSONSchema(opts.schema) as Record<string, unknown>;
  // Some servers reject the meta `$schema` key — drop it.
  delete jsonSchema["$schema"];

  const maxRepairs = opts.maxRepairs ?? 2;
  const messages: ChatMessage[] = [...opts.messages];
  let lastError = "";

  for (let attempt = 0; attempt <= maxRepairs; attempt++) {
    const raw = await opts.client.chat({
      model: opts.model,
      messages,
      temperature: opts.temperature,
      seed: opts.seed,
      numCtx: opts.numCtx,
      maxTokens: opts.maxTokens,
      jsonSchema,
      signal: opts.signal,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      lastError = `Output was not valid JSON: ${(err as Error).message}`;
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `${lastError}\nReturn ONLY valid JSON matching the schema — no prose, no code fences.`,
      });
      continue;
    }

    const result = opts.schema.safeParse(parsed);
    if (result.success) return result.data;

    lastError = result.error.issues
      .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    messages.push({ role: "assistant", content: raw });
    messages.push({
      role: "user",
      content: `Your JSON did not match the required schema. Fix these errors and return ONLY the corrected JSON:\n${lastError}`,
    });
  }

  throw new Error(
    `callStructured failed after ${maxRepairs + 1} attempt(s). Last error:\n${lastError}`,
  );
}
