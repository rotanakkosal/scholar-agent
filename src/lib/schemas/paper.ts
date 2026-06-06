import { z } from "zod";

/** The four search strategies from Figure 1 (Search Phase). */
export const PaperSource = z.enum(["keyword", "citation", "authors", "venues"]);
export type PaperSource = z.infer<typeof PaperSource>;

export const AuthorSchema = z.object({
  authorId: z.string().nullable(),
  name: z.string(),
});
export type Author = z.infer<typeof AuthorSchema>;

/**
 * A paper as retrieved from Semantic Scholar and normalized for the pipeline.
 * `abstract` CAN be null — S2 frequently omits abstracts for licensing reasons —
 * which is what drives the faithfulness handling downstream.
 */
export const PaperSchema = z.object({
  paperId: z.string(),
  doi: z.string().nullable().default(null),
  title: z.string(),
  abstract: z.string().nullable().default(null),
  year: z.number().int().nullable().default(null),
  venue: z.string().nullable().default(null),
  authors: z.array(AuthorSchema).default([]),
  citationCount: z.number().int().default(0),
  influentialCitationCount: z.number().int().default(0),
  fieldsOfStudy: z.array(z.string()).default([]),
  /** S2's AI-generated one-line summary, when present — extra grounding. */
  tldr: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  /** Which strategies surfaced this paper (unioned after dedup). */
  source: z.array(PaperSource).default([]),
  /** 0-based rank within the strategy that found it (relevance proxy). */
  s2RelevanceRank: z.number().int().nullable().default(null),
});
export type Paper = z.infer<typeof PaperSchema>;
