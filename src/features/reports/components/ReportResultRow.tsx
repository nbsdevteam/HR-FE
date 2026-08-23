import { memo } from "react";
import type { DbReportTemplate } from "@/shared/hooks";
import type { ReportRow } from "../types";

interface IReportResultRowProps {
  row: ReportRow;
  index: number;
  columns: DbReportTemplate["columns"];
}

const ReportResultRow = ({ row, index, columns }: IReportResultRowProps) => (
  <tr className="border-b border-border/20 hover:bg-muted/10">
    <td className="p-3 text-muted-foreground" style={{ fontSize: 12 }}>
      {index + 1}
    </td>
    {columns.map((col) => (
      <td
        key={col.key}
        className="p-3 text-foreground"
        style={{ fontSize: 12 }}
      >
        {row[col.key] ?? "—"}
      </td>
    ))}
  </tr>
);

export default memo(ReportResultRow);
