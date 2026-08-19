import { memo, useCallback } from "react";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { dayNamesAr } from "../styles";
import PopoverExcuseButton from "./shared/PopoverExcuseButton";

type ShortfallTableRowProps = {
  rec: ProcessedAttendanceRecord;
  targetHours: number;
  onExcuse: (id: string) => void;
};

const ShortfallTableRow = ({ rec, targetHours, onExcuse }: ShortfallTableRowProps) => {
  const shortage = targetHours - rec.workingHours;
  const handleExcuse = useCallback(() => onExcuse(rec.id), [onExcuse, rec.id]);

  return (
    <tr className={`border-b border-border/10 ${rec.excusedShortfall ? "bg-emerald-500/5" : ""}`}>
      <td className="px-4 py-2.5 text-foreground whitespace-nowrap" style={{ fontSize: 12 }}>{rec.date}</td>
      <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 12 }}>{dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek}</td>
      <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckIn || "—"}</td>
      <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckOut || "—"}</td>
      <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }}>{rec.workingHours.toFixed(2)}h</td>
      <td className="px-4 py-2.5 text-amber-400" style={{ fontSize: 12 }}>{shortage.toFixed(2)}h</td>
      <td className="px-4 py-2.5">
        <PopoverExcuseButton excused={Boolean(rec.excusedShortfall)} onClick={handleExcuse} paddingClassName="px-2.5 py-1" />
      </td>
    </tr>
  );
};

export default memo(ShortfallTableRow);
