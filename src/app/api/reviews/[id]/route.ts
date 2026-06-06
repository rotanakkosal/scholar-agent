import { getJob } from "@/lib/store/jobStore";

export const runtime = "nodejs";

/** GET /api/reviews/:id — fetch a stored job (with its full result). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(job);
}
