import { runReview, JobParamsSchema } from "@/lib/index";
import type { ProgressEventInput } from "@/lib/index";
import { createJob, saveJob, listJobs, findCompletedByParams } from "@/lib/store/jobStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reviews — start a literature review.
 * Streams progress as Server-Sent Events (`data: {…ProgressEvent}\n\n`) while the
 * pipeline runs, then persists the job. The job id is returned in `X-Job-Id`.
 * Body: { query, topK?, maxRounds?, strategies?, refresh? }
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = JobParamsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }
  const params = parsed.data;
  const refresh = body?.refresh === true;
  const job = await createJob(params);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProgressEventInput) => {
        try {
          const payload = JSON.stringify({ ...event, ts: new Date().toISOString() });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // controller already closed (client disconnected)
        }
      };

      try {
        const cached = refresh ? null : await findCompletedByParams(params);
        if (cached?.result) {
          send({ type: "log", level: "info", message: "Served from cache (identical query already run)." });
          send({ type: "done", result: cached.result });
          await saveJob({ ...job, status: "done", finishedAt: new Date().toISOString(), result: cached.result });
        } else {
          await saveJob({ ...job, status: "searching" });
          const rows = await runReview(params, { emit: send, signal: req.signal });
          await saveJob({
            ...job,
            status: "done",
            finishedAt: new Date().toISOString(),
            result: rows.map((r) => r.summary),
          });
        }
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
        await saveJob({
          ...job,
          status: "error",
          finishedAt: new Date().toISOString(),
          error: (err as Error).message,
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Job-Id": job.id,
    },
  });
}

/** GET /api/reviews — list past jobs (most recent first). */
export async function GET() {
  const jobs = await listJobs();
  return Response.json(
    jobs.map((j) => ({
      id: j.id,
      query: j.params.query,
      status: j.status,
      createdAt: j.createdAt,
      count: j.result?.length ?? 0,
    })),
  );
}
