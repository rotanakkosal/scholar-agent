"use client";

import { useReview } from "@/hooks/useReview";
import { QueryForm } from "@/components/QueryForm";
import { ProgressView } from "@/components/ProgressView";
import { ResultsTable } from "@/components/ResultsTable";

export default function Home() {
  const { state, start, cancel } = useReview();
  const showProgress =
    state.running || state.paperOrder.length > 0 || state.log.length > 0 || !!state.error;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Scholar Agent
        </h1>
        <p className="text-sm text-zinc-500">
          Agentic literature review — search papers, summarize them, and verify each summary with an
          LLM-as-Judge.
        </p>
      </header>

      <QueryForm running={state.running} onStart={start} onCancel={cancel} />

      {state.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      {showProgress && <ProgressView state={state} />}
      <ResultsTable state={state} />

      {state.disagreements.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Possible disagreements{" "}
            <span className="font-normal text-amber-700 dark:text-amber-400">
              (detected from abstracts only — verify against the full papers)
            </span>
          </h2>
          <ul className="flex flex-col gap-3">
            {state.disagreements.map((d, i) => (
              <li key={i} className="text-sm">
                <div className="font-medium text-zinc-800 dark:text-zinc-100">{d.topic}</div>
                <ul className="mt-1 space-y-1">
                  {d.sides.map((s, j) => (
                    <li key={j} className="text-zinc-600 dark:text-zinc-300">
                      <span className="font-medium">{s.title}:</span>{" "}
                      <span className="italic">“{s.quote}”</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
