import { config, type LLMProvider } from "../config";
import type { LLMClient } from "./LLMClient";
import { OllamaAdapter } from "./adapters/ollama";
import { OpenAIAdapter } from "./adapters/openai";

export interface LLMClientOverrides {
  provider?: LLMProvider;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  /** Suppress "thinking" traces (Qwen3). Must be per-client — Gemma rejects the kwarg. */
  disableThinking?: boolean;
}

/** Build an LLM client for the configured (or overridden) provider. */
export function createLLMClient(overrides: LLMClientOverrides = {}): LLMClient {
  const provider = overrides.provider ?? config.llm.provider;
  const baseUrl = overrides.baseUrl ?? config.llm.baseUrl;
  const apiKey = overrides.apiKey ?? config.llm.apiKey;
  const timeout = overrides.timeoutMs ?? config.llm.timeoutMs;
  const disableThinking = overrides.disableThinking ?? config.llm.disableThinking;

  // Provider-specific knob to suppress "thinking" traces for clean structured output.
  const extraBody = !disableThinking
    ? undefined
    : provider === "openai"
      ? { chat_template_kwargs: { enable_thinking: false } }
      : { think: false };

  return provider === "openai"
    ? new OpenAIAdapter(baseUrl, apiKey, timeout, extraBody)
    : new OllamaAdapter(baseUrl, apiKey, timeout, extraBody);
}

export * from "./LLMClient";
export * from "./structured";
export { OllamaAdapter } from "./adapters/ollama";
export { OpenAIAdapter } from "./adapters/openai";
