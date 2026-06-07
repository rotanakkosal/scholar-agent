"use client";

import type { ReviewState } from "@/hooks/useReview";

export function ProgressView({ state }: { state: ReviewState }) {
  const papers = state.paperOrder.map((id) => state.papers[id]).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            state.running ? "animate-pulse bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
          aria-hidden
        />
        <span className="font-semibold">{state.running ? "Running" : "Idle"}</span>
        {state.phase && <span className="text-zinc-400">· {state.phase}</span>}
        {state.foundCount !== undefined && (
          <span className="ml-auto text-zinc-500">
            {state.foundCount} found → {state.keptCount} kept
          </span>
        )}
      </div>

      {papers.map((p) => {
        const last = p.rounds[p.rounds.length - 1];
        const s = last?.scores;
        return (
          <div
            key={p.paperId}
            className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-md bg-zinc-200 px-1.5 py-0.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {p.index}/{p.total}
              </span>
              <span className="font-medium leading-snug">{p.title}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
              {p.rounds.map((v, i) => (
                <span
                  key={i}
                  title={v.feedback}
                  className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    v.pass
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  r{i + 1} {v.pass ? "pass" : "fail"} {v.overall.toFixed(1)}
                </span>
              ))}
              {!p.summary && state.running && (
                <span className="text-xs text-zinc-400">working…</span>
              )}
              {s && (
                <span className="text-xs text-zinc-400">
                  C{s.clarity.score} K{s.keyFinding.score} F{s.faithfulness.score} X
                  {s.consistency.score}
                </span>
              )}
              {last && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
                  grounding
                  <span className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <span
                      className="block h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.round(last.faithfulnessOverlap * 100)}%` }}
                    />
                  </span>
                  {Math.round(last.faithfulnessOverlap * 100)}%
                </span>
              )}
            </div>
          </div>
        );
      })}

      {state.log.length > 0 && (
        <details className="text-xs text-zinc-400">
          <summary className="cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300">
            Log ({state.log.length})
          </summary>
          <ul className="mt-1.5 space-y-0.5 font-mono">
            {state.log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
