# Scholar Agent

Scholar Agent takes a research query and automatically:

1. **Searches** academic papers via the Semantic Scholar API (LLM keyword expansion + citation snowballing),
2. **Ranks** and keeps the **Top-K** by a transparent proxy score,
3. **Summarizes** each paper into a structured row (Methodology, Contribution, …),
4. **Judges** each summary with an **LLM-as-Judge** against a rubric (Clarity, Key Finding, Faithfulness, Consistency), looping **Summary → Judge → Refine for up to _T_ rounds** until it passes,
5. **Outputs** a verified results table.

This mirrors the proposal: Figure 1 (Search Phase → Evaluation Phase → Final Phase) and Table 1 (Title, Abstract, Published Year, DOI, Methodology, Contribution).

## Architecture

1. **Next.js 16 (App Router) + TypeScript + Tailwind**: UI and API in one app.
2. **`src/lib/`**: the framework-agnostic pipeline (schemas, LLM client, Semantic Scholar client, agents). Unit-testable and reusable.
3. **Dual-model, provider-agnostic LLM client** supporting **Ollama** (`/api/chat`) and **OpenAI-compatible** (`/v1/...`) APIs. By default the **worker/summarizer (Qwen)** and the **judge (Gemma)** run on **separate endpoints**, two model families, which mitigates the single-model-bias limitation noted in the proposal.
4. **Semantic Scholar Graph API** for retrieval (rate-limited ~1 req/s + exponential-backoff retry).
5. **Zod**: one schema source powering runtime validation, the LLM's JSON-schema output, and TypeScript types.
6. **Faithfulness/grounding metric**: a deterministic, model-independent check reported alongside the judge scores.

See [docs/research/agentic-litreview-survey.md](docs/research/agentic-litreview-survey.md) for the literature grounding this design, and [docs/eval/judge-ablation.md](docs/eval/judge-ablation.md) for the Qwen-vs-Gemma judge benchmark.

## Status

| Milestone | Status | Description |
| --- | --- | --- |
| M0 | Done | Foundations (app, schemas, LLM + Semantic Scholar clients, health check) |
| M1 | Done | Core pipeline (search → rank → summarize → judge → refine _T_ rounds) |
| M2 | Done | API routes + SSE live progress + file-based job store |
| M3 | Done | Web UI (query form, live progress, results table, CSV/MD/JSON export) |
| M4 | Done | Docker deploy (standalone image + compose) |
| M5 | Done | Vitest unit tests + evaluation (faithfulness metric, judge ablation) |
| Future | Planned | embedding retrieval + re-ranker, larger evaluation set, pairwise-refine |

## Getting started

### Prerequisites

1. **Node.js 24+**
2. One or two **LLM endpoints** (Ollama or OpenAI-compatible) for the worker and judge models.
3. Optional: a free **Semantic Scholar API key** (reliable search), semanticscholar.org/product/api.

### Setup

```bash
npm install
cp .env.example .env      # then fill in your endpoints, model names, and S2 key
npm run health            # verify worker LLM, judge LLM, and Semantic Scholar
npm run dev               # start the app at http://localhost:3000
```

### Configuration (`.env`)

| Variable | Meaning |
| --- | --- |
| `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY` | worker (summarizer) endpoint |
| `SUMMARY_MODEL` | worker model name (e.g. `qwen3-14b`) |
| `LLM_DISABLE_THINKING` | `true` for Qwen3 (suppresses `<think>` traces) |
| `JUDGE_LLM_PROVIDER`, `JUDGE_LLM_BASE_URL`, `JUDGE_LLM_API_KEY` | judge endpoint (falls back to worker if unset) |
| `JUDGE_MODEL` | judge model name (e.g. `gemma-4-e4b`) |
| `S2_API_KEY` | Semantic Scholar key (raises rate limits) |
| `TOP_K`, `MAX_ROUNDS` | Top-K papers; max refine rounds (_T_) |

## Run with Docker

The LLM servers and Semantic Scholar are remote, so the container only needs internet + `.env`:

```bash
docker compose up --build       # builds the standalone image, serves on :3000
```

Results are persisted to `./data` (mounted volume).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run health` | check worker LLM + judge LLM + Semantic Scholar |
| `npm run benchmark` | judge-ablation benchmark (Qwen vs Gemma) → `docs/eval/` |
| `npm test` | run the Vitest unit suite |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build` | production build |

There are also developer probes: `scripts/probe-llm.ts` (structured-output smoke test) and `scripts/probe-pipeline.ts` (Summary→Judge→Refine on a sample paper).

## Project structure

```
src/
  app/                 Next.js routes (UI + /api: reviews, health, export)
  components/          QueryForm, ProgressView, ResultsTable
  hooks/               useReview (SSE consumer)
  lib/
    schemas/           Zod contracts (Paper, PaperSummary, JudgeVerdict, …)
    llm/               provider-agnostic client, structured output, prompts
    clients/           Semantic Scholar client (rate-limit + retry)
    pipeline/          searchAgent, rank, summaryAgent, judge, refineLoop, runReview
    eval/              faithfulness metric, judge-ablation benchmark, fixtures
    store/             file-based job store
test/                  Vitest unit tests
scripts/               health, benchmark, probes
docs/                  proposal, research survey, evaluation results
```
