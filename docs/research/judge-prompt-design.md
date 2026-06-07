# Judge Prompt Design — Literature Review (prepared, not yet applied)

**Goal:** find the best-practice prompt design for our LLM-as-Judge so it discriminates
quality properly instead of returning **5/5 for everything** (a leniency / score-clustering
problem). This is research + a ready-to-apply draft. **No code changed yet.**

---

## 1. What's actually causing the constant 5/5

The literature names this directly — it is a *known* failure mode of LLM judges, not unique to us:

- **Leniency / "agreeableness" / positivity bias** — LLM judges over-label outputs as good and
  rate generously (high true-positive, low true-negative rate). [NUS: Beyond Consensus]
- **Score clustering / mid-scale (or top-scale) compression** — judges avoid extreme ratings and
  pile up at one part of the scale; on a 1–5 scale a lenient judge gives mostly 5s. [LLM-as-a-Judge Scoring]
- **Small judges are worse at this** — `gemma-4-e4b` (~4B) discriminates less finely than large models.

**Empirically encouraging:** *detailed* rubric prompts produce **lower (harsher), more objective
scores** than minimal prompts — structured reasoning suppresses superficial features. So the fix is
**more structure, not less.** [Rubric-Based Evaluations, Masood 2026; Scoring Bias, arXiv:2506.22316]

## 2. The reference frameworks (what good judge prompts do)

| Framework | Core idea we can borrow |
|---|---|
| **G-Eval** (Liu et al., 2023, arXiv:2303.16634) | (1) Decompose the criterion into explicit **evaluation steps** via CoT; (2) **form-filling** — reason, then fill a structured score; (3) **probability-weighted scoring** `score = Σ p(sᵢ)·sᵢ` to produce a *continuous* score and break ties (anti-clustering). |
| **Prometheus / Prometheus-2** (Kim et al., 2023/24, arXiv:2310.08491 / 2405.01535) | A reliable evaluator needs 4 inputs: **instruction, response, a score rubric with a written description for EVERY level 1–5, and a reference**. Output = **feedback (rationale) first, then the score**. Reaches ~0.90 correlation with humans. |
| **MT-Bench / "Judging LLM-as-a-Judge"** (Zheng et al., 2023, arXiv:2306.05685) | Catalogs **position, verbosity, self-enhancement** biases and mitigations (swap order, control length, use a different judge model). |
| **FLASK** (Ye et al., 2023, arXiv:2307.10928) | Fine-grained, **skill-separated** rubric scoring rather than one holistic score. |

## 3. Biases — and which ones apply to us

| Bias | Applies to us? | Mitigation |
|---|---|---|
| **Leniency / positivity** | ✅ **our main issue** | Detailed rubric; explicit "be critical, reserve top scores"; force naming weaknesses first |
| **Score clustering** | ✅ | Per-level anchors for *all* 1–5; probability-weighted score (advanced) |
| **Verbosity** (longer = higher) | ✅ likely | Add line: *"do not reward length; judge only on content"* (≈ halves the bias) |
| **Self-enhancement** (grades own family higher) | ✅ mitigated | **Already handled** — Gemma judges, Qwen writes |
| **Position bias** | ❌ | N/A — we score one summary absolutely, not pairwise |
| **Format bias** | ⚠️ minor | Keep rubric format neutral |

## 4. Best-practice prompt principles (consensus)

