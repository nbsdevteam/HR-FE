import { memo } from "react";
import { getReportStickyCellStyle, type ReportStickyColumn } from "../constants/reportTable";

type ReportResultsHeaderCellProps = {
  label: string;
  /** Pins this header cell while the table scrolls horizontally — "index" for the row-number column, "primary" for the first data column. */
  sticky?: ReportStickyColumn;
};

const ReportResultsHeaderCell = ({ label, sticky }: ReportResultsHeaderCellProps) => (
  <th
    className="p-3 text-start text-muted-foreground font-medium whitespace-nowrap bg-muted/30"
    style={{ fontSize: 12, ...(sticky ? getReportStickyCellStyle(sticky) : null) }}
  >
    {label}
  </th>
);

export default memo(ReportResultsHeaderCell);
