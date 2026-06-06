"use client";

import { useCallback, useRef, useState } from "react";
import type { ProgressEvent } from "@/lib/schemas/events";
import type { PaperSummary } from "@/lib/schemas/summary";
import type { JudgeVerdict } from "@/lib/schemas/judge";

export interface ReviewParams {
  query: string;
  topK: number;
  maxRounds: number;
  strategies: string[];
  refresh?: boolean;
}

export interface PaperProgress {
  paperId: string;
  title: string;
  index: number;
  total: number;
  rounds: JudgeVerdict[];
  summary?: PaperSummary;
}

export interface ReviewState {
  running: boolean;
  jobId?: string;
  phase?: string;
  log: string[];
  paperOrder: string[];
  papers: Record<string, PaperProgress>;
  results: PaperSummary[];
  error?: string;
  foundCount?: number;
  keptCount?: number;
}

const EMPTY: ReviewState = {
  running: false,
  log: [],
  paperOrder: [],
  papers: {},
  results: [],
};

function reduce(state: ReviewState, evt: ProgressEvent): ReviewState {
  switch (evt.type) {
    case "phase":
      return { ...state, phase: `${evt.phase} ${evt.state}` };
    case "search_strategy":
      return { ...state, log: [...state.log, `${evt.strategy}: ${evt.queries.join(" · ")}`] };
    case "papers_found":
      return { ...state, foundCount: evt.found, keptCount: evt.afterDedup };
    case "paper_start":
      return {
        ...state,
        paperOrder: state.paperOrder.includes(evt.paperId)
          ? state.paperOrder
          : [...state.paperOrder, evt.paperId],
        papers: {
          ...state.papers,
          [evt.paperId]: {
            paperId: evt.paperId,
            title: evt.title,
            index: evt.index,
            total: evt.total,
            rounds: [],
          },
        },
      };
    case "summary_round": {
      const p = state.papers[evt.paperId];
      if (!p) return state;
      return {
        ...state,
        papers: { ...state.papers, [evt.paperId]: { ...p, rounds: [...p.rounds, evt.verdict] } },
      };
    }
    case "paper_done": {
      const p = state.papers[evt.paperId];
      if (!p) return state;
      return {
        ...state,
        papers: { ...state.papers, [evt.paperId]: { ...p, summary: evt.summary } },
      };
    }
    case "done":
      return { ...state, results: evt.result };
    case "log":
      return { ...state, log: [...state.log, `${evt.level}: ${evt.message}`] };
    case "error":
      return { ...state, error: evt.message };
    default:
      return state;
  }
}

/** Runs a review by POSTing to /api/reviews and consuming the SSE stream. */
export function useReview() {
  const [state, setState] = useState<ReviewState>(EMPTY);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (params: ReviewParams) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ ...EMPTY, running: true });

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: ac.signal,
      });
      const jobId = res.headers.get("X-Job-Id") ?? undefined;
      setState((s) => ({ ...s, jobId }));
      if (!res.ok || !res.body) {
        throw new Error(`request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const evt = JSON.parse(json) as ProgressEvent;
            setState((s) => reduce(s, evt));
          } catch {
            // ignore malformed event
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setState((s) => ({ ...s, error: (err as Error).message }));
      }
    } finally {
      setState((s) => ({ ...s, running: false }));
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { state, start, cancel };
}
