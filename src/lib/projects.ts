"use client";

import type { ReviewState, ReviewParams, PaperProgress } from "@/hooks/useReview";
import type { PaperSummary } from "@/lib/schemas/summary";
import type { Disagreement } from "@/lib/schemas/disagreement";

/** A project == one saved literature review, scoped to a user (email). */
export interface Project {
  id: string;
  userId: string;
  query: string;
  params: { topK: number; maxRounds: number; strategies: string[] };
  createdAt: number;
  jobId?: string;
  // Snapshot of the review so it can be re-rendered read-only.
  paperOrder: string[];
  papers: Record<string, PaperProgress>;
  results: PaperSummary[];
  disagreements: Disagreement[];
  foundCount?: number;
  keptCount?: number;
}

const STORAGE_KEY = "scholar.projects";

function readAll(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Project[];
  } catch {
    return [];
  }
}

function writeAll(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(userId: string): Project[] {
  return readAll()
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getProject(id: string): Project | undefined {
  return readAll().find((p) => p.id === id);
}

export function saveProject(project: Project) {
  const all = readAll().filter((p) => p.id !== project.id);
  all.push(project);
  writeAll(all);
}

export function deleteProject(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

/** Build a Project snapshot from a finished review's state. */
export function projectFromState(
  userId: string,
  params: ReviewParams,
  state: ReviewState,
): Project {
  return {
    id: crypto.randomUUID(),
    userId,
    query: params.query,
    params: { topK: params.topK, maxRounds: params.maxRounds, strategies: params.strategies },
    createdAt: Date.now(),
    jobId: state.jobId,
    paperOrder: state.paperOrder,
    papers: state.papers,
    results: state.results,
    disagreements: state.disagreements,
    foundCount: state.foundCount,
    keptCount: state.keptCount,
  };
}

/** Reconstruct a ReviewState (read-only) from a stored Project for rendering. */
export function projectToState(project: Project): ReviewState {
  return {
    running: false,
    jobId: project.jobId,
    log: [],
    paperOrder: project.paperOrder,
    papers: project.papers,
    results: project.results,
    disagreements: project.disagreements,
    foundCount: project.foundCount,
    keptCount: project.keptCount,
  };
}

/** Append a review's new papers/results into a project, de-duplicated by paperId. */
export function mergeReviewIntoProject(project: Project, state: ReviewState): Project {
  const existing = new Set(project.paperOrder);
  const newIds = state.paperOrder.filter((id) => !existing.has(id));
  const disKey = (d: Disagreement) =>
    `${d.topic}|${d.sides.map((s) => s.paperId).sort().join(",")}`;
  const seen = new Set(project.disagreements.map(disKey));
  return {
    ...project,
    paperOrder: [...project.paperOrder, ...newIds],
    papers: { ...project.papers, ...state.papers },
    results: [...project.results, ...state.results.filter((r) => !existing.has(r.paperId))],
    disagreements: [
      ...project.disagreements,
      ...state.disagreements.filter((d) => !seen.has(disKey(d))),
    ],
    foundCount: (project.foundCount ?? 0) + (state.foundCount ?? 0),
    keptCount: (project.keptCount ?? project.paperOrder.length) + newIds.length,
  };
}

/** A ReviewState overlaying an in-progress "find more" run on top of a project. */
export function liveProjectState(project: Project, live: ReviewState): ReviewState {
  const merged = projectToState(mergeReviewIntoProject(project, live));
  return { ...merged, running: live.running, log: live.log, error: live.error };
}

export function projectStats(project: Project) {
  const reviewed = project.paperOrder.filter((id) => project.papers[id]?.summary).length;
  const passed = project.paperOrder.filter((id) => {
    const rounds = project.papers[id]?.rounds;
    return rounds?.[rounds.length - 1]?.pass;
  }).length;
  return { reviewed, passed, total: project.keptCount ?? project.paperOrder.length };
}
