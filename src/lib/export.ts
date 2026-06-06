import type { PaperSummary } from "./schemas/summary";

/** Table 1 columns, in order. */
const HEADERS = ["Title", "Abstract", "Published Year", "DOI", "Methodology", "Contribution"];

function csvCell(value: string | number | null): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: PaperSummary[]): string {
  const lines = [HEADERS.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [r.title, r.abstract, r.publishedYear, r.doi, r.methodology, r.contribution]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

function mdCell(s: string | null): string {
  return (s ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

export function toMarkdown(rows: PaperSummary[]): string {
  const header = "| Title | Year | DOI | Methodology | Contribution |\n|---|---|---|---|---|";
  const body = rows
    .map(
      (r) =>
        `| ${mdCell(r.title)} | ${r.publishedYear ?? ""} | ${mdCell(r.doi)} | ${mdCell(r.methodology)} | ${mdCell(r.contribution)} |`,
    )
    .join("\n");
  return `${header}\n${body}\n`;
}
