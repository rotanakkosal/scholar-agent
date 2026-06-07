import { z } from "zod";
import { PaperSource } from "./paper";
import { PaperSummarySchema } from "./summary";
import { JudgeVerdictSchema, ClaimFaithfulnessSchema } from "./judge";
import { JobStatus } from "./job";
import { DisagreementSchema } from "./disagreement";

/**
 * Discriminated union of progress events streamed to the client (SSE) and
 * logged by the CLI. The `ts` field is an ISO timestamp added by the emitter.
 */
export const ProgressEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("job_status"), status: JobStatus, ts: z.string() }),
  z.object({
    type: z.literal("phase"),
    phase: z.enum(["search", "evaluation", "final"]),
    state: z.enum(["start", "end"]),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("search_strategy"),
    strategy: PaperSource,
    queries: z.array(z.string()),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("papers_found"),
    found: z.number().int(),
    afterDedup: z.number().int(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("paper_start"),
    paperId: z.string(),
    index: z.number().int(),
    total: z.number().int(),
    title: z.string(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("summary_round"),
    paperId: z.string(),
    round: z.number().int(),
    verdict: JudgeVerdictSchema,
    ts: z.string(),
  }),
  z.object({
    type: z.literal("paper_done"),
    paperId: z.string(),
    summary: PaperSummarySchema,
    claimFaithfulness: ClaimFaithfulnessSchema.nullable().default(null),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("log"),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
    ts: z.string(),
  }),
  z.object({
    type: z.literal("disagreements"),
    items: z.array(DisagreementSchema),
    ts: z.string(),
  }),
  z.object({ type: z.literal("error"), message: z.string(), ts: z.string() }),
  z.object({ type: z.literal("done"), result: z.array(PaperSummarySchema), ts: z.string() }),
]);
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/** An event before the emitter stamps it with `ts`. */
export type ProgressEventInput = DistributiveOmit<ProgressEvent, "ts">;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Sink for progress events. The pipeline calls this; the CLI/API decide what to do. */
export type ProgressEmitter = (event: ProgressEventInput) => void;
