"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";
import { useReview } from "@/hooks/useReview";
import { AppShell, LoadingShell } from "@/components/AppShell";
import { ProgressView } from "@/components/ProgressView";
import { ResultsTable } from "@/components/ResultsTable";
import { StatsStrip } from "@/components/StatsStrip";
import { Disagreements } from "@/components/Disagreements";
import {
  getProject,
  projectToState,
  liveProjectState,
  mergeReviewIntoProject,
  saveProject,
  type Project,
} from "@/lib/projects";

function BackLink() {
  return (
    <Link
      href="/"
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
  );
}

export default function ProjectPage() {
  const { user, ready } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");
  const [notice, setNotice] = useState<string | null>(null);

  const { state: live, start, cancel } = useReview();
  const prevRunning = useRef(false);

  useEffect(() => {
    if (!user || !id) return;
    const found = getProject(id);
    if (found && found.userId === user.email) {
      setProject(found);
      setStatus("ok");
    } else {
      setStatus("missing");
    }
  }, [user, id]);

  // When a "find more" run finishes, merge any new papers into the project and save.
  useEffect(() => {
    const justFinished = prevRunning.current && !live.running;
    prevRunning.current = live.running;
    if (!justFinished || !project) return;
    const newCount = live.paperOrder.filter((pid) => !project.paperOrder.includes(pid)).length;
    if (newCount > 0) {
      const updated = mergeReviewIntoProject(project, live);
      saveProject(updated);
      setProject(updated);
      setNotice(`Added ${newCount} new paper${newCount === 1 ? "" : "s"} to this project.`);
    } else {
      setNotice("No new papers found — try enabling Citation search or broadening the query.");
    }
  }, [live.running, project, live.paperOrder]);

  const findMore = () => {
    if (!project) return;
    setNotice(null);
    start({
      query: project.query,
      topK: project.params.topK,
      maxRounds: project.params.maxRounds,
      strategies: project.params.strategies,
      excludePaperIds: project.paperOrder,
    });
  };

  const finding = live.running || live.paperOrder.length > 0;
  const displayState = useMemo(() => {
    if (!project) return null;
    return finding ? liveProjectState(project, live) : projectToState(project);
  }, [project, live, finding]);

  if (!ready || !user) return <LoadingShell />;

  if (status === "missing") {
    return (
      <AppShell>
        <BackLink />
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-foreground">Project not found</h2>
          <p className="max-w-md text-sm font-medium text-muted-foreground">
            This project doesn’t exist, or it belongs to another account.
          </p>
          <Link
            href="/new"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong"
          >
            Start a new review
          </Link>
        </div>
      </AppShell>
    );
  }

  if (status === "loading" || !project || !displayState) {
    return (
      <AppShell>
        <BackLink />
        <p className="text-sm font-medium text-muted-foreground">Loading project…</p>
      </AppShell>
    );
  }

  const createdAt = new Date(project.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const baseHref =
    `/new?q=${encodeURIComponent(project.query)}` +
    `&topK=${project.params.topK}&rounds=${project.params.maxRounds}` +
    `&strategies=${encodeURIComponent(project.params.strategies.join(","))}`;
  const rerunHref = `${baseHref}&run=1`;

  return (
    <AppShell>
      <BackLink />

      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{project.query}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
            <span>{createdAt}</span>
            <span>· Top-K {project.params.topK}</span>
            <span>
              · {project.params.maxRounds} refine round{project.params.maxRounds === 1 ? "" : "s"}
            </span>
            <span>· {project.params.strategies.join(", ")}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={baseHref}
            title="Open this query in the editor to tweak it before running"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
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
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Duplicate &amp; edit
          </Link>
          <Link
            href={rerunHref}
            title="Run this query again as a new project (sources may have changed)"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
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
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Re-run
          </Link>
          {live.running ? (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Cancel search
            </button>
          ) : (
            <button
              type="button"
              onClick={findMore}
              title="Search for more papers and add them to this project"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong"
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
              Find more papers
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className="rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm font-medium text-foreground">
          {notice}
        </div>
      )}

      {live.error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          {live.error}
        </div>
      )}

      {finding && <ProgressView state={live} />}

      <StatsStrip state={displayState} />
      <ResultsTable state={displayState} />
      <Disagreements state={displayState} />
    </AppShell>
  );
}
