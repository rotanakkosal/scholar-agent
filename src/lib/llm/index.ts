import { config, type LLMProvider } from "../config";
import type { LLMClient } from "./LLMClient";
import { OllamaAdapter } from "./adapters/ollama";
import { OpenAIAdapter } from "./adapters/openai";

export interface LLMClientOverrides {
  provider?: LLMProvider;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

/** Build an LLM client for the configured (or overridden) provider. */
export function createLLMClient(overrides: LLMClientOverrides = {}): LLMClient {
  const provider = overrides.provider ?? config.llm.provider;
  const baseUrl = overrides.baseUrl ?? config.llm.baseUrl;
  const apiKey = overrides.apiKey ?? config.llm.apiKey;
  const timeout = overrides.timeoutMs ?? config.llm.timeoutMs;

  return provider === "openai"
    ? new OpenAIAdapter(baseUrl, apiKey, timeout)
    : new OllamaAdapter(baseUrl, apiKey, timeout);
}

export * from "./LLMClient";
export * from "./structured";
export { OllamaAdapter } from "./adapters/ollama";
export { OpenAIAdapter } from "./adapters/openai";
