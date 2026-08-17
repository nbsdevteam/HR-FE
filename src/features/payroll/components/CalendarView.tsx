import { useMemo } from "react";
import { CalendarDays, ArrowUpRight, XCircle, ShieldCheck, TriangleAlert, TreePalm } from "lucide-react";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import type { ProcessedAttendanceRecord, PayslipSettings } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";

const CalendarView = ({
  records,
  settings,
  monthYear,
  onExcuseAbsence,
  onExcuseShortfall,
}: {
  records: ProcessedAttendanceRecord[];
  settings: PayslipSettings;
  monthYear: string;
  onExcuseAbsence?: (id: string) => void;
  onExcuseShortfall?: (id: string) => void;
}) => {
  const { settings: appSettings } = useAppSettings();
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [y, m] = monthYear.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

  const recordMap: Record<string, ProcessedAttendanceRecord> = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  const cells: Array<{ date: string; day: number; dayOfWeek: number } | null> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay();
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

  // Derive rest days from processed records (each record knows isScheduledWorkingDay)
  const restDowSet = useMemo(() => {
    const dowCounts: Record<number, { working: number; rest: number }> = {};
    for (const rec of records) {
      const d = new Date(rec.date + "T00:00:00Z");
      const dow = d.getUTCDay();
      if (!dowCounts[dow]) dowCounts[dow] = { working: 0, rest: 0 };
      if (rec.isScheduledWorkingDay) dowCounts[dow].working++;
      else dowCounts[dow].rest++;
    }
    const set = new Set<number>();
    for (const [dow, c] of Object.entries(dowCounts)) {
      if (c.rest > c.working) set.add(Number(dow));
    }
    return set;
  }, [records]);
  const isRestDay = (dow: number) => restDowSet.has(dow);
  const isFutureDate = (dateStr: string) => dateStr > new Date().toISOString().slice(0, 10);

  // Compute week row indices for alternating backgrounds
  const weekRows: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weekRows.push(cells.slice(i, i + 7).map((_, j) => i + j));

  return (
    <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-foreground text-lg">{arabicSource("payroll.calendar")} {displayMonth(monthYear)}</h3>
      </div>

      {/* Day headers — bold band */}
      <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
        {dayHeaders.map((d) => (
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
          // Alternating week backgrounds
          const weekIdx = Math.floor(i / 7);
          const weekBg = weekIdx % 2 === 1 ? "bg-muted/[0.03]" : "";

          if (!cell) return <div key={`empty-${i}`} className={`min-h-[68px] border-b border-e border-border/20 ${weekBg}`} />;

          const rec = recordMap[cell.date];
          const today = new Date().toISOString().slice(0, 10) === cell.date;
          const isRest = isRestDay(cell.dayOfWeek);
          const isFuture = isFutureDate(cell.date);
          const isLeave = rec?.status === "leave";
          const isAbsent = rec?.status === "absent" || rec?.status === "absent_due_to_late_threshold";
          const hasShortfall = rec && !isAbsent && !isLeave && rec.workingHours < settings.targetWorkingHoursPerDay && rec.isScheduledWorkingDay;
          const hasOvertime = rec && rec.overtimeHours > 0;
          const hasData = rec && !isAbsent && !isLeave && rec.checkInTime;

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
              key={cell.date}
              className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${today ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !rec ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.boxShadow = ""; }}
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
              {isLeave && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div style={{ fontSize: 10 }} className={rec.isUnpaidLeave ? "text-orange-400" : "text-blue-400"}>{rec.leaveType}</div>
                  {rec.isUnpaidLeave && <div style={{ fontSize: 9 }} className="text-destructive mt-0.5">{arabicSource("common.discounted")}</div>}
                </div>
              )}

              {/* Normal attendance — times + hours hero */}
              {hasData && (
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
                <button
                  onClick={() => onExcuseAbsence(rec.id)}
                  className={`mt-1 px-2 py-0.5 rounded text-center border transition-colors cursor-pointer ${
                    rec?.excusedAbsence
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-border/30 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-400"
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {rec?.excusedAbsence ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                </button>
              )}
              {hasShortfall && onExcuseShortfall && (
                <button
                  onClick={() => onExcuseShortfall(rec.id)}
                  className={`mt-1 px-2 py-0.5 rounded text-center border transition-colors cursor-pointer ${
                    rec?.excusedShortfall
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-border/30 text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
                  }`}
                  style={{ fontSize: 9 }}
                >
                  {rec?.excusedShortfall ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend — prominent bar */}
      <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3.5 border-t border-border/30 bg-muted/10">
        {[
          { label: arabicSource("common.present"), dot: "bg-emerald-500" },
          { label: arabicSource("payroll.shortage_of_hours_2"), dot: "bg-amber-400" },
          { label: arabicSource("common.absence_2"), dot: "bg-destructive" },
          { label: arabicSource("payroll.overtime_2"), dot: "bg-emerald-400" },
          { label: arabicSource("payroll.excuse_me"), dot: "bg-emerald-400" },
          { label: arabicSource("common.leave"), dot: "bg-blue-400" },
          { label: arabicSource("common.without_salary"), dot: "bg-orange-400" },
          { label: arabicSource("common.a_day_of_rest"), dot: "bg-muted-foreground/30" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
