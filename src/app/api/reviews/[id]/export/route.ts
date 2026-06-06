import { getJob } from "@/lib/store/jobStore";
import { toCsv, toMarkdown } from "@/lib/export";

export const runtime = "nodejs";

/** GET /api/reviews/:id/export?format=csv|md|json — download the results table. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job?.result) return Response.json({ error: "not found" }, { status: 404 });

  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const base = `scholar-review-${id}`;

  if (format === "csv") {
    return new Response(toCsv(job.result), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}.csv"`,
      },
    });
  }
  if (format === "md") {
    return new Response(toMarkdown(job.result), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}.md"`,
      },
    });
  }
  return new Response(JSON.stringify(job.result, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.json"`,
    },
  });
}
