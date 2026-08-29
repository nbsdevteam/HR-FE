import { memo, useCallback } from "react";
import { ArrowUpRight, ShieldCheck, TreePalm, TriangleAlert, XCircle } from "lucide-react";
import type { ProcessedAttendanceRecord, PayslipSettings } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import CalendarExcuseButton from "./CalendarExcuseButton";

type CalendarDayCellProps = {
  cell: { date: string; day: number; dayOfWeek: number };
  rec: ProcessedAttendanceRecord | undefined;
  today: boolean;
  isRest: boolean;
  isFuture: boolean;
  weekBg: string;
  settings: PayslipSettings;
  onExcuseAbsence?: (id: string) => void;
  onExcuseShortfall?: (id: string) => void;
};

const CalendarDayCell = ({ cell, rec, today, isRest, isFuture, weekBg, settings, onExcuseAbsence, onExcuseShortfall }: CalendarDayCellProps) => {
  const isLeave = rec?.status === "leave";
  const isAbsent = rec?.status === "absent" || rec?.status === "absent_due_to_late_threshold";
  const hasShortfall = Boolean(rec && !isAbsent && !isLeave && rec.workingHours < settings.targetWorkingHoursPerDay && rec.isScheduledWorkingDay);
  const hasOvertime = Boolean(rec && rec.overtimeHours > 0);
  const hasData = Boolean(rec && !isAbsent && !isLeave && rec.checkInTime);

  const handleExcuseAbsence = useCallback(() => {
    if (rec && onExcuseAbsence) onExcuseAbsence(rec.id);
  }, [rec, onExcuseAbsence]);

  const handleExcuseShortfall = useCallback(() => {
    if (rec && onExcuseShortfall) onExcuseShortfall(rec.id);
  }, [rec, onExcuseShortfall]);

  const handleCellMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)";
    e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)";
  };

  const handleCellMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.backgroundColor = "";
    e.currentTarget.style.boxShadow = "";
  };

  // Cell background
  let cellBg = weekBg;
  if (isLeave && !rec?.isUnpaidLeave) cellBg = "bg-blue-500/6";
  else if (isLeave && rec?.isUnpaidLeave) cellBg = "bg-orange-500/6";
  else if (isAbsent && !rec?.excusedAbsence) cellBg = "bg-destructive/6";
  else if (isAbsent && rec?.excusedAbsence) cellBg = "bg-emerald-500/6";
  else if (hasShortfall && !rec?.excusedShortfall) cellBg = "bg-amber-500/6";
  else if (hasShortfall && rec?.excusedShortfall) cellBg = "bg-emerald-500/6";
  else if (hasOvertime) cellBg = "bg-emerald-500/4";
  else if (isRest && !rec) cellBg += " bg-muted/5";

  // Dynamic height: data cells are taller, empty/rest cells shorter
  const cellHeight = hasData || isLeave ? "min-h-[100px]" : isAbsent ? "min-h-[80px]" : "min-h-[68px]";

  return (
    <div
      className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${today ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !rec ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
      onMouseEnter={handleCellMouseEnter}
      onMouseLeave={handleCellMouseLeave}
    >
      {/* Row 1: Day number + status icon */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full ${
            today ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            : isRest && !rec ? "text-muted-foreground/30"
            : "text-foreground/70"
          }`}
          style={{ fontSize: 12, fontWeight: today ? 700 : 500 }}
        >
          {cell.day}
        </span>
        {isLeave && <TreePalm className="w-3.5 h-3.5 text-blue-400" />}
        {isAbsent && !rec?.excusedAbsence && <XCircle className="w-3.5 h-3.5 text-destructive" />}
        {isAbsent && rec?.excusedAbsence && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
        {hasShortfall && !rec?.excusedShortfall && <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />}
        {hasShortfall && rec?.excusedShortfall && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
        {hasOvertime && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
      </div>

      {/* Leave */}
      {isLeave && rec && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div style={{ fontSize: 10 }} className={rec.isUnpaidLeave ? "text-orange-400" : "text-blue-400"}>{rec.leaveType}</div>
          {rec.isUnpaidLeave && <div style={{ fontSize: 9 }} className="text-destructive mt-0.5">{arabicSource("common.discounted")}</div>}
        </div>
      )}

      {/* Normal attendance — times + hours hero */}
      {hasData && rec && (
        <div className="flex-1 flex flex-col items-center text-center">
          {/* Times — stacked, no dots */}
          <div className="space-y-0.5">
            <div className="text-emerald-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{rec.formattedCheckIn}</div>
            <div className="text-blue-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{rec.formattedCheckOut || "—"}</div>
          </div>
          {/* Hours — hero element at bottom */}
          <div className="mt-auto pt-1.5">
            <span className="text-foreground font-mono font-semibold" style={{ fontSize: 12 }}>
              {rec.workingHours.toFixed(1)}h
            </span>
            {hasOvertime && (
              <span className="text-emerald-500 font-mono ms-1" style={{ fontSize: 10 }}>+{rec.overtimeHours.toFixed(1)}h</span>
            )}
            {hasShortfall && (
              <span className="text-amber-500 font-mono ms-1" style={{ fontSize: 10 }}>
                -{(settings.targetWorkingHoursPerDay - rec.workingHours).toFixed(1)}h
              </span>
            )}
          </div>
        </div>
      )}

      {/* Absent */}
      {isAbsent && (
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
          <span className="text-destructive font-medium" style={{ fontSize: 11 }}>{arabicSource("common.absence_2")}</span>
          {rec?.excusedAbsence && <span className="text-emerald-400" style={{ fontSize: 9 }}>{arabicSource("payroll.sorry")}</span>}
        </div>
      )}

      {/* Rest day */}
      {!rec && isRest && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-muted-foreground/25" style={{ fontSize: 10 }}>{arabicSource("common.leave")}</span>
        </div>
      )}

      {/* Past work day with no record */}
      {!rec && !isRest && !isFuture && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-muted-foreground/15" style={{ fontSize: 14 }}>—</span>
        </div>
      )}

      {/* Excuse buttons */}
      {isAbsent && !isLeave && onExcuseAbsence && (
        <CalendarExcuseButton
          excused={Boolean(rec?.excusedAbsence)}
          onClick={handleExcuseAbsence}
          hoverClassName="hover:border-emerald-500/40 hover:text-emerald-400"
        />
      )}
      {hasShortfall && onExcuseShortfall && (
        <CalendarExcuseButton
          excused={Boolean(rec?.excusedShortfall)}
          onClick={handleExcuseShortfall}
          hoverClassName="hover:border-amber-500/40 hover:text-amber-400"
        />
      )}
    </div>
  );
};

export default memo(CalendarDayCell);
