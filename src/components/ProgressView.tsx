"use client";

import type { ReviewState } from "@/hooks/useReview";

export function ProgressView({ state }: { state: ReviewState }) {
  const papers = state.paperOrder.map((id) => state.papers[id]).filter(Boolean);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm">
        {state.running && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
        )}
        <span className="font-medium">
          {state.running ? "Running" : "Idle"}
          {state.phase ? ` — ${state.phase}` : ""}
        </span>
        {state.foundCount !== undefined && (
          <span className="text-zinc-500">
            · {state.foundCount} found → {state.keptCount} kept
          </span>
        )}
      </div>

      {papers.map((p) => {
        const last = p.rounds[p.rounds.length - 1];
        return (
          <div key={p.paperId} className="rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-800">
            <div className="font-medium">
              [{p.index}/{p.total}] {p.title}
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {p.rounds.map((v, i) => (
                <span
                  key={i}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    v.pass
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                  title={v.feedback}
                >
                  r{i + 1}: {v.pass ? "pass" : "fail"} {v.overall.toFixed(1)}
                </span>
              ))}
              {!p.summary && state.running && (
                <span className="text-xs text-zinc-400">working…</span>
              )}
              {last && (
                <span className="text-xs text-zinc-500">
                  C{last.scores.clarity.score} K{last.scores.keyFinding.score} F
                  {last.scores.faithfulness.score} X{last.scores.consistency.score} · grounding{" "}
                  {Math.round(last.faithfulnessOverlap * 100)}%
                </span>
              )}
            </div>
          </div>
        );
      })}

      {state.log.length > 0 && (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer select-none">Log ({state.log.length})</summary>
          <ul className="mt-1 space-y-0.5 font-mono">
            {state.log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
