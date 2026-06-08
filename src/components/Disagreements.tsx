"use client";

import type { ReviewState } from "@/hooks/useReview";

export function Disagreements({ state }: { state: ReviewState }) {
  if ((state.disagreements?.length ?? 0) === 0) return null;
  return (
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
  );
}
