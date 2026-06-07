"use client";

import { useMemo, useState } from "react";
import type { ReviewState } from "@/hooks/useReview";
import type { JudgeVerdict, ClaimFaithfulness } from "@/lib/schemas/judge";
import type { PaperSummary } from "@/lib/schemas/summary";

type Row = {
  paperId: string;
  summary: PaperSummary;
  verdict?: JudgeVerdict;
  claimFaithfulness?: ClaimFaithfulness | null;
};
type SortKey = "score" | "year" | "grounding";

// Solid badges: strong color fill, white text, no border.
const BADGE = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
const TONE = {
  success: "bg-success text-white",
  danger: "bg-destructive text-white",
  violet: "bg-violet text-white",
  pink: "bg-pink text-white",
  neutral: "bg-secondary text-secondary-foreground",
} as const;

function VerdictBadge({ verdict }: { verdict?: JudgeVerdict }) {
  if (!verdict) return null;
  return (
    <span title={verdict.feedback} className={`${BADGE} ${verdict.pass ? TONE.success : TONE.danger}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {verdict.pass ? "Pass" : "Fail"} {verdict.overall.toFixed(1)}/5
    </span>
  );
}

function FaithBadge({ cf }: { cf?: ClaimFaithfulness | null }) {
  if (!cf || cf.total === 0) return null;
  const allSupported = cf.supported === cf.total;
  return (
    <span
      title="Claim-level faithfulness: summary claims supported by the abstract"
      className={`${BADGE} ${allSupported ? TONE.violet : TONE.danger}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Facts {cf.supported}/{cf.total}
    </span>
  );
}

function Grounding({ pct }: { pct: number }) {
  return (
    <span className={`${BADGE} ${TONE.pink}`} title="Abstract grounding">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/30">
        <span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">{pct}%</span>
    </span>
  );
}

function ClaimList({ cf }: { cf: ClaimFaithfulness }) {
  return (
    <div>
      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-coral-strong">
        Claim check · {cf.supported}/{cf.total} supported by the abstract
      </div>
      <ul className="space-y-2.5">
        {cf.claims.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                c.supported ? "bg-success" : "bg-destructive"
              }`}
            >
              {c.supported ? "✓" : "✗"}
            </span>
            <span className="text-foreground">
              {c.claim}
              {c.reason && <span className="text-muted-foreground"> — {c.reason}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ summary }: { summary: PaperSummary }) {
  const [copied, setCopied] = useState(false);
  const cite = () => {
    const parts = [summary.title];
    if (summary.publishedYear) parts.push(`(${summary.publishedYear})`);
    let text = parts.join(" ");
    if (summary.doi) text += `. https://doi.org/${summary.doi}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={cite}
      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-coral hover:text-coral-strong"
    >
      {copied ? "Copied ✓" : "Copy citation"}
    </button>
  );
}

export function ResultsTable({ state }: { state: ReviewState }) {
  const [open, setOpen] = useState<string | null>(null);
  const [onlyPassed, setOnlyPassed] = useState(false);
  const [sort, setSort] = useState<SortKey>("score");

  const allRows: Row[] = state.paperOrder
    .map((id) => state.papers[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.summary))
    .map((p) => ({
      paperId: p.paperId,
      summary: p.summary!,
      verdict: p.rounds[p.rounds.length - 1],
      claimFaithfulness: p.claimFaithfulness,
    }));

  const passedCount = allRows.filter((r) => r.verdict?.pass).length;

  const rows = useMemo(() => {
    const filtered = onlyPassed ? allRows.filter((r) => r.verdict?.pass) : allRows;
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "year") return (b.summary.publishedYear ?? 0) - (a.summary.publishedYear ?? 0);
      if (sort === "grounding")
        return (b.verdict?.faithfulnessOverlap ?? 0) - (a.verdict?.faithfulnessOverlap ?? 0);
      return (b.verdict?.overall ?? 0) - (a.verdict?.overall ?? 0);
    });
    return sorted;
  }, [allRows, onlyPassed, sort]);

  if (allRows.length === 0) return null;

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "score", label: "Score" },
    { key: "year", label: "Year" },
    { key: "grounding", label: "Grounding" },
  ];

  return (
    <section className="flex flex-col gap-4">
      {/* Sticky toolbar */}
      <div className="sticky top-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Results <span className="text-muted-foreground">({allRows.length})</span>
        </h2>
        <span className="text-xs font-semibold text-muted-foreground">
          <span className="text-success">{passedCount} passed</span> ·{" "}
          {allRows.length - passedCount} failed
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Passed-only filter */}
          <button
            type="button"
            onClick={() => setOnlyPassed((v) => !v)}
            aria-pressed={onlyPassed}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              onlyPassed
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            Passed only
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  sort === s.key
                    ? "bg-coral-soft text-coral-strong"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Export */}
          {state.jobId && !state.running && (
            <div className="flex items-center gap-1.5">
              {(["csv", "md", "json"] as const).map((fmt) => (
                <a
                  key={fmt}
                  href={`/api/reviews/${state.jobId}/export?format=${fmt}`}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:border-coral hover:text-coral-strong"
                >
                  {fmt.toUpperCase()}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          No papers passed the judge yet.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {rows.map(({ paperId, summary: s, verdict, claimFaithfulness: cf }) => {
          const isOpen = open === paperId;
          const pct = verdict ? Math.round(verdict.faithfulnessOverlap * 100) : 0;
          return (
            <article
              key={paperId}
              className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-base font-bold leading-snug text-card-foreground">
                {s.doi ? (
                  <a
                    href={`https://doi.org/${s.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-coral-strong hover:underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </h3>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                  <span className="tabular-nums">{s.publishedYear ?? "year n/a"}</span>
                  {s.doi && <span className="truncate">· {s.doi}</span>}
                  {s.revisions > 0 && <span>· {s.revisions} revision(s)</span>}
                  {!s.abstractAvailable && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                      no abstract
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={verdict} />
                  <FaithBadge cf={cf} />
                  {verdict && <Grounding pct={pct} />}
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/40 p-4">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-coral-strong">
                    Methodology
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{s.methodology}</p>
                </div>
                <div className="rounded-2xl bg-secondary/40 p-4">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-coral-strong">
                    Contribution
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{s.contribution}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <CopyButton summary={s} />
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : paperId)}
                  className="text-xs font-semibold text-muted-foreground transition hover:text-coral-strong"
                >
                  {isOpen ? "Hide details ↑" : "Show rubric & abstract ↓"}
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={!isOpen}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-6 border-t border-border pt-5">
                  {/* 1. Rubric — the judge's verdict, scannable first */}
                  {verdict && (
                    <div>
                      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-coral-strong">
                        Rubric
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {(["clarity", "keyFinding", "faithfulness", "consistency"] as const).map(
                          (d) => (
                            <div
                              key={d}
                              className="rounded-xl border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-muted-foreground"
                            >
                              <span className="font-bold capitalize text-foreground">
                                {d} {verdict.scores[d].score}/5
                              </span>{" "}
                              — {verdict.scores[d].reason}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Claim check — the grounding evidence */}
                  {cf && cf.total > 0 && <ClaimList cf={cf} />}

                  {/* 3. Abstract — the raw source, reference last */}
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-coral-strong">
                      Abstract
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {s.abstract || "(none)"}
                    </p>
                  </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
