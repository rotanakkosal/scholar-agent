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
  const [strategies, setStrategies] = useState<string[]>(["keyword", "citation"]);

  const toggle = (s: string) =>
    setStrategies((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || running) return;
    onStart({
      query: query.trim(),
      topK,
      maxRounds,
      strategies: strategies.length ? strategies : ["keyword"],
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Prominent search bar */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950">
        <svg
          className="h-5 w-5 shrink-0 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a research question, e.g. retrieval augmented generation"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-zinc-400"
          autoFocus
        />
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run review
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
        <label className="flex w-44 flex-col gap-1.5">
          <span className="flex justify-between text-xs font-medium text-zinc-500">
            <span>Top-K papers</span>
            <span className="tabular-nums text-violet-600 dark:text-violet-400">{topK}</span>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="accent-violet-600"
          />
        </label>

        <label className="flex w-44 flex-col gap-1.5">
          <span className="flex justify-between text-xs font-medium text-zinc-500">
            <span>Refine rounds (T)</span>
            <span className="tabular-nums text-violet-600 dark:text-violet-400">{maxRounds}</span>
          </span>
          <input
            type="range"
            min={0}
            max={4}
            value={maxRounds}
            onChange={(e) => setMaxRounds(Number(e.target.value))}
            className="accent-violet-600"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-500">Search strategies</span>
          <div className="flex gap-2">
            {STRATEGIES.map((s) => {
              const on = strategies.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
                    on
                      ? "bg-violet-600 text-white shadow-sm"
                      : "border border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}
