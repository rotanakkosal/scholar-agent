import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { hashKey } from "../util/hash";
import { ReviewJobSchema, type ReviewJob, type JobParams } from "../schemas/job";

/**
 * Minimal file-based job store (data/jobs/<id>.json). No native deps — fine for
 * a single-user local tool. Provides persistence, history, and params-hash
 * lookup for whole-job caching.
 */
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data", "jobs");

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

export async function saveJob(job: ReviewJob): Promise<void> {
  await ensureDir();
  await writeFile(jobPath(job.id), JSON.stringify(job, null, 2), "utf8");
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
}

/** Most recent completed job with identical params (for whole-job caching). */
export async function findCompletedByParams(params: JobParams): Promise<ReviewJob | null> {
  const target = paramsHash(params);
  const jobs = await listJobs();
  return jobs.find((j) => j.status === "done" && j.result && paramsHash(j.params) === target) ?? null;
}
