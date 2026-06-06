"use client";

import { useState } from "react";
import type { ReviewParams } from "@/hooks/useReview";

const STRATEGIES = ["keyword", "citation"] as const;

export function QueryForm({
  running,
  onStart,
  onCancel,
}: {
  running: boolean;
  onStart: (params: ReviewParams) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [maxRounds, setMaxRounds] = useState(2);
  const [strategies, setStrategies] = useState<string[]>(["keyword"]);

  const toggle = (s: string) =>
    setStrategies((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || running) return;
    onStart({ query: query.trim(), topK, maxRounds, strategies: strategies.length ? strategies : ["keyword"] });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Research query</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. retrieval augmented generation"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>

      <div className="flex flex-wrap gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Top-K papers: {topK}</span>
          <input type="range" min={1} max={10} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Refine rounds (T): {maxRounds}</span>
          <input type="range" min={0} max={4} value={maxRounds} onChange={(e) => setMaxRounds(Number(e.target.value))} />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Search strategies</span>
          <div className="flex gap-4">
            {STRATEGIES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm capitalize">
                <input type="checkbox" checked={strategies.includes(s)} onChange={() => toggle(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={running || !query.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {running ? "Reviewing…" : "Run review"}
        </button>
        {running && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
