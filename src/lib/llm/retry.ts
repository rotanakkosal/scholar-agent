import { RetryableHttpError, withRetry } from "../clients/rateLimit";

/**
 * Statuses worth retrying — transient LLM-server hiccups. 401 IS included here
 * because the self-hosted vLLM endpoints intermittently return a spurious 401 on
 * the same valid key (verified: the endpoint flickers 200 → 401 → 200 under
 * load / cold-start). A genuine bad key fails fast enough after the retries.
 */
export function retryableStatus(status: number): boolean {
  return (
    status === 401 ||
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

/** True for retryable HTTP errors or transient network failures. */
export function isRetryableLLMError(err: unknown): boolean {
  if (err instanceof RetryableHttpError) return true;
  const msg = String((err as Error | undefined)?.message ?? "");
  return /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|network/i.test(msg);
}

export { RetryableHttpError, withRetry };
