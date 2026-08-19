import { formatWorkHours } from "@/shared/hooks";
import { attendanceMonthNamesByNumber } from "../data";
import type { MonthlyBreakdownEntry } from "../types";

type MonthlyBreakdownTableRowProps = {
  row: MonthlyBreakdownEntry;
};

const MonthlyBreakdownTableRow = ({ row }: MonthlyBreakdownTableRowProps) => {
  const [yr, mn] = row.month.split("-");
  const avg = row.days > 0 ? row.hours / row.days : 0;

  return (
    <tr className="border-b border-border/10 hover:bg-muted/5">
      <td className="px-3 py-2 text-center text-foreground" style={{ fontSize: 12 }}>
        {attendanceMonthNamesByNumber[mn] || mn} {yr}
      </td>
      <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.days}</td>
      <td className="px-3 py-2 text-center font-mono text-blue-400" style={{ fontSize: 12 }}>{formatWorkHours(row.hours)}</td>
      <td className="px-3 py-2 text-center font-mono text-amber-400" style={{ fontSize: 12 }}>{formatWorkHours(avg)}</td>
      <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.overtime > 0 ? formatWorkHours(row.overtime) : "—"}</td>
      <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
        {row.late > 0 ? <span className="text-primary">{row.late}</span> : <span className="text-muted-foreground/30">—</span>}
      </td>
      <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
        {row.absent > 0 ? <span className="text-destructive">{row.absent}</span> : <span className="text-muted-foreground/30">—</span>}
      </td>
    </tr>
  );
};

export default MonthlyBreakdownTableRow;
