export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serial rate limiter: guarantees at least `minIntervalMs` between the START of
 * scheduled tasks. Tasks run one at a time, in submission order. A failing task
 * does not break the chain for the next one.
 */
export class RateLimiter {
  private last = 0;
  private chain: Promise<unknown> = Promise.resolve();

  constructor(private readonly minIntervalMs: number) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      const wait = this.last + this.minIntervalMs - Date.now();
      if (wait > 0) await delay(wait);
      this.last = Date.now();
      return task();
    };
    const result = this.chain.then(run, run);
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/** Retry `fn` with exponential backoff + jitter while `shouldRetry(err)` holds. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (err: unknown) => boolean,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 4;
  const base = opts.baseDelayMs ?? 1000;
  const max = opts.maxDelayMs ?? 15_000;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const backoff = Math.min(max, base * 2 ** attempt) + Math.random() * 250;
      await delay(backoff);
      attempt++;
    }
  }
}

/** HTTP error worth retrying (429 / 5xx). */
export class RetryableHttpError extends Error {
  constructor(public readonly status: number) {
    super(`Retryable HTTP ${status}`);
    this.name = "RetryableHttpError";
  }
}
