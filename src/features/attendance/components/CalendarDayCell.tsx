import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatTime, formatWorkHours, type DbAttendanceRecord } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { CalendarCell } from "../utils/calendarHelpers";

type CalendarDayCellProps = {
  cell: CalendarCell;
  weekIndex: number;
  record: DbAttendanceRecord | undefined;
  isToday: boolean;
  isRest: boolean;
  isFuture: boolean;
};

const CalendarDayCell = ({ cell, weekIndex, record, isToday, isRest, isFuture }: CalendarDayCellProps) => {
  const weekBg = weekIndex % 2 === 1 ? "bg-muted/[0.03]" : "";
  const hasData = Boolean(record?.check_in_time);

  let cellBg = weekBg;
  let statusIcon: ReactNode = null;

  if (record) {
    const s = record.status;
    if (s === "complete" || s === "auto_checkout") {
      if (record.is_late) {
        cellBg = "bg-gradient-to-b from-amber-500/8 to-amber-500/3";
        statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      } else {
        cellBg = "bg-gradient-to-b from-emerald-500/8 to-emerald-500/3";
        statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      }
    } else if (s === "absent") {
      cellBg = "bg-gradient-to-b from-destructive/8 to-destructive/3";
      statusIcon = <XCircle className="w-3.5 h-3.5 text-destructive" />;
    } else if (s === "checked_in" || s === "missing_checkout") {
      cellBg = "bg-gradient-to-b from-orange-500/8 to-orange-500/3";
      statusIcon = <Clock className="w-3.5 h-3.5 text-orange-400" />;
    } else if (s === "missing_checkin") {
      cellBg = "bg-gradient-to-b from-orange-500/8 to-orange-500/3";
      statusIcon = <Clock className="w-3.5 h-3.5 text-orange-400" />;
    } else if (s === "leave") {
      cellBg = "bg-gradient-to-b from-blue-500/8 to-blue-500/3";
    }
  } else if (isRest) {
    cellBg += " bg-muted/5";
  }

  const cellHeight = hasData ? "min-h-[100px]" : record?.status === "absent" ? "min-h-[80px]" : "min-h-[68px]";

  return (
    <div
      className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${isToday ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !record ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Day number + status icon */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full ${
            isToday ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            : isRest && !record ? "text-muted-foreground/30"
            : "text-foreground/70"
          }`}
          style={{ fontSize: 12, fontWeight: isToday ? 700 : 500 }}
        >
          {cell.day}
        </span>
        {statusIcon}
      </div>

      {/* Attendance data — times + hours hero */}
      {record && record.check_in_time ? (
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="space-y-0.5">
            <div className="text-emerald-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{formatTime(record.check_in_time)}</div>
            <div className={`font-mono ${record.auto_checkout_applied ? "text-amber-500" : "text-blue-500"}`} style={{ fontSize: 11 }} dir="ltr">
              {record.check_out_time ? formatTime(record.check_out_time) : "—"}
            </div>
          </div>
          {/* Hours — hero element */}
          {record.working_hours > 0 && (
            <div className="mt-auto pt-1.5">
              <span className="text-foreground font-mono font-semibold" style={{ fontSize: 12 }}>
                {formatWorkHours(record.working_hours)}
              </span>
              {record.overtime_hours > 0 && (
                <span className="text-emerald-500 font-mono ms-1" style={{ fontSize: 10 }}>+{formatWorkHours(record.overtime_hours)}</span>
              )}
            </div>
          )}
        </div>
      ) : record?.status === "absent" ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-destructive font-medium" style={{ fontSize: 11 }}>{arabicSource("common.absence_2")}</span>
        </div>
      ) : record?.status === "leave" ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-blue-400 font-medium" style={{ fontSize: 11 }}>{arabicSource("common.leave")}</span>
        </div>
      ) : isRest ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-muted-foreground/25" style={{ fontSize: 10 }}>{arabicSource("common.leave")}</span>
        </div>
      ) : isFuture ? (
        <div className="flex-1" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-muted-foreground/15" style={{ fontSize: 14 }}>—</span>
        </div>
      )}
    </div>
  );
};

export default CalendarDayCell;
