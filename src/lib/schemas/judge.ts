import { z } from "zod";

/** The four rubric dimensions from Figure 1 (Evaluation Rubric). */
export const RubricDimension = z.enum(["clarity", "keyFinding", "faithfulness", "consistency"]);
export type RubricDimension = z.infer<typeof RubricDimension>;

/**
 * `reason` comes BEFORE `score` on purpose: in schema-constrained generation the
 * model emits fields in order, so it must justify first and then commit a number
 * (chain-of-thought ordering, à la AI Scientist-v2's reviewer).
 */
export const RubricScoreSchema = z.object({
  reason: z.string().min(1),
  score: z.number().int().min(1).max(5),
});
export type RubricScore = z.infer<typeof RubricScoreSchema>;

/**
 * What the LLM judge is asked to return. It writes a brief `assessment` first
 * (reason-before-score), then per-dimension scores. It does NOT return `pass` or
 * `overall` — those are computed in code so the model can never "talk its way" to
 * a pass.
 */
export const JudgeDraftSchema = z.object({
  /** Brief overall reasoning, written before the scores. */
  assessment: z.string().min(1),
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

/** Full verdict = the LLM's draft + code-computed pass / overall / grounding. */
export const JudgeVerdictSchema = JudgeDraftSchema.extend({
  pass: z.boolean(),
  overall: z.number(),
  /** Deterministic abstract-grounding score in [0,1] (model-independent). */
  faithfulnessOverlap: z.number(),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;
