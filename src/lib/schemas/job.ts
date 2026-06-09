import { z } from "zod";
import { PaperSource } from "./paper";

/** Parameters that define a literature-review run. */
export const JobParamsSchema = z.object({
  query: z.string().min(3),
  topK: z.number().int().min(1).max(50).default(5),
  /** T — max Summary↔Judge refinement rounds. 0 = summarize once, no judging loop. */
  maxRounds: z.number().int().min(0).max(5).default(2),
  strategies: z.array(PaperSource).min(1).default(["keyword"]),
  /** Paper IDs to skip (already in the project) — powers "find more papers". */
  excludePaperIds: z.array(z.string()).default([]),
  /** Override default models (else config.llm.summaryModel / judgeModel). */
  summaryModel: z.string().optional(),
  judgeModel: z.string().optional(),
  yearFrom: z.number().int().nullable().default(null),
  yearTo: z.number().int().nullable().default(null),
});
export type JobParams = z.infer<typeof JobParamsSchema>;
