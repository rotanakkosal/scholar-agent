"use client";

import { useEffect, useRef, useState } from "react";
import type { ReviewState } from "@/hooks/useReview";

export function ProgressView({ state }: { state: ReviewState }) {
  const papers = state.paperOrder.map((id) => state.papers[id]).filter(Boolean);
  const reviewed = papers.filter((p) => p.summary).length;
  const total = state.keptCount ?? papers.length;
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse the activity cards the moment a run finishes (so the results
  // table greets the user), and re-expand when a new run starts. Manual toggle
  // always wins afterward.
  const prevRunning = useRef(state.running);
  useEffect(() => {
    if (prevRunning.current && !state.running) setCollapsed(true);
    if (!prevRunning.current && state.running) setCollapsed(false);
    prevRunning.current = state.running;
  }, [state.running]);

  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2.5 text-left text-sm"
      >
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            collapsed ? "" : "rotate-90"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          {state.running && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              state.running ? "bg-coral" : "bg-muted-foreground/40"
            }`}
          />
        </span>
        <span className="font-bold text-foreground">{state.running ? "Running" : "Idle"}</span>
        {state.phase && <span className="font-medium text-muted-foreground">· {state.phase}</span>}
        {collapsed && papers.length > 0 && (
          <span className="font-medium text-muted-foreground">
            · {papers.length} paper{papers.length === 1 ? "" : "s"} · show activity
          </span>
        )}
        {state.foundCount !== undefined && (
          <span className="ml-auto font-medium text-muted-foreground">
            {state.foundCount} found → {state.keptCount} kept
          </span>
        )}
      </button>

      {/* Overall progress — always visible, even when collapsed */}
      {total > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Reviewed</span>
            <span className="tabular-nums text-foreground">
              {reviewed}/{total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-coral transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          collapsed ? "grid-rows-[0fr] opacity-0" : "mt-4 grid-rows-[1fr] opacity-100"
        }`}
        aria-hidden={collapsed}
      >
        <div className="flex flex-col gap-4 overflow-hidden">
          {papers.map((p) => {
            const last = p.rounds[p.rounds.length - 1];
            const s = last?.scores;
            return (
              <div
                key={p.paperId}
                className="animate-fade-in rounded-2xl border border-border bg-secondary/50 p-4 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold tabular-nums text-primary-foreground">
                    {p.index}/{p.total}
                  </span>
                  <span className="font-semibold leading-snug text-foreground">{p.title}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-1">
                  {p.rounds.map((v, i) => (
                    <span
                      key={i}
                      title={v.feedback}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        v.pass ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                      }`}
                    >
                      r{i + 1} {v.pass ? "pass" : "fail"} {v.overall.toFixed(1)}
                    </span>
                  ))}
                  {!p.summary && state.running && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-coral-strong">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
                      working…
                    </span>
                  )}
                  {s && (
                    <span className="font-mono text-xs text-muted-foreground">
                      C{s.clarity.score} K{s.keyFinding.score} F{s.faithfulness.score} X
                      {s.consistency.score}
                    </span>
                  )}
                  {last && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      grounding
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full bg-coral"
                          style={{ width: `${Math.round(last.faithfulnessOverlap * 100)}%` }}
                        />
                      </span>
                      <span className="tabular-nums text-foreground">
                        {Math.round(last.faithfulnessOverlap * 100)}%
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {state.log.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium hover:text-foreground">
                Log ({state.log.length})
              </summary>
              <ul className="mt-2 space-y-0.5 rounded-2xl bg-secondary/50 p-3 font-mono">
                {state.log.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
