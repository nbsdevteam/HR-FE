import { memo } from "react";
import { getReportStickyCellStyle } from "../constants/reportTable";
import type { ReportColumn, ReportRow } from "../types";

interface IReportResultRowProps {
  row: ReportRow;
  index: number;
  columns: ReportColumn[];
}

const ReportResultRow = ({ row, index, columns }: IReportResultRowProps) => (
  <tr className="border-b border-border/20 hover:bg-muted/10">
    <td
      className="p-3 text-muted-foreground whitespace-nowrap bg-card"
      style={{ fontSize: 12, ...getReportStickyCellStyle("index") }}
    >
      {index + 1}
    </td>
    {columns.map((col, colIndex) => (
      <td
        key={col.key}
        className={`p-3 text-foreground whitespace-nowrap${colIndex === 0 ? " bg-card" : ""}`}
        style={{ fontSize: 12, ...(colIndex === 0 ? getReportStickyCellStyle("primary") : null) }}
      >
        {row[col.key] ?? "—"}
      </td>
    ))}
  </tr>
);

export default memo(ReportResultRow);
