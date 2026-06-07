# Literature Review: AI/LLM Agents for Automated Literature Review

*Background research (2023–2026) to inform the Scholar Agent design. Compiled via a multi-source, adversarially-verified deep-research pass (28 sources fetched, 134 claims extracted, 25 verified, 21 confirmed). Claims below carry a confidence level and the verification vote.*

## TL;DR

Recent work converges on **exactly the architecture our proposal targets**: an LLM expands search queries → retrieves from scholarly sources → re-ranks → synthesizes citation-grounded text → **iteratively self-refines via an LLM-as-Judge / feedback loop**. Systems like **AutoSurvey2**, **Agentic AutoSurvey**, **STORM**, **LitLLM**, **Ai2 Scholar QA**, and **OpenScholar** all instantiate the Search → Summarize → Judge → refine pattern. **OpenScholar's up-to-T=3 retrieval-augmented self-feedback loop is the closest published analog to our T-round design.**

The central cautionary theme: **LLM-as-Judge is biased and internally inconsistent**, so judge scores in a refinement loop must be used defensively.

## Notable systems

| System | What it is | Architecture | Notes |
|---|---|---|---|
| **AutoSurvey2** (arXiv:2510.26012) | Automated survey generation | 4-stage DAG (Research Planning → Research → Generation → Post-processing) with shared global state; semantic RAG (nomic-embed-text-v2, pgvector), ~1,500 papers for planning / 20 per section | Validates planner→searcher→writer→evaluator decomposition |
| **Agentic AutoSurvey** (arXiv:2509.18661) | Multi-agent survey generation | 4 agents: Paper Search Specialist, Topic Mining & Clustering, Survey Writer, Quality Evaluator; 12-dimension judge rubric | Reports 8.18/10 vs AutoSurvey 4.77/10 (self-reported, 6 topics) |
| **STORM** (stanford-oval/storm) | Wikipedia-style article writer | Pre-writing (retrieve refs, multi-perspective question-asking, outline) → writing (citation-grounded) | "Multi-perspective question asking" broadens coverage |
| **LitLLM** (arXiv:2412.15249, TMLR 2025) | Related-work generator | (1) LLM keyword extraction → (2) Semantic Scholar / SERP search → (3) LLM re-ranking → (4) plan-based generation | Source of the hybrid-retrieval and plan-based-generation numbers below |
| **OpenScholar** (arXiv:2411.14199, later Nature) | Retrieval-augmented scientific QA | Draft → **open-ended NL self-feedback** (can trigger new retrieval) → refine, up to **T=3** | **Closest analog to our refine loop**; citation accuracy on par with human experts |
| **Ai2 Scholar QA** (arXiv:2504.10861, ACL 2025) | End-to-end literature synthesis | RAG + neural cross-encoder re-ranker (top-50 passages) → multi-section output with passage-level citation "paper cards" | Production attribution pattern |
| **Self-Refine** (arXiv:2303.17651) | General self-improvement method | One LLM in 3 roles (generate → feedback → refine), no training | ~20% absolute avg gain over single-pass (self-reported) |

## Verified findings (with citations)

1. **Multi-agent planner→searcher→summarizer→evaluator pipelines are the dominant architecture.** *(high, 3-0)* — AutoSurvey2, Agentic AutoSurvey, STORM. **→ Our Search → Summary → Judge decomposition is the standard.**
2. **Hybrid keyword + embedding retrieval beats either alone by ~10% precision / ~30% recall.** *(high, 3-0; LitLLM RollingEval)* — also AutoSurvey2 (pgvector RAG) and Ai2 Scholar QA (cross-encoder rerank). **→ Consider adding embedding retrieval + a re-rank stage.**
3. **LLM query expansion + multi-perspective questions broaden coverage.** *(high, 3-0; LitLLM, STORM)* — **→ Generate multiple diverse queries (we already do keyword expansion).**
4. **Plan-then-write generation cuts hallucinated references 18–26%** *(high, 3-0; LitLLM)* — but **does not eliminate** them. **→ Plan before writing; still verify downstream.**
5. **Self-refinement with self-generated feedback works and is training-free** *(high, 3-0; Self-Refine ~20% gain; OpenScholar T=3)*. OpenScholar's feedback is **open-ended NL and can trigger new retrieval**. **→ Near-exact template for our T-round loop, incl. retrieval-on-demand.**
6. **No-ground-truth quality is evaluated with a multi-dimension LLM-judge rubric** *(high, 3-0; Agentic AutoSurvey 12-dim across Core Quality / Writing / Content Depth)*. **→ Our 4-dimension rubric (Clarity, Key Finding, Faithfulness, Consistency) is aligned.**
7. **Citation Precision / Recall / F1 are computable, ground-truth-free faithfulness metrics** *(high, 3-0; OpenScholar)*. GPT-4o **hallucinates citations 78–90% without retrieval**. **→ Compute a citation/claim-support metric.**
8. **LLM-as-Judge is systematically biased** (position, verbosity, self-enhancement, authority) **and internally inconsistent** (non-transitive; pointwise ≠ pairwise) *(high, 3-0; LLMs-as-Judges survey arXiv:2412.05579; CALM arXiv:2410.02736 quantifies 12 bias types)*. **→ Use judge scores defensively (see recommendations).**
9. **Pairwise judging mirrors human preference and is better when differences are subtle** *(high, 3-0)*; pointwise scores absolute quality but misses relative differences. **→ For refine loop, compare round t vs t-1 pairwise.**
10. **Abstract-only retrieval has very low coverage (~7% of ground-truth citations)** *(medium, 2-1; LitLLM keyword-only best; ~8–10% with SPECTER2 embeddings)*. **→ Don't rely on a single abstract-derived query; hybrid + snowballing.**
11. **End-to-end systems (Ai2 Scholar QA) show RAG + rerank + passage-level citation attribution** *(high, 3-0)*.