1. **Criterion-by-criterion structured reasoning**, never "is this good?" — separate dimensions, reason each. *(we do: 4 dims)*
2. **Reason BEFORE score** (G-Eval form-filling, Prometheus feedback-first). *(we do)*
3. **Per-level anchors for every score 1–5** (Prometheus), not just 5/3/1. *(we have 5/3/1 — add 4 and 2)*
4. **Explicit anti-leniency instruction**: act as a critical reviewer; reserve 5 for flawless; most good work is 3–4. *(missing)*
5. **Force a weakness first** ("state ≥1 weakness or 'none'") — directly counters agreeableness bias. *(partially: we have `assessment`/`feedback`; make it an explicit weakness list)*
6. **Anti-verbosity line**: judge content, not length. *(missing)*
7. **Provide a reference** (Prometheus) — for us the **abstract is the reference/source of truth**. *(we do for faithfulness)*
8. **Probability-weighted continuous score** (G-Eval) — reduces clustering. *(advanced/optional; needs token-logprobs from the endpoint)*
9. **Few-shot calibration example** — show one "this is a 3, here's why" example. *(optional)*
10. **Self-consistency** — average several runs / fixed seed for stability. *(we use temp 0 + seed)*

## 5. Recommended changes to OUR judge prompt (concrete, ready to apply)

Keep the structure we have; **add the missing debiasing pieces**:

- **A. Full 1–5 anchors** for each of clarity / keyFinding / faithfulness / consistency (fill in 4 and 2, not just 5/3/1).
- **B. Critical-reviewer framing**: *"You are a demanding reviewer. Reserve 5 for a flawless field; a solid but improvable summary scores 3–4. Do not inflate."*
- **C. Weakness-first**: *"Before scoring, list at least one concrete weakness (or write 'no weaknesses found')."*
- **D. Anti-verbosity**: *"Judge only on content and faithfulness to the abstract — never reward length or fluent wording."*
- **E. (optional, advanced)** probability-weighted scoring à la G-Eval, and/or a one-shot calibration example.

### Draft `JUDGE_SYSTEM` (for review — not applied)

> You are a **demanding, critical peer reviewer** evaluating a SUMMARY of a paper against its ABSTRACT.
> Evaluate ONLY against the abstract — no outside knowledge, no hallucination. Judge **content and
> faithfulness only**; never reward length or fluent wording.
>
> First, in `assessment`, state **at least one concrete weakness** (or "no weaknesses found").
> Then for EACH dimension give a one-sentence `reason`, then an integer `score` 1–5. **Be strict:
> reserve 5 for a flawless field; a solid-but-improvable one is 3–4.** Anchors:
> - **clarity** — 5 precise & unambiguous · 4 clear, minor wordiness · 3 understandable but loose · 2 vague/awkward · 1 confusing
> - **keyFinding** — 5 captures the main contribution exactly · 4 mostly, minor omission · 3 partial/peripheral · 2 largely misses · 1 wrong
> - **faithfulness** — 5 every claim supported · 4 supported, one slightly over-stated · 3 mostly, ≥1 vague claim · 2 an unsupported claim · 1 clear hallucination
> - **consistency** — 5 fully consistent · 4 minor tension · 3 noticeable tension · 2 partly contradictory · 1 contradictory
>
> List every claim NOT supported by the abstract in `unsupportedClaims`; give actionable `feedback`. JSON only.

## 6. How to validate (before/after)

Re-run `npm run benchmark` and compare **score spread**: a good prompt should keep rejecting the
flawed summaries (0% bad-pass) while spreading the *good* ones across 3–5 instead of all 5s — and
should NOT start failing genuinely good summaries (the over-strict failure mode we saw with Qwen-as-judge).

## References

- Liu et al. *G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment.* arXiv:2303.16634 (2023).
- Kim et al. *Prometheus: Inducing Fine-grained Evaluation Capability in Language Models.* arXiv:2310.08491 (2023); *Prometheus 2*, arXiv:2405.01535 (2024).
- Zheng et al. *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* arXiv:2306.05685 (2023).
- Ye et al. *FLASK: Fine-grained Language Model Evaluation based on Alignment Skill Sets.* arXiv:2307.10928 (2023).
- *Evaluating Scoring Bias in LLM-as-a-Judge.* arXiv:2506.22316 (2025).
- *LLMs-as-Judges: A Comprehensive Survey.* arXiv:2412.05579 (2024).
- *Beyond Consensus: Mitigating the Agreeableness Bias in LLM Judge Evaluations.* NUS (2025).
