import { z } from "zod";

/**
 * The slice the LLM is asked to produce for a paper. Kept deliberately small so
 * the model only does extraction; non-LLM fields (title, doi, year) are filled
 * in code from the Paper.
 */
export const SummaryDraftSchema = z.object({
  methodology: z.string().min(1),
  contribution: z.string().min(1),
});
export type SummaryDraft = z.infer<typeof SummaryDraftSchema>;

/**
 * A full results row — exactly the columns of Table 1 in the proposal:
 * Title | Abstract | Published Year | DOI | Methodology | Contribution.
 */
export const PaperSummarySchema = z.object({
  paperId: z.string(),
  title: z.string(),
  abstract: z.string(),
  publishedYear: z.number().int().nullable(),
  doi: z.string().nullable(),
  methodology: z.string(),
  contribution: z.string(),
  /** How many revision rounds this row went through before passing / stopping. */
  revisions: z.number().int().default(0),
  /** False when S2 had no abstract — methodology/contribution are then best-effort. */
  abstractAvailable: z.boolean(),
});
export type PaperSummary = z.infer<typeof PaperSummarySchema>;
