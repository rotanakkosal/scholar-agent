"use client";

import type { ReviewState } from "@/hooks/useReview";

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 transition ${
        accent ? "border-transparent bg-coral-soft" : "border-border bg-card shadow-sm"
      }`}
    >
      <div className={`text-xs font-medium ${accent ? "text-coral-strong/80" : "text-muted-foreground"}`}>
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

export function StatsStrip({ state }: { state: ReviewState }) {
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
