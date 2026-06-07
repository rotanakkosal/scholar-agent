import { z } from "zod";
import { config } from "../config";
import { callStructured, type LLMClient } from "../llm/index";
import {
  DECOMPOSE_SYSTEM,
  decomposeUser,
  VERIFY_SYSTEM,
  verifyUser,
} from "../llm/prompts/claimFaithfulness.prompt";
import type { SummaryDraft } from "../schemas/summary";
import type { ClaimCheck, ClaimFaithfulness } from "../schemas/judge";

const DecomposeSchema = z.object({
  claims: z.array(z.string()).default([]),
});

const VerifySchema = z.object({
  verdicts: z
    .array(
      z.object({
        claim: z.string().default(""),
        reason: z.string().default(""),
        supported: z.boolean(),
      }),
    )
    .default([]),
});

/** Cap claims so a verbose summary can't blow up token use. */
const MAX_CLAIMS = 12;

export interface ClaimFaithfulnessDeps {
  llm: LLMClient;
  model: string;
  signal?: AbortSignal;
}

/**
 * Claim-level faithfulness (RAGAS / FActScore style): decompose the summary into
 * atomic claims, verify each against the abstract, and score supported/total.
 * Reference-free and explainable. Returns null if there is no abstract, no claims,
 * or the model calls fail — callers treat it as "not computed" (never fatal).
 *
 * Run this on a DIFFERENT model than the summarizer (e.g. the judge/Gemma) so the
 * generator does not grade its own output.
 */
export async function assessClaimFaithfulness(
  draft: SummaryDraft,
  abstract: string | null,
  deps: ClaimFaithfulnessDeps,
): Promise<ClaimFaithfulness | null> {
  if (!abstract) return null;
  const summaryText = `${draft.methodology} ${draft.contribution}`.trim();
  if (!summaryText) return null;

  // 1. Decompose the summary into atomic claims.
  let claims: string[];
  try {
    const decomposed = await callStructured({
      client: deps.llm,
      model: deps.model,
      schema: DecomposeSchema,
      messages: [
        { role: "system", content: DECOMPOSE_SYSTEM },
        { role: "user", content: decomposeUser(summaryText) },
      ],
      temperature: 0,
      numCtx: config.llm.numCtx,
      maxTokens: config.pipeline.maxOutputTokens,
      signal: deps.signal,
    });
    claims = decomposed.claims.map((c) => c.trim()).filter(Boolean).slice(0, MAX_CLAIMS);
  } catch {
    return null;
  }
  if (claims.length === 0) return null;

  // 2. Verify each claim against the abstract.
  let verdicts: Array<{ claim: string; reason: string; supported: boolean }>;
  try {
    const verified = await callStructured({
      client: deps.llm,
      model: deps.model,
      schema: VerifySchema,
      messages: [
        { role: "system", content: VERIFY_SYSTEM },
        { role: "user", content: verifyUser(abstract, claims) },
      ],
      temperature: 0,
      numCtx: config.llm.numCtx,
      maxTokens: config.pipeline.maxOutputTokens,
      signal: deps.signal,
    });
    verdicts = verified.verdicts;
  } catch {
    return null;
  }

  // Align verdicts to claims by position (the prompt asks to keep order); a missing
  // verdict counts as unsupported (conservative).
  const checks: ClaimCheck[] = claims.map((claim, i) => ({
    claim,
    supported: verdicts[i]?.supported ?? false,
    reason: verdicts[i]?.reason ?? "",
  }));
  const supported = checks.filter((c) => c.supported).length;
  return {
    score: checks.length ? supported / checks.length : 0,
    supported,
    total: checks.length,
    claims: checks,
  };
}
