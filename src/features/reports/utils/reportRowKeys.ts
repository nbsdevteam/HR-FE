import type { ReportColumn, ReportRow } from "../types";

/**
 * Report rows are plain `Record<string, any>` bags with no id, so the table used
 * the array index as its React key. That ties a row's identity to its position:
 * regenerating the report under different department/date filters reuses the DOM
 * of whatever previously sat at that index. Deriving the key from the row's own
 * rendered values keeps identity with the data instead, with an occurrence
 * suffix so genuinely identical rows still get distinct keys.
 */
export const buildReportRowKeys = (
  rows: ReportRow[],
  columns: ReportColumn[],
): string[] => {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    // JSON encoding keeps the field boundaries unambiguous for any cell text.
    const signature = JSON.stringify(columns.map((col) => String(row[col.key] ?? "")));
    const occurrence = seen.get(signature) ?? 0;
    seen.set(signature, occurrence + 1);
    return occurrence === 0 ? signature : `${signature}#${occurrence}`;
  });
};
