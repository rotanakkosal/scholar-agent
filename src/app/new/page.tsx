"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";
import { useReview, type ReviewParams } from "@/hooks/useReview";
import { AppShell, LoadingShell } from "@/components/AppShell";
import { QueryForm } from "@/components/QueryForm";
import { ProgressView } from "@/components/ProgressView";
import { ResultsTable } from "@/components/ResultsTable";
import { StatsStrip } from "@/components/StatsStrip";
import { Disagreements } from "@/components/Disagreements";
import { projectFromState, saveProject } from "@/lib/projects";

export default function NewProjectPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <NewProjectInner />
    </Suspense>
  );
}

function NewProjectInner() {
  const { user, ready } = useRequireAuth();
  const { state, start, cancel } = useReview();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill values when re-running a saved project (/new?q=...&run=1).
  const presetQuery = searchParams.get("q") ?? "";
  const topKParam = searchParams.get("topK");
  const roundsParam = searchParams.get("rounds");
  const strategiesParam = searchParams.get("strategies");
  const presetTopK = topKParam && Number(topKParam) ? Number(topKParam) : 5;
  const presetRounds =
    roundsParam !== null && !Number.isNaN(Number(roundsParam)) ? Number(roundsParam) : 2;
  const presetStrategies = strategiesParam
    ? strategiesParam.split(",").filter(Boolean)
    : ["keyword", "citation"];
  const yearFromParam = searchParams.get("yearFrom");
  const yearToParam = searchParams.get("yearTo");
  const presetYearFrom = yearFromParam && Number(yearFromParam) ? Number(yearFromParam) : null;
  const presetYearTo = yearToParam && Number(yearToParam) ? Number(yearToParam) : null;
  const autorun = searchParams.get("run") === "1";

  const activityRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<ReviewParams | null>(null);
  const savedRef = useRef(false);
  const autoStartedRef = useRef(false);

  const beginRun = (params: ReviewParams) => {
    paramsRef.current = params;
    savedRef.current = false;
    start(params);
  };

  // Auto-run once when arriving from a "Re-run" link.
  useEffect(() => {
    if (autorun && presetQuery && user && !autoStartedRef.current) {
      autoStartedRef.current = true;
      beginRun({
        query: presetQuery,
        topK: presetTopK,
        maxRounds: presetRounds,
        strategies: presetStrategies,
        yearFrom: presetYearFrom,
        yearTo: presetYearTo,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorun, presetQuery, user]);

  // Reveal activity as the run starts.
  useEffect(() => {
    if (state.running) activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.running]);

  // Warn before reload/close while a review is still running (cheap data-loss guard).
  useEffect(() => {
    if (!state.running) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.running]);

  // Persist as a project once the run finishes, then jump to its stable URL so
  // the results are reload-safe (they live at /projects/[id] from now on).
  useEffect(() => {
    if (
      !state.running &&
      state.results.length > 0 &&
      !savedRef.current &&
      paramsRef.current &&
      user
    ) {
      savedRef.current = true;
      const project = projectFromState(user.username, paramsRef.current, state);
      saveProject(project);
      router.replace(`/projects/${project.id}`);
    }
  }, [state, user, router]);

  // Guard in-app navigation away from a running review.
  const guardedLeave = (e: React.MouseEvent) => {
    if (state.running) {
      if (!confirm("A review is still running. Leave and cancel it?")) {
        e.preventDefault();
        return;
      }
      cancel();
    }
  };

  if (!ready || !user) return <LoadingShell />;

  const showActivity =
    state.running || state.paperOrder.length > 0 || state.log.length > 0 || !!state.error;

  return (
    <AppShell>
      <Link
        href="/"
        onClick={guardedLeave}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-coral-strong"
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
          <path d="m15 18-6-6 6-6" />
        </svg>
        All projects
      </Link>

      <QueryForm
        key={`${presetQuery}|${presetTopK}|${presetRounds}|${presetStrategies.join(",")}|${presetYearFrom}|${presetYearTo}`}
        running={state.running}
        onStart={beginRun}
        onCancel={cancel}
        initialQuery={presetQuery}
        initialTopK={presetTopK}
        initialMaxRounds={presetRounds}
        initialStrategies={presetStrategies}
        initialYearFrom={presetYearFrom}
        initialYearTo={presetYearTo}
      />

      {state.error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      {showActivity && (
        <div ref={activityRef} className="flex scroll-mt-6 flex-col gap-5">
          <StatsStrip state={state} />
          <ProgressView state={state} />
        </div>
      )}

      <ResultsTable state={state} />
      <Disagreements state={state} />
    </AppShell>
  );
}
