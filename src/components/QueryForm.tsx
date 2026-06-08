"use client";

import { useState } from "react";
import type { ReviewParams } from "@/hooks/useReview";

const STRATEGIES = ["keyword", "citation"] as const;

const EXAMPLES = [
  "Retrieval-augmented generation for code",
  "LLM agents for software testing",
  "Chain-of-thought prompting limitations",
  "Vision transformers vs CNNs",
];

const CURRENT_YEAR = new Date().getFullYear();

// Quick year-scope presets ("last N years" stays correct over time; null = open-ended).
const YEAR_PRESETS: { label: string; from: number | null; to: number | null }[] = [
  { label: "Any", from: null, to: null },
  { label: "Last 3 yrs", from: CURRENT_YEAR - 2, to: null },
  { label: "Last 5 yrs", from: CURRENT_YEAR - 4, to: null },
  { label: "Last 10 yrs", from: CURRENT_YEAR - 9, to: null },
];

export function QueryForm({
  running,
  onStart,
  onCancel,
  initialQuery = "",
  initialTopK = 5,
  initialMaxRounds = 2,
  initialStrategies = ["keyword", "citation"],
  initialYearFrom = null,
  initialYearTo = null,
}: {
  running: boolean;
  onStart: (params: ReviewParams) => void;
  onCancel: () => void;
  initialQuery?: string;
  initialTopK?: number;
  initialMaxRounds?: number;
  initialStrategies?: string[];
  initialYearFrom?: number | null;
  initialYearTo?: number | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [topK, setTopK] = useState(initialTopK);
  const [maxRounds, setMaxRounds] = useState(initialMaxRounds);
  const [strategies, setStrategies] = useState<string[]>(initialStrategies);
  const [yearFrom, setYearFrom] = useState<number | null>(initialYearFrom);
  const [yearTo, setYearTo] = useState<number | null>(initialYearTo);
  const [advanced, setAdvanced] = useState(false);

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
      yearFrom,
      yearTo,
    });
  };

  const showEmptyHelp = !query.trim() && !running;

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          What should we research today? <span aria-hidden>👋</span>
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Ask anything — I’ll search, summarize, and have a judge verify every result.
        </p>
      </div>

      {/* Prominent pill search bar */}
      <div className="flex items-center gap-3 rounded-full border border-input bg-secondary/60 py-2 pl-5 pr-2 transition focus-within:border-coral focus-within:bg-card focus-within:ring-4 focus-within:ring-coral/15">
        <svg
          className="h-5 w-5 shrink-0 text-muted-foreground"
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
          placeholder="e.g. retrieval augmented generation for code"
          aria-label="Research question"
          className="flex-1 bg-transparent py-1.5 text-base text-foreground outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            title={query.trim() ? "Run the review" : "Type a question first"}
            className="group shrink-0 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          >
            <span className="flex items-center gap-1.5">
              Run review
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </button>
        )}
      </div>

      {/* Year scope — quick presets (always visible; custom range lives in Advanced) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Years</span>
        {YEAR_PRESETS.map((p) => {
          const active = yearFrom === p.from && yearTo === p.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setYearFrom(p.from);
                setYearTo(p.to);
              }}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-coral bg-coral-soft text-coral-strong"
                  : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {!YEAR_PRESETS.some((p) => yearFrom === p.from && yearTo === p.to) && (
          <span className="rounded-full border border-coral bg-coral-soft px-3 py-1.5 text-xs font-semibold text-coral-strong">
            {yearFrom ?? "any"}–{yearTo ?? "any"}
          </span>
        )}
      </div>

      {/* Guided empty state: example chips + how-it-works */}
      {showEmptyHelp && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Try
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-coral hover:bg-coral-soft hover:text-coral-strong"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
            {["Search papers", "Rank Top-K", "Summarize", "Judge & refine", "Verified table"].map(
              (step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span>
                    <span className="text-coral-strong">{i + 1}</span> {step}
                  </span>
                  {i < arr.length - 1 && <span aria-hidden className="text-border">→</span>}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {/* Advanced settings (progressive disclosure) */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
          className="flex w-full items-center gap-2 text-sm font-semibold text-foreground"
        >
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${advanced ? "rotate-90" : ""}`}
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
          Advanced settings
          {!advanced && (
            <span className="ml-1 truncate text-xs font-medium text-muted-foreground">
              · Top-K {topK} · {maxRounds} refine round{maxRounds === 1 ? "" : "s"} ·{" "}
              {strategies.length ? strategies.join(", ") : "keyword"}
              {yearFrom || yearTo ? ` · ${yearFrom ?? "any"}–${yearTo ?? "any"}` : ""}
            </span>
          )}
        </button>

        {advanced && (
          <div className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-6">
            {/* Top-K — stepper + quick presets */}
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-semibold text-foreground">Top-K papers</span>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-input bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setTopK((v) => Math.max(1, v - 1))}
                    disabled={topK <= 1}
                    aria-label="Decrease Top-K"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-sm font-bold tabular-nums text-foreground">
                    {topK}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTopK((v) => Math.min(50, v + 1))}
                    disabled={topK >= 50}
                    aria-label="Increase Top-K"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {[5, 10, 20, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTopK(n)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition ${
                        topK === n
                          ? "bg-coral-soft text-coral-strong"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                How many top-ranked papers to review.
              </span>
            </div>

            {/* Refine rounds — segmented 0–4 */}
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-semibold text-foreground">Refine rounds (T)</span>
              <div className="inline-flex rounded-full border border-input bg-card p-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxRounds(n)}
                    aria-pressed={maxRounds === n}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums transition ${
                      maxRounds === n
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Max Summarize → Judge → Refine retries per paper.
              </span>
            </div>

            {/* Strategies — check-chips (clear on/off) */}
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-semibold text-foreground">Search strategies</span>
              <div className="flex gap-2">
                {STRATEGIES.map((s) => {
                  const on = strategies.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(s)}
                      aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize transition ${
                        on
                          ? "border-coral bg-coral-soft text-coral-strong"
                          : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                          on ? "border-coral bg-coral text-coral-foreground" : "border-input"
                        }`}
                        aria-hidden
                      >
                        {on && (
                          <svg
                            className="h-2.5 w-2.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      {s}
                    </button>
                  );
                })}
              </div>
              <span className="max-w-60 text-xs font-medium text-muted-foreground">
                Keyword expands your query, citation snowballs the citation graph.
              </span>
            </div>

            {/* Publication years — range filter */}
            <div className="flex flex-col items-start gap-2.5">
              <span className="text-xs font-semibold text-foreground">Publication years</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={CURRENT_YEAR}
                  value={yearFrom ?? ""}
                  onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Any"
                  aria-label="From year"
                  className="w-20 rounded-full border border-input bg-card px-3 py-1.5 text-center text-sm font-semibold tabular-nums text-foreground outline-none transition placeholder:font-medium placeholder:text-muted-foreground focus:border-coral focus:ring-2 focus:ring-coral/15"
                />
                <span className="text-sm font-semibold text-muted-foreground">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={CURRENT_YEAR}
                  value={yearTo ?? ""}
                  onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Any"
                  aria-label="To year"
                  className="w-20 rounded-full border border-input bg-card px-3 py-1.5 text-center text-sm font-semibold tabular-nums text-foreground outline-none transition placeholder:font-medium placeholder:text-muted-foreground focus:border-coral focus:ring-2 focus:ring-coral/15"
                />
              </div>
              <span className="max-w-60 text-xs font-medium text-muted-foreground">
                Limit results to this year range — leave blank for any.
              </span>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
