import { describe, it, expect } from "vitest";
import { z } from "zod";
import { callStructured } from "../src/lib/llm/structured";
import { fakeClient } from "./helpers";

const Schema = z.object({ x: z.number(), y: z.string() });

describe("callStructured", () => {
  it("parses a valid JSON response", async () => {
    const client = fakeClient(() => JSON.stringify({ x: 1, y: "ok" }));
    const out = await callStructured({ client, model: "fake", schema: Schema, messages: [] });
    expect(out).toEqual({ x: 1, y: "ok" });
  });

  it("extracts JSON from surrounding prose / code fences", async () => {
    const client = fakeClient(() => 'Here you go:\n```json\n{"x":2,"y":"z"}\n```');
    const out = await callStructured({ client, model: "fake", schema: Schema, messages: [] });
    expect(out.x).toBe(2);
  });

  it("repairs after an invalid first response", async () => {
    const client = fakeClient((_opts, call) =>
      call === 0 ? "not json at all" : JSON.stringify({ x: 3, y: "ok" }),
    );
    const out = await callStructured({ client, model: "fake", schema: Schema, messages: [], maxRepairs: 2 });
    expect(out.x).toBe(3);
  });

  it("throws after exhausting repair attempts", async () => {
    const client = fakeClient(() => "never valid json");
    await expect(
      callStructured({ client, model: "fake", schema: Schema, messages: [], maxRepairs: 1 }),
    ).rejects.toThrow();
  });
});
