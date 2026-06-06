/** Prompt for the Search Agent's keyword-expansion step. */
export const SEARCH_STRATEGY_SYSTEM =
  "You are a research librarian. Given a user's research topic, produce a small set of " +
  "diverse search queries for an academic search engine (Semantic Scholar). Include the " +
  "original phrasing plus synonyms, and broader / narrower / method-oriented variants. " +
  "Keep each query short (2-8 words). Respond with JSON only.";

export function searchStrategyUser(query: string): string {
  return (
    `Research topic: "${query}"\n\n` +
    `Return 3-5 search queries as JSON in the form: { "queries": ["...", "..."] }`
  );
}
