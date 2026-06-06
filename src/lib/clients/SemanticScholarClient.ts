import { config } from "../config";
import { PaperSchema, type Paper, type PaperSource } from "../schemas/paper";
import { RateLimiter, RetryableHttpError, withRetry } from "./rateLimit";

/** Fields requested from S2 — kept minimal (extra fields slow responses). */
const SEARCH_FIELDS = [
  "paperId",
  "title",
  "abstract",
  "year",
  "venue",
  "authors.authorId",
  "authors.name",
  "externalIds",
  "citationCount",
  "influentialCitationCount",
  "fieldsOfStudy",
  "tldr",
  "url",
].join(",");

/** Raw shape of a paper as returned by the S2 Graph API (subset we use). */
interface S2Paper {
  paperId: string;
  title: string | null;
  abstract: string | null;
  year: number | null;
  venue: string | null;
  authors?: Array<{ authorId: string | null; name: string }>;
  externalIds?: { DOI?: string | null } | null;
  citationCount?: number | null;
  influentialCitationCount?: number | null;
  fieldsOfStudy?: string[] | null;
  tldr?: { text: string | null } | null;
  url?: string | null;
}

export interface SearchOptions {
  limit?: number;
  /** S2 year filter, e.g. "2018-" or "2015-2020". */
  year?: string;
  fieldsOfStudy?: string;
  /** Tag returned papers with the strategy that found them. */
  source?: PaperSource;
  signal?: AbortSignal;
}

/**
 * Minimal Semantic Scholar Graph API client. Throttled to ~1 req/s and retries
 * 429/5xx with exponential backoff (the public API is a heavily shared pool).
 */
export class SemanticScholarClient {
  private readonly limiter: RateLimiter;

  constructor(
    private readonly baseUrl: string = config.s2.baseUrl,
    private readonly apiKey: string | undefined = config.s2.apiKey,
    minIntervalMs: number = config.s2.minIntervalMs,
  ) {
    this.limiter = new RateLimiter(minIntervalMs);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "User-Agent": "scholar-agent/0.1 (academic project)",
    };
    if (this.apiKey) h["x-api-key"] = this.apiKey;
    return h;
  }

  private get(
    path: string,
    params: Record<string, string | number | undefined>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    return this.limiter.schedule(() =>
      withRetry(
        async () => {
          const res = await fetch(url, {
            headers: this.headers(),
            signal: signal ?? AbortSignal.timeout(30_000),
          });
          if (res.status === 429 || res.status >= 500) {
            throw new RetryableHttpError(res.status);
          }
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`S2 ${path} ${res.status}: ${text.slice(0, 200)}`);
          }
          return res.json();
        },
        (err) => err instanceof RetryableHttpError,
        { retries: 4, baseDelayMs: 1500 },
      ),
    );
  }

  /** Relevance search (GET /paper/search). Returns normalized Paper records. */
  async search(query: string, opts: SearchOptions = {}): Promise<Paper[]> {
    const limit = Math.min(opts.limit ?? 20, 100);
    const data = (await this.get(
      "/paper/search",
      {
        query,
        limit,
        fields: SEARCH_FIELDS,
        year: opts.year,
        fieldsOfStudy: opts.fieldsOfStudy,
      },
      opts.signal,
    )) as { data?: S2Paper[] };

    return (data.data ?? []).map((p, index) => this.toPaper(p, index, opts.source));
  }

  /** Papers that THIS paper cites (snowball backward). */
  async references(
    paperId: string,
    opts: { limit?: number; signal?: AbortSignal } = {},
  ): Promise<Paper[]> {
    const limit = Math.min(opts.limit ?? 10, 100);
    const data = (await this.get(
      `/paper/${encodeURIComponent(paperId)}/references`,
      { limit, fields: SEARCH_FIELDS },
      opts.signal,
    )) as { data?: Array<{ citedPaper?: S2Paper | null }> };
    return (data.data ?? [])
      .map((d) => d.citedPaper)
      .filter((p): p is S2Paper => !!p && !!p.paperId)
      .map((p, i) => this.toPaper(p, i, "citation"));
  }

  /** Papers that cite THIS paper (snowball forward). */
  async citations(
    paperId: string,
    opts: { limit?: number; signal?: AbortSignal } = {},
  ): Promise<Paper[]> {
    const limit = Math.min(opts.limit ?? 10, 100);
    const data = (await this.get(
      `/paper/${encodeURIComponent(paperId)}/citations`,
      { limit, fields: SEARCH_FIELDS },
      opts.signal,
    )) as { data?: Array<{ citingPaper?: S2Paper | null }> };
    return (data.data ?? [])
      .map((d) => d.citingPaper)
      .filter((p): p is S2Paper => !!p && !!p.paperId)
      .map((p, i) => this.toPaper(p, i, "citation"));
  }

  /** Lightweight reachability probe used by the health check. */
  async health(): Promise<{ ok: boolean; sample?: string; error?: string }> {
    try {
      const papers = await this.search("large language models", { limit: 1 });
      return { ok: papers.length > 0, sample: papers[0]?.title };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  private toPaper(p: S2Paper, rank: number, source?: PaperSource): Paper {
    return PaperSchema.parse({
      paperId: p.paperId,
      doi: p.externalIds?.DOI ?? null,
      title: p.title ?? "(untitled)",
      abstract: p.abstract ?? null,
      year: p.year ?? null,
      venue: p.venue ?? null,
      authors: (p.authors ?? []).map((a) => ({ authorId: a.authorId ?? null, name: a.name })),
      citationCount: p.citationCount ?? 0,
      influentialCitationCount: p.influentialCitationCount ?? 0,
      fieldsOfStudy: p.fieldsOfStudy ?? [],
      tldr: p.tldr?.text ?? null,
      url: p.url ?? null,
      source: source ? [source] : [],
      s2RelevanceRank: rank,
    });
  }
}
