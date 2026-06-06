import { z } from "zod";
import { config } from "../config";
import { callStructured, type LLMClient } from "../llm/index";
import { SEARCH_STRATEGY_SYSTEM, searchStrategyUser } from "../llm/prompts/searchStrategy.prompt";
import type { SemanticScholarClient } from "../clients/SemanticScholarClient";
import type { Paper, PaperSource } from "../schemas/paper";
import type { ProgressEmitter } from "../schemas/events";
import { dedupePapers } from "./rank";

const QueryVariantsSchema = z.object({
  queries: z.array(z.string().min(2)).min(1).max(6),
});

export interface SearchAgentOptions {
  query: string;
  strategies: PaperSource[];
  /** Used to size per-query result limits before ranking down to Top-K. */
  topKHint: number;
  yearFrom?: number | null;
  /** Model used for query expansion (defaults to the summary model). */
  model?: string;
  llm: LLMClient;
  s2: SemanticScholarClient;
  emit?: ProgressEmitter;
  signal?: AbortSignal;
}

/**
 * Search Phase (Figure 1). Expands the query via enabled strategies, queries
 * Semantic Scholar, and returns a deduplicated candidate set (ranking to Top-K
 * happens in rank.ts). v1 implements Keyword + Citation; Authors/Venues are
 * accepted but currently fold into the keyword pass.
 */
export async function searchAgent(opts: SearchAgentOptions): Promise<Paper[]> {
  const model = opts.model ?? config.llm.summaryModel;
  const year = opts.yearFrom ? `${opts.yearFrom}-` : undefined;
  const collected: Paper[] = [];

  // --- Keyword strategy: expand the query into variants, then search each. ---
  if (opts.strategies.includes("keyword") || opts.strategies.length === 0) {
    let queries = [opts.query];
    try {
      const expanded = await callStructured({
        client: opts.llm,
        model,
        schema: QueryVariantsSchema,
        messages: [
          { role: "system", content: SEARCH_STRATEGY_SYSTEM },
          { role: "user", content: searchStrategyUser(opts.query) },
        ],
        temperature: 0.3,
        maxTokens: 300,
        signal: opts.signal,
      });
      queries = dedupeStrings([opts.query, ...expanded.queries]).slice(0, 5);
    } catch {
      // If expansion fails (e.g. LLM unreachable), fall back to the raw query.
    }
    opts.emit?.({ type: "search_strategy", strategy: "keyword", queries });

    const perQuery = Math.max(5, Math.ceil((opts.topKHint * 3) / queries.length));
    for (const q of queries) {
      const papers = await opts.s2.search(q, {
        limit: perQuery,
        year,
        source: "keyword",
        signal: opts.signal,
      });
      collected.push(...papers);
    }
  }

  // --- Citation strategy: snowball from the strongest keyword hits. ---
  if (opts.strategies.includes("citation") && collected.length > 0) {
    const seeds = dedupePapers(collected).slice(0, 2);
    for (const seed of seeds) {
      const [refs, cites] = await Promise.all([
        opts.s2.references(seed.paperId, { limit: 10, signal: opts.signal }).catch(() => []),
        opts.s2.citations(seed.paperId, { limit: 10, signal: opts.signal }).catch(() => []),
      ]);
      collected.push(...refs, ...cites);
    }
    opts.emit?.({
      type: "search_strategy",
      strategy: "citation",
      queries: seeds.map((s) => s.title),
    });
  }

  return dedupePapers(collected);
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}
