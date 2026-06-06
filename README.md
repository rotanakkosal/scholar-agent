# Scholar Agent

> An agentic pipeline for literature review — final project for **AI System II** (Department of Big Data).

Scholar Agent takes a research query and automatically:

1. **Searches** academic papers via the Semantic Scholar API (LLM keyword expansion + citation snowballing),
2. **Ranks** and keeps the **Top-K** by a transparent proxy score,
3. **Summarizes** each paper into a structured row (Methodology, Contribution, …),
4. **Judges** each summary with an **LLM-as-Judge** against a rubric (Clarity, Key Finding, Faithfulness, Consistency), looping **Summary → Judge → Refine for up to _T_ rounds** until it passes,
5. **Outputs** a verified results table.

This mirrors the proposal — Figure 1 (Search Phase → Evaluation Phase → Final Phase) and Table 1 (Title, Abstract, Published Year, DOI, Methodology, Contribution).

## Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind** — UI and API in one app.
- **`src/lib/`** — the framework-agnostic pipeline (schemas, LLM client, Semantic Scholar client, agents). Unit-testable and reusable.
- **Local LLM via your own server** — a provider-agnostic client supporting **Ollama** (`/api/chat`) and **OpenAI-compatible** (`/v1/...`) APIs. Default: **Qwen** as the summarizer + **Gemma** as the judge — two model families, which mitigates the single-model-bias limitation noted in the proposal.
- **Semantic Scholar Graph API** for retrieval (rate-limited + retried).
- **Zod** — one schema source powering runtime validation, the LLM's JSON-schema output, and TypeScript types.

## Status

- [x] **M0** — Foundations (app scaffold, schemas, LLM + Semantic Scholar clients, health check)
- [ ] **M1** — Core pipeline (Search phase done; Summary → Judge → Refine loop in progress)
- [ ] **M2** — API routes + SSE live progress
- [ ] **M3** — Web UI (query form, live progress, results table, exports)
- [ ] **M4** — Infra / Docker deploy
- [ ] **M5** — Tests + evaluation metrics + docs

## Getting started

### Prerequisites

- **Node.js 24+**
- An **LLM server** reachable over the network running your models (e.g. Qwen + Gemma) via **Ollama** or an **OpenAI-compatible** API.

### Setup

```bash
npm install
cp .env.example .env      # then edit .env with your server URL + model names
npm run health            # verify the LLM server + Semantic Scholar are reachable
npm run dev               # start the app at http://localhost:3000
```

### Configuration (`.env`)

| Variable                      | Meaning                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `LLM_PROVIDER`                | `ollama` or `openai` (your server's API style)             |
| `LLM_BASE_URL`                | base URL of your LLM server                                |
| `SUMMARY_MODEL` / `JUDGE_MODEL` | model names exactly as your server lists them            |
| `S2_API_KEY`                  | optional Semantic Scholar key (raises rate limits)         |
| `TOP_K` / `MAX_ROUNDS`        | Top-K papers to keep; max refine rounds (_T_)              |

## Project structure

```
src/
  app/                 Next.js routes (UI + API)
  lib/
    schemas/           Zod contracts (Paper, PaperSummary, JudgeVerdict, …)
    llm/               provider-agnostic LLM client, structured output, prompts
    clients/           Semantic Scholar client (rate-limit + retry)
    pipeline/          searchAgent, rank (+ summary, judge, refine, runReview)
    util/              hashing, text, logging helpers
scripts/health.ts      external-dependency health check
docs/                  proposal + architecture figures
```

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | start the dev server                     |
| `npm run health`    | check LLM + Semantic Scholar connectivity |
| `npm run typecheck` | TypeScript check                         |
| `npm run lint`      | ESLint                                   |
| `npm run build`     | production build                         |

## Team

Final project for **AI System II** — Department of Big Data.

- Chhor Ratanaktepi
- Chhun Rotanakkosal
- Chiv Kimchhor
- Vorn Naro

Supervisor: Prof. Kotb Shimaa Abdelnabi Abdelhakeem
