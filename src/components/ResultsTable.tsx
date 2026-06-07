"use client";

import { useState } from "react";
import type { ReviewState } from "@/hooks/useReview";
import type { JudgeVerdict } from "@/lib/schemas/judge";

function VerdictBadge({ verdict }: { verdict?: JudgeVerdict }) {
  if (!verdict) return null;
  return (
    <span
      title={verdict.feedback}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        verdict.pass
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
    >
      {verdict.pass ? "✓ pass" : "● fail"} {verdict.overall.toFixed(1)}/5
    </span>
  );
}

function Grounding({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-400" title="Abstract grounding">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <span className="block h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
      </span>
      {pct}%
    </span>
  );
}

export function ResultsTable({ state }: { state: ReviewState }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = state.paperOrder.map((id) => state.papers[id]).filter((p) => p && p.summary);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Results <span className="text-zinc-400">({rows.length})</span>
        </h2>
        {state.jobId && !state.running && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span className="mr-1 text-xs">Export</span>
            {(["csv", "md", "json"] as const).map((fmt) => (
              <a
                key={fmt}
                href={`/api/reviews/${state.jobId}/export?format=${fmt}`}
                className="rounded-md px-2 py-1 text-xs font-medium text-violet-600 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40"
              >
                {fmt.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((p) => {
          const s = p.summary!;
          const verdict = p.rounds[p.rounds.length - 1];
          const isOpen = open === p.paperId;
          const pct = verdict ? Math.round(verdict.faithfulnessOverlap * 100) : 0;
          return (
            <article
              key={p.paperId}
              className="animate-fade-in rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  {s.doi ? (
                    <a
                      href={`https://doi.org/${s.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-violet-600 hover:underline dark:hover:text-violet-400"
                    >
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </h3>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <VerdictBadge verdict={verdict} />
                  {verdict && <Grounding pct={pct} />}
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-zinc-400">
                <span className="tabular-nums">{s.publishedYear ?? "year n/a"}</span>
                {s.doi && <span className="truncate">· {s.doi}</span>}
                {s.revisions > 0 && <span>· {s.revisions} revision(s)</span>}
                {!s.abstractAvailable && (
                  <span className="rounded bg-zinc-100 px-1.5 dark:bg-zinc-800">no abstract</span>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Methodology
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {s.methodology}
                  </p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Contribution
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {s.contribution}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.paperId)}
                className="mt-3 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {isOpen ? "Hide details" : "Show rubric & abstract"}
              </button>

              {isOpen && (
                <div className="mt-3 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                  {verdict && (
                    <div className="mb-3 grid gap-1.5 sm:grid-cols-2">
                      {(["clarity", "keyFinding", "faithfulness", "consistency"] as const).map(
                        (d) => (
                          <div key={d} className="text-xs text-zinc-500">
                            <span className="font-semibold capitalize text-zinc-700 dark:text-zinc-300">
                              {d} {verdict.scores[d].score}/5
                            </span>{" "}
                            — {verdict.scores[d].reason}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  <div className="text-xs leading-relaxed text-zinc-500">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Abstract:</span>{" "}
                    {s.abstract || "(none)"}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
