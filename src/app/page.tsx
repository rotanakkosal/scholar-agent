"use client";

import { useEffect, useRef } from "react";
import { useReview, type ReviewState } from "@/hooks/useReview";
import { QueryForm } from "@/components/QueryForm";
import { ProgressView } from "@/components/ProgressView";
import { ResultsTable } from "@/components/ResultsTable";
import { ScrollToTop } from "@/components/ScrollToTop";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 transition ${
        accent
          ? "border-transparent bg-coral-soft"
          : "border-border bg-card shadow-sm"
      }`}
    >
      <div
        className={`text-xs font-medium ${
          accent ? "text-coral-strong/80" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${
          accent ? "text-coral-strong" : "text-foreground"
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

  // Principle 3 — always show status: reveal the activity area as soon as a run starts.
  const activityRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.running) {
      activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.running]);

  return (
    <main className="min-h-full w-full bg-canvas px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] bg-background p-4 shadow-soft sm:p-8 lg:p-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
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
              <h1 className="text-lg font-extrabold tracking-tight text-foreground">
                Scholar Agent
              </h1>
              <p className="text-xs font-medium text-muted-foreground">Agentic literature review</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
              Qwen summarizes · Gemma judges
            </span>
          </div>
        </header>

        {/* Hero query */}
        <QueryForm running={state.running} onStart={start} onCancel={cancel} />

        {state.error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
            {state.error}
          </div>
        )}

        {showActivity && (
          <div ref={activityRef} className="flex scroll-mt-6 flex-col gap-5">
            <StatsStrip state={state} />
            <ProgressView state={state} />
          </div>
        )}

        <ResultsTable state={state} />

        {(state.disagreements?.length ?? 0) > 0 && (
          <section className="animate-fade-in flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-5">
            <h2 className="text-base font-bold text-foreground">
              Possible disagreements{" "}
              <span className="font-medium text-muted-foreground">
                · detected from abstracts only — verify against the full papers
              </span>
            </h2>
            <ul className="flex flex-col gap-3">
              {state.disagreements.map((d, i) => (
                <li key={i} className="text-sm">
                  <div className="font-semibold text-foreground">{d.topic}</div>
                  <ul className="mt-1 space-y-1">
                    {d.sides.map((side, j) => (
                      <li key={j} className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{side.title}:</span>{" "}
                        <span className="italic">“{side.quote}”</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-2 text-center text-xs font-medium text-muted-foreground">
          Qwen summarizes · Gemma judges · grounded in Semantic Scholar
        </footer>
      </div>

      <ScrollToTop />
    </main>
  );
}
