import { z } from "zod";

/** One paper's side of a disagreement, with the exact abstract sentence as evidence. */
export const DisagreementSideSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  quote: z.string(),
});
export type DisagreementSide = z.infer<typeof DisagreementSideSchema>;

/**
 * A CANDIDATE disagreement between papers, detected from abstracts only — a hint
 * for the human to verify, not a definitive claim.
 */
export const DisagreementSchema = z.object({
  topic: z.string(),
  sides: z.array(DisagreementSideSchema).min(2),
});
export type Disagreement = z.infer<typeof DisagreementSchema>;
