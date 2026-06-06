import { config } from "../config";
import { normalizeTitle } from "../util/text";
import type { Paper } from "../schemas/paper";

/**
 * Deduplicate papers by DOI → paperId → normalized title, merging the `source`
 * tags and keeping the better record (one with an abstract / lower relevance rank).
 */
export function dedupePapers(papers: Paper[]): Paper[] {
  const byKey = new Map<string, Paper>();
  for (const p of papers) {
    const key = p.doi
      ? `doi:${p.doi.toLowerCase()}`
      : p.paperId
        ? `id:${p.paperId}`
        : `title:${normalizeTitle(p.title)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...p, source: [...p.source] });
      continue;
    }
    const merged = pickBetter(existing, p);
    const source = Array.from(new Set([...existing.source, ...p.source])) as Paper["source"];
    byKey.set(key, { ...merged, source });
  }
  return [...byKey.values()];
}

function pickBetter(a: Paper, b: Paper): Paper {
  if (!!a.abstract !== !!b.abstract) return a.abstract ? a : b;
  const ra = a.s2RelevanceRank ?? Number.MAX_SAFE_INTEGER;
  const rb = b.s2RelevanceRank ?? Number.MAX_SAFE_INTEGER;
  return ra <= rb ? a : b;
}

/**
 * Rank to the Top-K using a transparent proxy score. There is no ground truth
 * for "most relevant", so we combine S2 relevance rank, citation signals,
 * recency, multi-strategy agreement, and abstract availability — all weighted
 * in config so the choice is auditable.
 */
export function rankTopK(papers: Paper[], k: number): Paper[] {
  if (papers.length === 0) return [];
  const w = config.ranking.weights;
  const currentYear = new Date().getFullYear();
  const maxCite = Math.max(1, ...papers.map((p) => p.citationCount));
  const maxInfl = Math.max(1, ...papers.map((p) => p.influentialCitationCount));

  const scored = papers.map((paper) => {
    const relevance = paper.s2RelevanceRank === null ? 0.5 : 1 / (1 + paper.s2RelevanceRank);
    const citations = Math.log1p(paper.citationCount) / Math.log1p(maxCite);
    const influential = Math.log1p(paper.influentialCitationCount) / Math.log1p(maxInfl);
    const recency = paper.year ? clamp01((paper.year - (currentYear - 15)) / 15) : 0.3;
    const multiStrategy = paper.source.length > 1 ? 1 : 0;
    const hasAbstract = paper.abstract ? 1 : 0;
    const score =
      w.relevance * relevance +
      w.citations * citations +
      w.influential * influential +
      w.recency * recency +
      w.multiStrategy * multiStrategy +
      w.hasAbstract * hasAbstract;
    return { paper, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => s.paper);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
