"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { AppShell, LoadingShell } from "@/components/AppShell";
import { listProjects, deleteProject, projectStats, type Project } from "@/lib/projects";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-coral-soft/70 via-card to-card p-8 shadow-sm sm:p-10">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-coral/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" /> LLM-as-Judge verified
        </span>
        <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          Verified literature reviews, on demand.
        </h2>
        <p className="max-w-lg text-sm font-medium text-muted-foreground">
          Ask a research question and get a ranked, summarized, and judge-checked table of papers - 
          saved as a project you can revisit anytime.
        </p>
        <Link
          href="/new"
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-coral-foreground shadow-sm transition hover:bg-coral-strong"
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
          Start a new review
        </Link>
      </div>
    </section>
  );
}

function NewProjectTile() {
  return (
    <Link
      href="/new"
      className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card p-6 text-center transition hover:border-coral hover:bg-coral-soft/40"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground transition group-hover:bg-coral group-hover:text-coral-foreground">
        <svg
          className="h-6 w-6"
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
      </span>
      <span className="text-sm font-bold text-foreground">New project</span>
    </Link>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const { passed, total } = projectStats(project);
  return (
    <div className="group relative flex min-h-[160px] flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <Link
        href={`/projects/${project.id}`}
        aria-label={project.query}
        className="absolute inset-0 z-0 rounded-3xl"
      />
      <div className="relative z-0">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {project.query}
        </h3>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{formatDate(project.createdAt)}</p>
      </div>

      <div className="relative z-0 mt-4 flex items-center gap-3 text-xs font-semibold">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
          {total} paper{total === 1 ? "" : "s"}
        </span>
        <span className="text-success">{passed} passed</span>
      </div>

      <button
        type="button"
        onClick={() => onDelete(project.id)}
        aria-label="Delete project"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive-soft hover:text-destructive group-hover:opacity-100"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user, ready } = useRequireAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  const refresh = useCallback(() => {
    if (user) setProjects(listProjects(user.username));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    deleteProject(id);
    refresh();
  };

  if (!ready || !user) return <LoadingShell />;

  return (
    <AppShell>
      <Hero />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Your projects <span className="text-muted-foreground">({projects.length})</span>
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NewProjectTile />
            <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-border bg-secondary/40 p-6 text-center text-sm font-medium text-muted-foreground sm:col-span-1 lg:col-span-2">
              No projects yet — start your first literature review.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NewProjectTile />
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