## Recommendations for our build

### ✅ What we already do right (now literature-backed)
- **Search → Summary → Judge → refine** architecture (Findings 1, 5).
- **LLM query expansion** in the Search Agent (Finding 3).
- **Multi-dimension judge rubric** (Finding 6).
- **Deterministic judge** (temperature 0 + fixed seed) — mitigates some judge bias (Finding 8).
- **Faithfulness grounded against the abstract** + code-recomputed pass/fail (not trusting the model's own verdict) (Finding 8).
- **Code-side pass/fail recomputation** — guards against the judge "talking its way" to a pass.

### 🔼 Worth adopting (high value, in scope)
1. **Different model for the judge** — using `qwen3-14b` to judge its *own* summaries invites **self-enhancement bias** (Finding 8). Add a second model on the vLLM server (e.g., a Gemma/Llama) as the judge. *This directly addresses the proposal's "single-model bias" limitation, with citations.*
2. **Computable faithfulness metric** — abstract↔summary claim-support / n-gram overlap, reported alongside judge scores (Finding 7). Honest framing: *"faithful to the abstract"* (we only have abstracts).
3. **Pairwise refine decision** — judge "is round t better than t-1?" rather than only pointwise scores (Finding 9); keep-best across rounds.
4. **Bias controls in the judge prompt** — length/verbosity neutrality; randomize order for any pairwise comparison (Finding 8).
5. **Retrieval-on-demand in the loop (stretch)** — if the judge flags missing info, trigger a new search (OpenScholar pattern, Finding 5).

### 🔮 Out of scope / future work
- **Embedding retrieval + neural re-ranker** (Finding 2): big retrieval gains but needs a vector store + embedding model. Document as future work; our proposal scope is metadata-based.
- **Long-form survey generation** (AutoSurvey2/STORM): we extract structured fields, not write a full survey.

### ⚠️ Pitfalls to avoid (cite these in the limitations section)
- **Pure intrinsic self-correction can fail/degrade without external feedback** (*"LLMs Cannot Self-Correct Reasoning Yet"*, arXiv:2310.01798). → Our loop relies on a *separate* judge grounded against the abstract — keep it that way; don't rely on the model critiquing itself unaided.
- **Don't over-claim retrieval coverage** — abstract-derived queries miss most relevant papers (~7%, Finding 10). Matches the proposal's "no ground truth for most-relevant" limitation.
- **Quantitative gains above come from GPT-4-class models** on LitLLM's own benchmark — **may not transfer to a local Qwen model**. → Measure on our own setup; don't quote others' numbers as ours.

## Caveats & refuted claims (honesty notes)
Refuted during verification — **do NOT cite these**: that Ai2 Scholar QA uses the Semantic Scholar API / full-text, a multi-agent query-expansion decomposition, or ScholarQABench human eval (all 0-3); and the specific design of AutoSurvey2's no-ground-truth evaluation (1-2, uncertain). Several headline numbers (8.18 vs 4.77; 78–90% hallucination; ~20% Self-Refine gain) are single-paper, self-reported, author-selected-task results, not independently replicated.

## Key references
- AutoSurvey2 — arXiv:2510.26012 · Agentic AutoSurvey — arXiv:2509.18661 · STORM — github.com/stanford-oval/storm
- LitLLM — arXiv:2412.15249 (TMLR 2025) · OpenScholar — arXiv:2411.14199 · Ai2 Scholar QA — arXiv:2504.10861 (ACL 2025)
- Self-Refine — arXiv:2303.17651 · LLMs-as-Judges survey — arXiv:2412.05579 · CALM (judge bias) — arXiv:2410.02736
- LLMs Cannot Self-Correct Reasoning Yet — arXiv:2310.01798
