/**
 * Provider-agnostic LLM interface. Concrete adapters (Ollama-native,
 * OpenAI-compatible) implement this so the rest of the codebase never depends
 * on a specific server API. Swap providers via config — no code changes.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  seed?: number;
  numCtx?: number;
  maxTokens?: number;
  /** A JSON Schema object to constrain the output to (structured generation). */
  jsonSchema?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface LLMClient {
  readonly provider: string;
  /** Returns the assistant message text. */
  chat(opts: ChatOptions): Promise<string>;
  /** Model identifiers available on the server. */
  listModels(): Promise<string[]>;
}
