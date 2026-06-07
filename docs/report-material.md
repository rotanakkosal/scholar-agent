# Report Material — Scholar Agent

> Paste-ready drafts for the final report (AI System II). Adapt wording as needed.
> Numbers are from our own runs; cite the papers listed at the end.

---

## 1. Related Work

Automated literature review with LLMs has converged on a **retrieve → summarize → verify → refine** pattern, and our system follows it deliberately.

- **Specialist vs. orchestration.** **SciLitLLM** (Li et al., 2024, arXiv:2408.15545) adapts an LLM to scientific text by *training* it — continual pre-training on science corpora plus supervised fine-tuning on synthesized instructions, filtered along clarity/correctness/usefulness dimensions. We take the complementary, lower-cost route: **orchestrate off-the-shelf models (Qwen, Gemma) with retrieval grounding**, rather than training a specialist model.
- **Multi-agent scientific systems.** **AI Scientist-v2** (Yamada, Lange, Lu et al., 2025, arXiv:2504.08066) automates the full research loop with an agentic tree search, a Semantic-Scholar-grounded idea stage, and an **LLM/VLM reviewer** that scores drafts with an anchored rubric and a reason-before-score format. We borrow its **prompt-design techniques** (anchored numeric rubric, reason-before-score, careful self-revision) for our judge and reviser.
- **Survey of the field.** Gridach et al. (2025, arXiv:2503.08979) survey agentic AI for scientific discovery and explicitly identify **literature review as the hardest, "weakest-link" stage**, recommending multi-stage pipelines, retrieval grounding, citation-attribution checks, self-critique loops, and human-in-the-loop.
- **Component techniques** we build on: **Self-RAG** (Asai et al., 2024) and **HyDE / precise zero-shot dense retrieval** (Gao et al., 2023) for retrieval; **Self-Refine** (Madaan et al., 2023, arXiv:2303.17651) and **OpenScholar's** up-to-T=3 retrieval-augmented self-feedback (arXiv:2411.14199) for our refinement loop; and the **LLM-as-a-Judge** literature (Pan et al., 2026; *LLMs-as-Judges* survey, arXiv:2412.05579) for the evaluator, including its documented biases.

**Positioning.** Compared with survey-generation systems (AutoSurvey2, STORM, LitLLM) that write long related-work sections, our scope is narrower and more verifiable: extract a **structured per-paper record** (Methodology, Contribution) and **gate it with a faithfulness-focused judge**, plus a cross-paper **disagreement** pass.

## 2. Method (design + rationale)

The pipeline mirrors the proposal's Figure 1 and the field-standard pattern:

1. **Search Agent.** An LLM expands the query into several search variants; we query the **Semantic Scholar Graph API** (keyword search + citation snowballing via references/citations), deduplicate (DOI → id → title), and rank to **Top-K** with a transparent proxy score (relevance rank, citation counts, recency, multi-strategy agreement, abstract availability).
2. **Summary Agent (Qwen).** Extracts *methodology* and *contribution* **using only the abstract**; outputs "Not stated in abstract" when unsupported. Structured JSON enforced by a JSON-schema + Zod validate-and-repair loop.
3. **LLM-as-Judge (Gemma — a different model family).** Scores four rubric dimensions (Clarity, Key Finding, Faithfulness, Consistency) on a 1–5 **anchored** scale, writing a `reason` *before* each `score` (chain-of-thought ordering). **Pass/fail is computed in code**, not by the model; faithfulness is gated hardest (≥4 **and** zero unsupported claims).
4. **Refine loop (≤ T rounds).** On failure, the summary is revised from the judge's feedback and re-judged, keeping the best-scoring draft. Grounded, external feedback — not blind self-critique.
5. **Cross-paper disagreements.** A final pass surfaces **candidate** contradictions between papers, quoting the exact abstract sentences as evidence; conservative (ignores non-conflicts) and clearly labelled *abstract-only*.

**Design choices justified by the literature:**
- *Dual-model judge (Qwen writes, Gemma judges)* — mitigates the **self-enhancement bias** documented for LLM judges (arXiv:2412.05579).
- *Anchored rubric + reason-before-score* — from AI Scientist-v2; in our ablation it removed a score-ceiling effect (see §3).
- *Grounded refinement* — Self-Refine / OpenScholar; and because intrinsic self-correction can fail without external feedback (*LLMs Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798), our judge is a separate, abstract-grounded checker.
- *Deterministic faithfulness metric* — a model-independent cross-check alongside the judge.

