# Scholar Agent

**Scholar Agent** turns a research question into a checked, organized review of academic papers. It searches for papers, writes a short summary of each one, and then a second AI (the "judge") checks every summary against a checklist and asks for fixes until it passes. This keeps the results true to the real papers instead of made up.

## Screenshots

**Dashboard: every review is saved as a project**

<img src="image/screen/screen1.png" alt="Scholar Agent dashboard" width="820">

**New review: ask a question, set the year range, and tune the search**

<img src="image/screen/screen2.png" alt="New review form" width="820">

**Results: ranked, judge-checked papers with a search box, a compact view, and a side list to jump around**

<img src="image/screen/screen3.png" alt="Results table" width="820">

**Paper details: methodology and contribution, the judge's scores, and a claim-by-claim fact check**

<img src="image/screen/screen4.png" alt="Paper detail" width="820">

## What it does

- **Smart search.** An AI turns your question into several searches and also follows citations to find related papers (using Semantic Scholar). You can limit results to a year range.
- **Clear ranking.** It removes duplicates and keeps the best papers using a simple, visible score (relevance, citation count, influential citations, how recent, whether more than one search found it, and whether it has an abstract).
- **Structured summaries.** Each paper is boiled down to two fields, *Methodology* and *Contribution*, in a fixed format.
- **AI judge with retries.** A second AI scores each summary on four things (Clarity, Key finding, Faithfulness, Consistency) from 1 to 5, and the app rewrites and re-checks the summary until it passes. The pass/fail decision is made by code, not by the AI.
- **Two different models.** One model writes the summary and a different model judges it, so it never grades its own work.
- **Fact checking.** Each summary is split into individual claims, and every claim is checked against the paper's abstract. A simple word-overlap score is also shown.
- **Finds disagreements.** It points out when papers reach opposite conclusions, and quotes the exact sentences.
- **Grow a review.** "Find more papers" adds new papers to a saved review without repeating the ones you already have. New papers are marked with the round they joined in.
- **Easy to browse.** A search box, a Cards or Compact view, and a side list that lets you jump to any paper.
- **Live and portable.** You see progress while it runs, can export to CSV, Markdown, or JSON, and every review is saved.
- **Sign in and keep your work.** A lightweight sign-in scopes saved reviews to you. Each review is stored as a project in your browser so you can reopen, re-run, or extend it later.
- **Works with any OpenAI-compatible AI server.** Point it at any OpenAI-compatible endpoint, hosted or self-run (vLLM, LM Studio, llama.cpp, LiteLLM, and more).

## How it works

1. **Search.** Expand your question into a few searches and follow citations.
2. **Rank.** Remove duplicates and keep the top N papers by a clear score.
3. **Summarize.** Pull each paper's Methodology and Contribution from its abstract.
4. **Judge and refine.** A second AI scores each summary; the app rewrites it until it passes (up to T tries).
5. **Disagreements.** Flag papers that reach opposite conclusions.
6. **Results.** A checked table you can sort, filter, and export.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod (one place that validates data, tells the AI what JSON to return, and provides the types), and the Semantic Scholar API.

The website and the API live in one Next.js app. A review runs in an API route and streams its progress to the browser as Server-Sent Events. The server keeps no copy of your results: each finished review is saved per user in the browser, so it can be reopened and extended. This keeps the app stateless and easy to host anywhere. The core logic in `src/lib/` is plain TypeScript and is unit-tested.

> Sign-in is a demo identity only (it captures a username to scope your projects). There is no password check or backend account system.

## Getting started

