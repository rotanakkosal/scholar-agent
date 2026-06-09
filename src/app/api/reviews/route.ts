import { runReview, JobParamsSchema } from "@/lib/index";
import type { ProgressEventInput } from "@/lib/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reviews stream for 20–40s+; raise the serverless timeout (Hobby max 60s, Pro up to 300).
export const maxDuration = 60;

/**
 * POST /api/reviews — start a literature review.
 * Streams progress as Server-Sent Events (`data: {…ProgressEvent}\n\n`) while the
 * pipeline runs. Results are consumed live by the client and saved there; the
 * server keeps no copy. Body: { query, topK?, maxRounds?, strategies?, ... }
 */
export async function POST(req: Request) {
  let body: unknown;
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
        await runReview(params, { emit: send, signal: req.signal });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
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
    },
  });
}
