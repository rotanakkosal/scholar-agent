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
- **Clear ranking.** It removes duplicates and keeps the best papers using a simple, visible score (relevance, citation count, how recent, and whether more than one search found it).
- **Structured summaries.** Each paper is boiled down to two fields, *Methodology* and *Contribution*, in a fixed format.
- **AI judge with retries.** A second AI scores each summary on four things (Clarity, Key finding, Faithfulness, Consistency) from 1 to 5, and the app rewrites and re-checks the summary until it passes. The pass/fail decision is made by code, not by the AI.
- **Two different models.** One model writes the summary and a different model judges it, so it never grades its own work.
- **Fact checking.** Each summary is split into individual claims, and every claim is checked against the paper's abstract. A simple word-overlap score is also shown.
- **Finds disagreements.** It points out when papers reach opposite conclusions, and quotes the exact sentences.
- **Grow a review.** "Find more papers" adds new papers to a saved review without repeating the ones you already have. New papers are marked.
- **Easy to browse.** A search box, a Cards or Compact view, and a side list that lets you jump to any paper.
- **Live and portable.** You see progress while it runs, can export to CSV, Markdown, or JSON, and every review is saved as a project.
- **Works with any AI server.** Use Ollama or any OpenAI-compatible endpoint.

## How it works

1. **Search.** Expand your question into a few searches and follow citations.
2. **Rank.** Remove duplicates and keep the top N papers by a clear score.
3. **Summarize.** Pull each paper's Methodology and Contribution from its abstract.
4. **Judge and refine.** A second AI scores each summary; the app rewrites it until it passes (up to T tries).
5. **Disagreements.** Flag papers that reach opposite conclusions.
6. **Results.** A checked table you can sort, filter, and export.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod (one place that validates data, tells the AI what JSON to return, and provides the types), and the Semantic Scholar API.

The website and the API live in one Next.js app. The core logic in `src/lib/` is plain TypeScript and is unit-tested.

## Getting started

**You need:** Node.js 24+, one or two AI endpoints (Ollama or OpenAI-compatible), and optionally a free [Semantic Scholar API key](https://www.semanticscholar.org/product/api) for higher rate limits.

```bash
npm install
cp .env.example .env      # fill in your endpoints, model names, and (optional) S2 key
npm run health            # check the AI servers and Semantic Scholar are reachable
npm run dev               # open http://localhost:3000
```

### Configuration (`.env`)

| Variable | Meaning |
| --- | --- |
| `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY` | Summarizer endpoint (`ollama` or `openai`) |
| `SUMMARY_MODEL` | Summarizer model name |
| `LLM_DISABLE_THINKING` | `true` to hide reasoning traces (e.g. Qwen3 `<think>`) |
| `JUDGE_LLM_PROVIDER`, `JUDGE_LLM_BASE_URL`, `JUDGE_LLM_API_KEY` | Judge endpoint (falls back to the summarizer endpoint if unset) |
| `JUDGE_MODEL` | Judge model name |
| `S2_API_KEY` | Semantic Scholar API key (optional) |
| `TOP_K`, `MAX_ROUNDS` | How many papers to keep, and max refine tries (T) |

## Run with Docker

The AI endpoints and Semantic Scholar are reached over the network, so the container only needs internet access and your `.env`:

```bash
docker compose up --build       # builds the image and serves on :3000
```

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
  app/            Next.js routes (website + /api: reviews, health, export)
  components/     QueryForm, ProgressView, ResultsTable, and more
  hooks/          useReview (reads the live progress stream)
  lib/
    schemas/      Zod data shapes (Paper, PaperSummary, JudgeVerdict, Disagreement, ...)
    llm/          AI client, structured output, prompts
    clients/      Semantic Scholar client (rate-limit + retry)
    pipeline/     searchAgent, rank, summaryAgent, judge, refineLoop,
                  claimFaithfulness, disagreements, runReview
    eval/         faithfulness metric, judge benchmark, fixtures
test/             unit tests
scripts/          health, benchmark, probes
```
