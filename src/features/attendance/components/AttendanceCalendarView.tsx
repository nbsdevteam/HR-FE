import { motion } from "motion/react";
import { AlertTriangle, CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock, Timer, TrendingUp, XCircle } from "lucide-react";
import { formatTime, formatWorkHours, type DbAttendanceRecord } from "@/shared/hooks";
import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { CalendarLegendItem } from "./CalendarLegendItem";
import { CalendarStatChip } from "./CalendarStatChip";

export function AttendanceCalendarView({
  records,
  calMonth,
  monthLabel,
  onPrev,
  onNext,
  stats,
  schedule,
}: {
  records: DbAttendanceRecord[];
  calMonth: string;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  stats: { daysWorked: number; totalHours: number; avgHours: number; overtime: number; lateCount: number; absentCount: number; checkedInOnly: number };
  schedule: EmployeeSchedule | null;
}) {
  const [y, m] = calMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

  const recordMap: Record<string, DbAttendanceRecord> = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const cells: Array<{ date: string; day: number; dayOfWeek: number } | null> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0=Sun, 5=Fri, 6=Sat
    cells.push({ date: dateStr, day: d, dayOfWeek: dow });
  }

  const dayHeaders = [
    { label: arabicSource("common.sunday_2"), dow: 0 },
    { label: arabicSource("common.monday"), dow: 1 },
    { label: arabicSource("common.tuesday"), dow: 2 },
    { label: arabicSource("common.wednesday"), dow: 3 },
    { label: arabicSource("common.thursday"), dow: 4 },
    { label: arabicSource("common.friday"), dow: 5 },
    { label: arabicSource("common.saturday"), dow: 6 },
  ];

  // Rest days come from the employee's shift schedule — nothing hardcoded
  const dowToDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const isRestDay = (dow: number) => {
    if (!schedule) return false; // no shift assigned → treat all days as work days
    const dayKey = dowToDay[dow];
    return !(schedule[dayKey]?.isWorkingDay ?? true);
  };
  // Which day-of-week indices are rest days (for header styling)
  const restDowSet = new Set(dowToDay.map((_, i) => i).filter(i => isRestDay(i)));
  const isFutureDate = (dateStr: string) => dateStr > new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Month stats — compact row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: arabicSource("common.working_days"), value: stats.daysWorked, icon: CalendarDays, color: "text-emerald-400", bg: "from-emerald-500/10" },
          { label: arabicSource("common.total_hours"), value: formatWorkHours(stats.totalHours), icon: Clock, color: "text-blue-400", bg: "from-blue-500/10" },
          { label: arabicSource("common.average_day"), value: formatWorkHours(stats.avgHours), icon: Timer, color: "text-amber-400", bg: "from-amber-500/10" },
          { label: arabicSource("common.additional_label"), value: formatWorkHours(stats.overtime), icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-500/10" },
          { label: arabicSource("common.absence"), value: stats.absentCount, icon: XCircle, color: "text-destructive", bg: "from-destructive/10" },
        ].map((chip, i) => {
          return <CalendarStatChip key={chip.label} label={chip.label} value={chip.value} icon={chip.icon} color={chip.color} index={i} />;
        })}
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
        {/* Month navigator */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <button onClick={onPrev} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
            <span style={{ fontSize: 12 }}>{arabicSource("attendance.previous")}</span>
          </button>
          <h3 className="text-foreground flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            {monthLabel}
          </h3>
          <button onClick={onNext} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <span style={{ fontSize: 12 }}>{arabicSource("attendance.next")}</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers — bold band */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
          {dayHeaders.map(d => (
            <div
              key={d.label}
              className={`text-center py-3 font-semibold ${restDowSet.has(d.dow) ? "text-muted-foreground/50 bg-muted/10" : "text-foreground/60"}`}
              style={{ fontSize: 13 }}
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const weekIdx = Math.floor(i / 7);
            const weekBg = weekIdx % 2 === 1 ? "bg-muted/[0.03]" : "";

            if (!cell) return <div key={`e-${i}`} className={`min-h-[68px] border-b border-e border-border/20 ${weekBg}`} />;

            const rec = recordMap[cell.date];
            const today = new Date().toISOString().slice(0, 10) === cell.date;
            const isRest = isRestDay(cell.dayOfWeek);
            const isFuture = isFutureDate(cell.date);
            const hasData = rec && rec.check_in_time;

            // Determine cell styling
            let cellBg = weekBg;
            let statusIcon: React.ReactNode = null;

            if (rec) {
              const s = rec.status;
              if (s === "complete" || s === "auto_checkout") {
                if (rec.is_late) {
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

            // Dynamic height
            const cellHeight = hasData ? "min-h-[100px]" : rec?.status === "absent" ? "min-h-[80px]" : "min-h-[68px]";

            return (
              <div
                key={cell.date}
                className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${today ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !rec ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Day number + status icon */}
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
                  {statusIcon}
                </div>

                {/* Attendance data — times + hours hero */}
                {hasData ? (
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="space-y-0.5">
                      <div className="text-emerald-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{formatTime(rec.check_in_time)}</div>
                      <div className={`font-mono ${rec.auto_checkout_applied ? "text-amber-500" : "text-blue-500"}`} style={{ fontSize: 11 }} dir="ltr">
                        {rec.check_out_time ? formatTime(rec.check_out_time) : "—"}
                      </div>
                    </div>
                    {/* Hours — hero element */}
                    {rec.working_hours > 0 && (
                      <div className="mt-auto pt-1.5">
                        <span className="text-foreground font-mono font-semibold" style={{ fontSize: 12 }}>
                          {formatWorkHours(rec.working_hours)}
                        </span>
                        {rec.overtime_hours > 0 && (
                          <span className="text-emerald-500 font-mono ms-1" style={{ fontSize: 10 }}>+{formatWorkHours(rec.overtime_hours)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : rec?.status === "absent" ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-destructive font-medium" style={{ fontSize: 11 }}>{arabicSource("common.absence_2")}</span>
                  </div>
                ) : rec?.status === "leave" ? (
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
          })}
        </div>

        {/* Legend — prominent bar */}
        <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3.5 border-t border-border/30 bg-muted/10">
          {[
            { label: arabicSource("common.present"), dot: "bg-emerald-500" },
            { label: arabicSource("common.late"), dot: "bg-amber-400" },
            { label: arabicSource("attendance.login_only"), dot: "bg-orange-400" },
            { label: arabicSource("common.absence_2"), dot: "bg-destructive" },
            { label: arabicSource("common.leave"), dot: "bg-blue-400" },
            { label: arabicSource("common.a_day_of_rest"), dot: "bg-muted-foreground/30" },
          ].map(l => (
            <CalendarLegendItem key={l.label} label={l.label} dot={l.dot} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════ Monthly Summary ══════════════════════════
