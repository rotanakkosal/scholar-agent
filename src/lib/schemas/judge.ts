import { z } from "zod";

/** The four rubric dimensions from Figure 1 (Evaluation Rubric). */
export const RubricDimension = z.enum(["clarity", "keyFinding", "faithfulness", "consistency"]);
export type RubricDimension = z.infer<typeof RubricDimension>;

export const RubricScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
  reason: z.string().min(1),
});
export type RubricScore = z.infer<typeof RubricScoreSchema>;

/**
 * What the LLM judge is asked to return. Note it does NOT return `pass` or
 * `overall` — those are computed in code from the scores so the model can never
 * "talk its way" to a pass.
 */
export const JudgeDraftSchema = z.object({
  scores: z.object({
    clarity: RubricScoreSchema,
    keyFinding: RubricScoreSchema,
    faithfulness: RubricScoreSchema,
    consistency: RubricScoreSchema,
  }),
  /** Actionable guidance fed back to the Summary Agent on a failing round. */
  feedback: z.string(),
  /** Claims in the summary not supported by the abstract (faithfulness gate). */
  unsupportedClaims: z.array(z.string()).default([]),
});
export type JudgeDraft = z.infer<typeof JudgeDraftSchema>;

/** Full verdict = the LLM's draft + code-computed pass/overall. */
export const JudgeVerdictSchema = JudgeDraftSchema.extend({
  pass: z.boolean(),
  overall: z.number(),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;