**You need:** Node.js 24+, one or two OpenAI-compatible AI endpoints, and optionally a free [Semantic Scholar API key](https://www.semanticscholar.org/product/api) for higher rate limits.

```bash
npm install
cp .env.example .env      # fill in your endpoints, model names, and (optional) S2 key
npm run health            # check the AI servers and Semantic Scholar are reachable
npm run dev               # open http://localhost:3000
```

### Configuration (`.env`)

The summarizer and the judge each have their own endpoint and model. If you leave the `JUDGE_LLM_*` values unset, the judge reuses the summarizer's endpoint.

```bash
# Summarizer (worker) model
LLM_PROVIDER=openai                      # any OpenAI-compatible server
LLM_BASE_URL=https://your-endpoint/v1
LLM_API_KEY=...
SUMMARY_MODEL=qwen3-14b
LLM_DISABLE_THINKING=true                # hide reasoning traces (e.g. Qwen3 <think>)

# Judge model (a different model family is recommended)
JUDGE_LLM_PROVIDER=openai
JUDGE_LLM_BASE_URL=https://your-judge-endpoint/v1
JUDGE_LLM_API_KEY=...
JUDGE_MODEL=gemma-4-e2b

# Semantic Scholar (key is optional, raises your rate limit)
S2_API_KEY=...

# Pipeline tuning
TOP_K=5                                  # how many papers to keep
MAX_ROUNDS=2                             # max summarize/judge refine tries (T)
```

| Variable | Meaning |
| --- | --- |
| `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY` | Summarizer endpoint (`openai` = any OpenAI-compatible server) |
| `SUMMARY_MODEL` | Summarizer model name |
| `LLM_NUM_CTX`, `LLM_TIMEOUT_MS` | Context window and per-request timeout |
| `LLM_DISABLE_THINKING` | `true` to hide reasoning traces (e.g. Qwen3 `<think>`) |
| `JUDGE_LLM_PROVIDER`, `JUDGE_LLM_BASE_URL`, `JUDGE_LLM_API_KEY` | Judge endpoint (falls back to the summarizer endpoint if unset) |
| `JUDGE_MODEL`, `JUDGE_LLM_DISABLE_THINKING` | Judge model name and its thinking toggle |
| `S2_API_KEY`, `S2_BASE_URL` | Semantic Scholar key (optional) and base URL |
| `TOP_K`, `MAX_ROUNDS` | How many papers to keep, and max refine tries (T) |
| `LLM_CONCURRENCY` | How many papers to summarize/judge at once |

## Run with Docker

The AI endpoints and Semantic Scholar are reached over the network, so the container only needs internet access and your `.env`:

```bash
docker compose up --build       # builds the image and serves on :3000
```

## Deploy to a serverless host

The app also runs on a serverless host such as Vercel. The review route streams progress and is set to allow longer runs (raise `maxDuration` on a paid plan for big reviews). Because the server keeps no state and your projects live in the browser, there is nothing to provision beyond your `.env`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app for development |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run health` | Check the AI servers and Semantic Scholar are reachable |
| `npm run benchmark` | Test how well the judge tells good summaries from bad ones |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run the linter |

## Project structure

```
src/
  app/            Next.js routes
    api/          reviews (start review, SSE progress stream), health
    login/        demo sign-in
    new/          start a review and watch it run live
    projects/[id] open a saved review (read-only, can "find more")
  components/     QueryForm, ProgressView, ResultsTable, Disagreements,
                  StatsStrip, AppShell, TopBar, FindMoreModal, and more
  hooks/          useReview (reads the live progress stream)
  lib/
    auth.tsx      demo sign-in (localStorage identity)
    projects.ts   per-user saved reviews (localStorage)
    export.ts     CSV / Markdown serializers
    schemas/      Zod data shapes (paper, summary, judge, disagreement, events, job)
    llm/          OpenAI-compatible client, structured output, prompts
    clients/      Semantic Scholar client (rate-limit + retry)
    pipeline/     searchAgent, rank, summaryAgent, judge, refineLoop,
                  claimFaithfulness, disagreements, runReview
    eval/         faithfulness metric, judge benchmark, fixtures
    util/         hashing, logging, text helpers
test/             unit tests
scripts/          health, benchmark, probes
```
