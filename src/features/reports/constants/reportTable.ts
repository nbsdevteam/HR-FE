import type { CSSProperties } from "react";

/** Width (px) of the pinned row-number column in the results table. */
export const REPORT_INDEX_COLUMN_WIDTH = 44;

/** Column count above which the results table shows a "scroll for more" hint. */
export const REPORT_SCROLL_HINT_COLUMN_THRESHOLD = 6;

export type ReportStickyColumn = "index" | "primary";

/** Inline style pinning the row-number and first data column while the results table scrolls horizontally. */
export const getReportStickyCellStyle = (sticky: ReportStickyColumn): CSSProperties => ({
  position: "sticky",
  insetInlineStart: sticky === "index" ? 0 : REPORT_INDEX_COLUMN_WIDTH,
  zIndex: 2,
  width: sticky === "index" ? REPORT_INDEX_COLUMN_WIDTH : undefined,
});
