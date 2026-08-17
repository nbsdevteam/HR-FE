import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Timer, TrendingUp, XCircle } from "lucide-react";
import { type DbAttendanceRecord, formatWorkHours } from "@/shared/hooks";
import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import {
  buildCalendarCells, buildRecordMap, buildRestDowSet, CALENDAR_DAY_HEADERS, isFutureDate,
} from "../utils/calendarHelpers";
import { CalendarDayCell } from "./CalendarDayCell";
import { CalendarDayHeaderCell } from "./CalendarDayHeaderCell";
import { CalendarEmptyCell } from "./CalendarEmptyCell";
import { CalendarLegendItem } from "./CalendarLegendItem";
import { CalendarStatChip } from "./CalendarStatChip";

type AttendanceCalendarViewProps = {
  records: DbAttendanceRecord[];
  calMonth: string;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  stats: { daysWorked: number; totalHours: number; avgHours: number; overtime: number; lateCount: number; absentCount: number; checkedInOnly: number };
  schedule: EmployeeSchedule | null;
};

export const AttendanceCalendarView = ({
  records,
  calMonth,
  monthLabel,
  onPrev,
  onNext,
  stats,
  schedule,
}: AttendanceCalendarViewProps) => {
  const cells = useMemo(() => buildCalendarCells(calMonth), [calMonth]);
  const recordMap = useMemo(() => buildRecordMap(records), [records]);
  const restDowSet = useMemo(() => buildRestDowSet(schedule), [schedule]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

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
          {CALENDAR_DAY_HEADERS.map(d => (
            <CalendarDayHeaderCell key={d.label} label={d.label} isRestDow={restDowSet.has(d.dow)} />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const weekIndex = Math.floor(i / 7);

            if (!cell) return <CalendarEmptyCell key={`e-${i}`} weekIndex={weekIndex} />;

            return (
              <CalendarDayCell
                key={cell.date}
                cell={cell}
                weekIndex={weekIndex}
                record={recordMap[cell.date]}
                isToday={cell.date === today}
                isRest={restDowSet.has(cell.dayOfWeek)}
                isFuture={isFutureDate(cell.date)}
              />
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
};

