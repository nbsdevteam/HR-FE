import { formatTime, formatWorkHours, mapAttendanceStatus, type DbAttendanceRecord } from "@/shared/hooks";
import { statusColors } from "@/features/attendance/styles";
import { attendanceDayNamesShort } from "../data";

type DailyAttendanceTableRowProps = {
  record: DbAttendanceRecord;
};

const DailyAttendanceTableRow = ({ record }: DailyAttendanceTableRowProps) => {
  const statusLabel = mapAttendanceStatus(record.status, record.is_late);
  const sColor = statusColors[statusLabel] || "";

  return (
    <tr className="border-b border-border/10 hover:bg-muted/5">
      <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>{record.date.slice(5)}</td>
      <td className="px-3 py-2 text-center text-muted-foreground" style={{ fontSize: 11 }}>{attendanceDayNamesShort[record.day_of_week?.toLowerCase()] || "—"}</td>
      <td className="px-3 py-2 text-center">
        <span className="text-emerald-400 font-mono" style={{ fontSize: 12 }} dir="ltr">{record.check_in_time ? formatTime(record.check_in_time) : "—"}</span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`font-mono ${record.auto_checkout_applied ? "text-amber-400" : "text-blue-400"}`} style={{ fontSize: 12 }} dir="ltr">
          {record.check_out_time ? formatTime(record.check_out_time) : "N/A"}
        </span>
      </td>
      <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>
        {record.working_hours > 0 ? formatWorkHours(record.working_hours) : "0h"}
      </td>
      <td className="px-3 py-2 text-center">
        {record.overtime_hours > 0 ? (
          <span className="text-emerald-400 font-mono" style={{ fontSize: 11 }}>{formatWorkHours(record.overtime_hours)}</span>
        ) : (
          <span className="text-muted-foreground/30" style={{ fontSize: 11 }}>—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`px-2 py-0.5 rounded-md border ${sColor}`} style={{ fontSize: 10 }}>{statusLabel}</span>
      </td>
    </tr>
  );
};

export default DailyAttendanceTableRow;
