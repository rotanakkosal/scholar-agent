import { config, type LLMProvider } from "../config";
import type { LLMClient } from "./LLMClient";
import { OpenAIAdapter } from "./adapters/openai";

export interface LLMClientOverrides {
  /** Currently only "openai" (any OpenAI-compatible server). Kept for forward-compat. */
  provider?: LLMProvider;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  /** Suppress "thinking" traces (Qwen3). Must be per-client — Gemma rejects the kwarg. */
  disableThinking?: boolean;
}

/** Build an OpenAI-compatible LLM client for the configured (or overridden) endpoint. */
export function createLLMClient(overrides: LLMClientOverrides = {}): LLMClient {
  const baseUrl = overrides.baseUrl ?? config.llm.baseUrl;
  const apiKey = overrides.apiKey ?? config.llm.apiKey;
  const timeout = overrides.timeoutMs ?? config.llm.timeoutMs;
  const disableThinking = overrides.disableThinking ?? config.llm.disableThinking;

  // Knob to suppress server-side "thinking" traces for clean structured output.
  const extraBody = disableThinking
    ? { chat_template_kwargs: { enable_thinking: false } }
    : undefined;

  return new OpenAIAdapter(baseUrl, apiKey, timeout, extraBody);
}

export * from "./LLMClient";
export * from "./structured";
export { OpenAIAdapter } from "./adapters/openai";
