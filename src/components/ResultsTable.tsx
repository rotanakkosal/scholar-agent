"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReviewState } from "@/hooks/useReview";
import type { JudgeVerdict, ClaimFaithfulness } from "@/lib/schemas/judge";
import type { PaperSummary } from "@/lib/schemas/summary";

type Row = {
  paperId: string;
  summary: PaperSummary;
  verdict?: JudgeVerdict;
  claimFaithfulness?: ClaimFaithfulness | null;
};
type SortKey = "recent" | "score" | "year" | "grounding";
type View = "cards" | "compact";

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

function NewPill() {
  return (
    <span className="inline-flex items-center rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral-foreground">
      New
    </span>
  );
}

function SummaryGrid({ s }: { s: PaperSummary }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
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
  );
}

function DetailSection({ row }: { row: Row }) {
  const { summary: s, verdict, claimFaithfulness: cf } = row;
  return (
    <div className="flex flex-col gap-6 border-t border-border pt-5">
      {verdict && (
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-coral-strong">
            Rubric
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(["clarity", "keyFinding", "faithfulness", "consistency"] as const).map((d) => (
              <div
                key={d}
                className="rounded-xl border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="font-bold capitalize text-foreground">
                  {d} {verdict.scores[d].score}/5
                </span>{" "}
                — {verdict.scores[d].reason}
              </div>
            ))}
          </div>
        </div>
      )}
      {cf && cf.total > 0 && (
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
      )}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-coral-strong">
          Abstract
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{s.abstract || "(none)"}</p>
      </div>
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

export function ResultsTable({
  state,
  newPaperIds,
}: {
  state: ReviewState;
  /** Papers from the most-recent "find more" batch — badged "New" and surfaced first. */
  newPaperIds?: string[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [onlyPassed, setOnlyPassed] = useState(false);
  const [sort, setSort] = useState<SortKey>("score");
  const [view, setView] = useState<View>("cards");
  const [filter, setFilter] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLOListElement>(null);

  const newSet = useMemo(() => new Set(newPaperIds ?? []), [newPaperIds]);
  const hasNew = newSet.size > 0;

  // Surface newly-added papers at the top the moment a "find more" batch arrives.
  const prevNew = useRef(0);
  useEffect(() => {
    if (newSet.size > prevNew.current) setSort("recent");
    prevNew.current = newSet.size;
  }, [newSet]);

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
    const q = filter.trim().toLowerCase();
    let out = allRows;
    if (q) {
      out = out.filter((r) =>
        `${r.summary.title} ${r.summary.methodology} ${r.summary.contribution}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (onlyPassed) out = out.filter((r) => r.verdict?.pass);
    return [...out].sort((a, b) => {
      if (sort === "recent") {
        const an = newSet.has(a.paperId) ? 1 : 0;
        const bn = newSet.has(b.paperId) ? 1 : 0;
        if (an !== bn) return bn - an;
        return (b.verdict?.overall ?? 0) - (a.verdict?.overall ?? 0);
      }
      if (sort === "year") return (b.summary.publishedYear ?? 0) - (a.summary.publishedYear ?? 0);
      if (sort === "grounding")
        return (b.verdict?.faithfulnessOverlap ?? 0) - (a.verdict?.faithfulnessOverlap ?? 0);
      return (b.verdict?.overall ?? 0) - (a.verdict?.overall ?? 0);
    });
  }, [allRows, onlyPassed, sort, newSet, filter]);

  const rowIds = rows.map((r) => r.paperId).join("|");

  // Scroll-spy: highlight the paper currently nearest the top of the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[id^="paper-"]'));
    if (els.length === 0) return;
    const tops = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.slice("paper-".length);
          if (e.isIntersecting) tops.set(id, e.boundingClientRect.top);
          else tops.delete(id);
        }
        let best: string | null = null;
        let bestTop = Infinity;
        tops.forEach((top, id) => {
          if (top < bestTop) {
            bestTop = top;
            best = id;
          }
        });
        if (best) setActiveId(best);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rowIds, view]);

  // Keep the active item scrolled into view within the index panel.
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    navRef.current
      .querySelector<HTMLElement>(`[data-id="${activeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  if (allRows.length === 0) return null;

  const SORTS: { key: SortKey; label: string }[] = [
    ...(hasNew ? [{ key: "recent" as const, label: "Recently added" }] : []),
    { key: "score", label: "Score" },
    { key: "year", label: "Year" },
    { key: "grounding", label: "Grounding" },
  ];

  const scrollToPaper = (id: string) => {
    document.getElementById(`paper-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(id);
  };

  const pillBtn = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${
      active ? "bg-coral-soft text-coral-strong" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <section className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Jump-to index (large screens) — sticky panel with scroll-spy highlight */}
      <nav className="hidden lg:block">
        <div className="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col rounded-3xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 px-2 pt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Jump to ({rows.length})
          </div>
          <ol ref={navRef} className="flex flex-col gap-0.5 overflow-y-auto pr-1">
            {rows.map((r, i) => {
              const active = r.paperId === activeId;
              return (
                <li key={r.paperId}>
                  <button
                    type="button"
                    data-id={r.paperId}
                    onClick={() => scrollToPaper(r.paperId)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-coral-soft text-coral-strong"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`w-4 shrink-0 text-xs tabular-nums ${
                        active ? "text-coral-strong" : "text-muted-foreground/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="line-clamp-2 flex-1 leading-snug">{r.summary.title}</span>
                    {r.verdict && (
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 self-start rounded-full ${
                          r.verdict.pass ? "bg-success" : "bg-destructive"
                        }`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <div className="flex min-w-0 flex-col gap-4">
        {/* Sticky toolbar */}
        <div className="sticky top-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Results <span className="text-muted-foreground">({allRows.length})</span>
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {filter ? (
              <span>
                {rows.length} of {allRows.length} shown
              </span>
            ) : (
              <>
                <span className="text-success">{passedCount} passed</span> ·{" "}
                {allRows.length - passedCount} failed
              </>
            )}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <svg
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
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
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter papers…"
                aria-label="Filter papers"
                className="w-28 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground sm:w-36"
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter("")}
                  aria-label="Clear filter"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5">
              <button type="button" onClick={() => setView("cards")} aria-pressed={view === "cards"} className={pillBtn(view === "cards")}>
                Cards
              </button>
              <button type="button" onClick={() => setView("compact")} aria-pressed={view === "compact"} className={pillBtn(view === "compact")}>
                Compact
              </button>
            </div>

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
                <button key={s.key} type="button" onClick={() => setSort(s.key)} aria-pressed={sort === s.key} className={pillBtn(sort === s.key)}>
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
            {filter ? "No papers match your filter." : "No papers passed the judge yet."}
          </p>
        )}

        {/* COMPACT VIEW — one row per paper */}
        {view === "compact" && rows.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {rows.map(({ paperId, summary: s, verdict, claimFaithfulness: cf }, i) => {
              const isOpen = open === paperId;
              const isNew = newSet.has(paperId);
              return (
                <div
                  id={`paper-${paperId}`}
                  key={paperId}
                  className={`scroll-mt-20 ${i > 0 ? "border-t border-border" : ""} ${
                    isNew ? "bg-coral-soft/30" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : paperId)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/60"
                  >
                    {isNew && <NewPill />}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {s.title}
                    </span>
                    <span className="hidden shrink-0 text-xs font-medium tabular-nums text-muted-foreground sm:inline">
                      {s.publishedYear ?? "—"}
                    </span>
                    <VerdictBadge verdict={verdict} />
                    <FaithBadge cf={cf} />
                    <svg
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
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
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-5 px-4 pb-5">
                      <SummaryGrid s={s} />
                      <div className="flex items-center gap-3">
                        <CopyButton summary={s} />
                        {s.doi && (
                          <a
                            href={`https://doi.org/${s.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-muted-foreground transition hover:text-coral-strong"
                          >
                            Open DOI ↗
                          </a>
                        )}
                      </div>
                      <DetailSection row={{ paperId, summary: s, verdict, claimFaithfulness: cf }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CARDS VIEW — full card per paper */}
        {view === "cards" &&
          rows.map(({ paperId, summary: s, verdict, claimFaithfulness: cf }) => {
            const isOpen = open === paperId;
            const pct = verdict ? Math.round(verdict.faithfulnessOverlap * 100) : 0;
            const isNew = newSet.has(paperId);
            return (
              <article
                id={`paper-${paperId}`}
                key={paperId}
                className={`animate-fade-in scroll-mt-20 rounded-3xl border bg-card p-6 shadow-sm transition hover:shadow-md ${
                  isNew ? "border-coral/40 ring-2 ring-coral/20" : "border-border"
                }`}
              >
                <h3 className="text-base font-bold leading-snug text-card-foreground">
                  {isNew && <span className="mr-2 align-middle"><NewPill /></span>}
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

                <div className="mt-5">
                  <SummaryGrid s={s} />
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
                    <DetailSection row={{ paperId, summary: s, verdict, claimFaithfulness: cf }} />
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}
