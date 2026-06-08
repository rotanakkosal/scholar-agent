import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashKey } from "../util/hash";
import { ReviewJobSchema, type ReviewJob, type JobParams } from "../schemas/job";

/**
 * Minimal file-based job store. On a normal server it persists to ./data/jobs;
 * on a read-only / serverless host (e.g. Vercel) it falls back to the OS temp
 * dir, and every write is best-effort so persistence can never crash a request.
 */
const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL
    ? join(tmpdir(), "scholar-agent", "jobs")
    : join(process.cwd(), "data", "jobs"));

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

function jobPath(id: string): string {
  return join(DATA_DIR, `${id}.json`);
}

export function paramsHash(params: JobParams): string {
  return hashKey(params);
}

export async function createJob(params: JobParams): Promise<ReviewJob> {
  const job: ReviewJob = {
    id: crypto.randomUUID(),
    params,
    status: "queued",
    createdAt: new Date().toISOString(),
    finishedAt: null,
    result: null,
    error: null,
  };
  await saveJob(job);
  return job;
}

/** Best-effort persist — never throws, so a read-only filesystem can't 500 a request. */
export async function saveJob(job: ReviewJob): Promise<void> {
  try {
    await ensureDir();
    await writeFile(jobPath(job.id), JSON.stringify(job, null, 2), "utf8");
  } catch (err) {
    console.warn(`jobStore: could not persist job ${job.id}: ${(err as Error).message}`);
  }
}

export async function getJob(id: string): Promise<ReviewJob | null> {
  try {
    const raw = await readFile(jobPath(id), "utf8");
    return ReviewJobSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function listJobs(): Promise<ReviewJob[]> {
  try {
    await ensureDir();
    const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
    const jobs: ReviewJob[] = [];
    for (const f of files) {
      try {
        jobs.push(ReviewJobSchema.parse(JSON.parse(await readFile(join(DATA_DIR, f), "utf8"))));
      } catch {
        // skip unreadable / malformed files
      }
    }
    return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/** Most recent completed job with identical params (for whole-job caching). */
export async function findCompletedByParams(params: JobParams): Promise<ReviewJob | null> {
  const target = paramsHash(params);
  const jobs = await listJobs();
  return jobs.find((j) => j.status === "done" && j.result && paramsHash(j.params) === target) ?? null;
}