## 3. Evaluation

Because there is **no ground truth** for "the most relevant papers," we use intrinsic/proxy measures (as the field does).

### 3.1 Judge-ablation (discrimination test)
For each of **8 papers** with real abstracts, we generate a genuine summary and a **deliberately flawed (hallucinated)** one, and ask each judge to pass the real and reject the flawed. A good judge **approves real** and **rejects fake**.

| Judge | Approves real ↑ | Lets fake through ↓ | Detection accuracy ↑ | Score gap (good−bad) ↑ |
|---|---|---|---|---|
| **gemma-4-e4b** (our judge) | **88%** | **0%** | **94%** | 3.38 |
| qwen3-14b (comparison) | 0% | 0% | 50% | 2.94 |

**Findings:** (1) both judges reject **100%** of hallucinated summaries — the faithfulness gate works; (2) the well-calibrated judge is **Gemma** (approves 7/8 real, rejects all fake), which **empirically justifies the dual-model choice**; (3) Qwen-as-judge is over-strict (rejects even good summaries), illustrating that *the choice of judge matters*. Before adopting the anchored rubric, both judges scored everything 5/5 (a ceiling effect) — the rubric is what made the judges discriminate.

### 3.2 Faithfulness (model-independent)
We also compute **abstract-grounding** = fraction of summary content-words found in the abstract (e.g., ~0.82 on the fixture set). It complements the judge's faithfulness score with a deterministic signal.

### 3.3 Other computable proxies
Per-strategy contribution to the Top-K, S2 relevance rank, and citation counts (retrieval quality); rounds-to-pass and per-dimension score distributions (refinement efficiency).

## 4. Limitations

1. **Abstract-only.** We judge and compare against the **abstract**, not the full paper — so "faithful" means "faithful to the abstract," and cross-paper disagreement detection is a *candidate* hint for the human, not a verdict.
2. **Literature review is intrinsically hard.** Surveys of agentic AI find it the **weakest stage** of such systems (arXiv:2503.08979); imperfect results are expected, not a defect of our implementation.
3. **LLM-judge bias & calibration.** LLM judges are biased and inconsistent (arXiv:2412.05579); we mitigate with a *different* judge model, deterministic inference, code-computed pass/fail, and a model-independent grounding metric — but cannot eliminate it. Our ablation also shows judges differ in strictness.
4. **No ground truth for relevance.** We cannot objectively prove the retrieved papers are the *most* relevant; we report transparent proxies instead.
5. **Single-model family risk (partially mitigated).** Using two families (Qwen + Gemma) reduces shared blind spots, but both are still general-purpose LLMs.
6. **Small evaluation set.** The judge ablation uses 8 papers — directional, not statistically strong.
7. **Operational.** The self-hosted judge endpoint occasionally returns transient errors; retries with backoff absorb short blips, and the system degrades to a single-model judge rather than failing.

## References

- [1] Gridach et al. *Agentic AI for Scientific Discovery: A Survey of Progress, Challenges, and Future Directions.* arXiv:2503.08979 (2025).
- [2] Li et al. *SciLitLLM: How to Adapt LLMs for Scientific Literature Understanding.* arXiv:2408.15545 (2024).
- Yamada, Lange, Lu, et al. *The AI Scientist-v2: Workshop-Level Automated Scientific Discovery via Agentic Tree Search.* arXiv:2504.08066 (2025).
- Lewis et al. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* NeurIPS 2020.
- Asai et al. *Self-RAG.* ICLR 2024.
- Gao et al. *Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE).* ACL 2023.
- Madaan et al. *Self-Refine: Iterative Refinement with Self-Feedback.* arXiv:2303.17651 (2023).
- *OpenScholar.* arXiv:2411.14199 (2024).
- *LLMs-as-Judges: A Comprehensive Survey.* arXiv:2412.05579 (2024).
- Huang et al. *Large Language Models Cannot Self-Correct Reasoning Yet.* arXiv:2310.01798 (2023).

*(See `docs/research/agentic-litreview-survey.md` for the fuller, verified literature notes, and `docs/eval/judge-ablation.md` for the raw benchmark.)*
