/**
 * Central configuration. Values come from environment variables (loaded from a
 * local `.env` if present) with sensible defaults. Tunable knobs for the
 * pipeline — model names, rubric thresholds, ranking weights — live here so the
 * rest of the code reads from one place.
 */

// Node >= 20.12 ships process.loadEnvFile(); load .env if it exists, ignore if not.
try {
  (process as NodeJS.Process & { loadEnvFile?: (p?: string) => void }).loadEnvFile?.();
} catch {
  // no .env file — rely on the real environment
}

function num(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export type LLMProvider = "ollama" | "openai";

export const config = {
  llm: {
    provider: (process.env.LLM_PROVIDER as LLMProvider) || "ollama",
    baseUrl: process.env.LLM_BASE_URL || "http://localhost:11434",
    apiKey: process.env.LLM_API_KEY || undefined,
    summaryModel: process.env.SUMMARY_MODEL || "qwen2.5:7b-instruct",
    judgeModel: process.env.JUDGE_MODEL || "gemma2:9b",
    numCtx: num(process.env.LLM_NUM_CTX, 8192),
    timeoutMs: num(process.env.LLM_TIMEOUT_MS, 120_000),
    /** Disable model "thinking" traces (e.g. Qwen3 <think>…</think>) for clean JSON. */
    disableThinking: /^true$/i.test(process.env.LLM_DISABLE_THINKING ?? ""),
  },
  s2: {
    baseUrl: process.env.S2_BASE_URL || "https://api.semanticscholar.org/graph/v1",
    apiKey: process.env.S2_API_KEY || undefined,
    /** Minimum gap between requests (ms). ~1 req/s is the keyed S2 search limit. */
    minIntervalMs: num(process.env.S2_MIN_INTERVAL_MS, 1100),
  },
  pipeline: {
    topK: num(process.env.TOP_K, 5),
    maxRounds: num(process.env.MAX_ROUNDS, 2),
    llmConcurrency: num(process.env.LLM_CONCURRENCY, 1),
    summaryTemperature: 0.3,
    judgeTemperature: 0,
    /** Fixed seed for the judge → deterministic, the baseline for self-consistency. */
    judgeSeed: 42,
    /** Cap on generated tokens so the model can't ramble past the JSON. */
    maxOutputTokens: 1024,
  },
  rubric: {
    version: "v1",
    /** A summary "passes" only if every gate below is satisfied. */
    thresholds: {
      clarity: 4,
      keyFinding: 4,
      faithfulness: 4,
      consistency: 4,
      overall: 4.0,
    },
  },
  prompts: {
    summaryVersion: "v1",
    judgeVersion: "v1",
    searchVersion: "v1",
  },
  ranking: {
    // Weights for the transparent Top-K proxy score (no ground truth exists).
    weights: {
      relevance: 0.4,
      citations: 0.2,
      influential: 0.15,
      recency: 0.1,
      multiStrategy: 0.1,
      hasAbstract: 0.05,
    },
  },
} as const;

export type AppConfig = typeof config;
