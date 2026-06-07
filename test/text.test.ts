import { describe, it, expect } from "vitest";
import { normalizeTitle, tokenize, truncate } from "../src/lib/util/text";

describe("text utils", () => {
  it("normalizeTitle lowercases and strips punctuation", () => {
    expect(normalizeTitle("RAG: A Survey!")).toBe("rag a survey");
  });

  it("tokenize splits into lowercase alphanumeric tokens", () => {
    expect(tokenize("Hello, World! 123")).toEqual(["hello", "world", "123"]);
  });

  it("truncate shortens long text to the max length", () => {
    expect(truncate("abcdefghij", 5)).toHaveLength(5);
    expect(truncate("short", 50)).toBe("short");
  });
});
