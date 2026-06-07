"use client";

import { useReview, type ReviewState } from "@/hooks/useReview";
import { QueryForm } from "@/components/QueryForm";
import { ProgressView } from "@/components/ProgressView";
import { ResultsTable } from "@/components/ResultsTable";

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div
        className={`mt-0.5 text-lg font-semibold tabular-nums ${
          accent ? "text-violet-600 dark:text-violet-400" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatsStrip({ state }: { state: ReviewState }) {
  const reviewed = state.paperOrder.filter((id) => state.papers[id]?.summary).length;
  const total = state.keptCount ?? state.paperOrder.length;
  const status = state.running ? "Running" : state.results.length > 0 ? "Done" : "Idle";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Status" value={status} accent={state.running} />
      <StatTile
        label="Found → Kept"
        value={state.foundCount !== undefined ? `${state.foundCount} → ${state.keptCount}` : "—"}
      />
      <StatTile label="Reviewed" value={total ? `${reviewed}/${total}` : "—"} />
      <StatTile label="Disagreements" value={`${state.disagreements.length}`} />
    </div>
  );
}

export default function Home() {
  const { state, start, cancel } = useReview();
  const showActivity =
    state.running || state.paperOrder.length > 0 || state.log.length > 0 || !!state.error;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2 7l10-4 10 4-10 4z" />
            <path d="M6 9v5c0 1.5 3 3 6 3s6-1.5 6-3V9" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Scholar Agent
          </h1>
          <p className="text-sm text-zinc-500">
            Agentic literature review — search, summarize, and verify each summary with an
            LLM-as-Judge.
          </p>
        </div>
      </header>

      <QueryForm running={state.running} onStart={start} onCancel={cancel} />

      {state.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      {showActivity && (
        <div className="flex flex-col gap-5">
          <StatsStrip state={state} />
          <ProgressView state={state} />
        </div>
      )}

      <ResultsTable state={state} />

      {state.disagreements.length > 0 && (
        <section className="animate-fade-in flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Possible disagreements{" "}
            <span className="font-normal text-amber-700 dark:text-amber-400">
              · detected from abstracts only — verify against the full papers
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {state.disagreements.map((d, i) => (
              <li key={i} className="text-sm">
                <div className="font-medium text-zinc-800 dark:text-zinc-100">{d.topic}</div>
                <ul className="mt-1 space-y-1">
                  {d.sides.map((side, j) => (
                    <li key={j} className="text-zinc-600 dark:text-zinc-300">
                      <span className="font-medium">{side.title}:</span>{" "}
                      <span className="italic">“{side.quote}”</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-4 text-center text-xs text-zinc-400">
        Qwen summarizes · Gemma judges · grounded in Semantic Scholar
      </footer>
    </main>
  );
}
