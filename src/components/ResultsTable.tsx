"use client";

import { useState } from "react";
import type { ReviewState } from "@/hooks/useReview";
import type { JudgeVerdict } from "@/lib/schemas/judge";

function ScoreBadge({ verdict }: { verdict?: JudgeVerdict }) {
  if (!verdict) return <span className="text-xs text-zinc-400">—</span>;
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        verdict.pass
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
      title={verdict.feedback}
    >
      {verdict.pass ? "pass" : "fail"} {verdict.overall.toFixed(1)}/5
    </span>
  );
}

export function ResultsTable({ state }: { state: ReviewState }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = state.paperOrder
    .map((id) => state.papers[id])
    .filter((p) => p && p.summary);
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Results ({rows.length})</h2>
        {state.jobId && !state.running && (
          <div className="flex gap-2 text-sm">
            <span className="text-zinc-500">Export:</span>
            {(["csv", "md", "json"] as const).map((fmt) => (
              <a
                key={fmt}
                href={`/api/reviews/${state.jobId}/export?format=${fmt}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {fmt.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
              <th className="py-2 pr-3 font-medium">Title</th>
              <th className="py-2 pr-3 font-medium">Year</th>
              <th className="py-2 pr-3 font-medium">Methodology</th>
              <th className="py-2 pr-3 font-medium">Contribution</th>
              <th className="py-2 pr-3 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const s = p.summary!;
              const verdict = p.rounds[p.rounds.length - 1];
              const isOpen = open === p.paperId;
              return (
                <tr
                  key={p.paperId}
                  className="cursor-pointer border-b border-zinc-100 align-top hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  onClick={() => setOpen(isOpen ? null : p.paperId)}
                >
                  <td className="py-2 pr-3 font-medium">
                    {s.title}
                    {isOpen && (
                      <div className="mt-2 max-w-prose whitespace-pre-wrap text-xs font-normal text-zinc-600 dark:text-zinc-400">
                        <div className="mb-1">
                          <span className="font-semibold">DOI:</span> {s.doi ?? "—"}
                          {!s.abstractAvailable && (
                            <span className="ml-2 rounded bg-zinc-200 px-1 dark:bg-zinc-700">no abstract</span>
                          )}
                        </div>
                        <span className="font-semibold">Abstract:</span> {s.abstract || "(none)"}
                        {verdict && (
                          <div className="mt-2 space-y-0.5">
                            {(["clarity", "keyFinding", "faithfulness", "consistency"] as const).map((d) => (
                              <div key={d}>
                                <span className="font-semibold capitalize">{d}</span> {verdict.scores[d].score}/5 — {verdict.scores[d].reason}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{s.publishedYear ?? "—"}</td>
                  <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">{s.methodology}</td>
                  <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-300">{s.contribution}</td>
                  <td className="py-2 pr-3">
                    <ScoreBadge verdict={verdict} />
                    {s.revisions > 0 && (
                      <div className="mt-0.5 text-xs text-zinc-400">{s.revisions} rev</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
