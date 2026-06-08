"use client";

import { useEffect, useState } from "react";

const STRATEGIES = ["keyword", "citation"] as const;
const TOPK_PRESETS = [5, 10, 20, 50];

export interface FindMoreSettings {
  topK: number;
  maxRounds: number;
  strategies: string[];
  yearFrom: number | null;
  yearTo: number | null;
}

export function FindMoreModal({
  open,
  defaults,
  onClose,
  onSubmit,
}: {
  open: boolean;
  defaults: FindMoreSettings;
  onClose: () => void;
  onSubmit: (settings: FindMoreSettings) => void;
}) {
  const [topK, setTopK] = useState(defaults.topK);
  const [maxRounds, setMaxRounds] = useState(defaults.maxRounds);
  const [strategies, setStrategies] = useState<string[]>(defaults.strategies);
  const [yearFrom, setYearFrom] = useState<number | null>(defaults.yearFrom);
  const [yearTo, setYearTo] = useState<number | null>(defaults.yearTo);

  // Reset to the project's settings each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setTopK(defaults.topK);
    setMaxRounds(defaults.maxRounds);
    setStrategies(defaults.strategies);
    setYearFrom(defaults.yearFrom);
    setYearTo(defaults.yearTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (s: string) =>
    setStrategies((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = () =>
    onSubmit({
      topK,
      maxRounds,
      strategies: strategies.length ? strategies : ["keyword"],
      yearFrom,
      yearTo,
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Find more papers settings"
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-fade-in relative w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-soft sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">Find more papers</h2>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Adjust the search, then add new papers to this project.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* How many papers */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-foreground">How many papers</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-input bg-card p-1">
                <button
                  type="button"
                  onClick={() => setTopK((v) => Math.max(1, v - 1))}
                  disabled={topK <= 1}
                  aria-label="Decrease"
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
                  aria-label="Increase"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
              <div className="flex gap-1.5">
                {TOPK_PRESETS.map((n) => (
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
          </div>

          {/* Refine rounds */}
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
          </div>

          {/* Strategies */}
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
          </div>

          {/* Year range */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-foreground">
              Published years <span className="font-medium text-muted-foreground">(optional)</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={yearFrom ?? ""}
                onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
                placeholder="From"
                className="w-24 rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral focus:bg-card placeholder:text-muted-foreground"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                inputMode="numeric"
                value={yearTo ?? ""}
                onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
                placeholder="To"
                className="w-24 rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral focus:bg-card placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Find papers
          </button>
        </div>
      </div>
    </div>
  );
}
