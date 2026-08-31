import { useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/components";
import { type DbAttendanceRecord, formatWorkHours } from "@/shared/hooks";
import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import {
  buildCalendarCells,
  buildRecordMap,
  buildRestDowSet,
  CALENDAR_DAY_HEADERS,
  isFutureDate,
} from "../utils/calendarHelpers";
import type { MonthAttendanceStats } from "../utils/attendanceStats";
import CalendarDayCell from "./CalendarDayCell";
import CalendarDayHeaderCell from "./CalendarDayHeaderCell";
import CalendarEmptyCell from "./CalendarEmptyCell";
import CalendarLegendItem from "./CalendarLegendItem";
import CalendarStatChip from "./CalendarStatChip";
import { attendanceLegendData } from "../data";

type AttendanceCalendarViewProps = {
  records: DbAttendanceRecord[];
  calMonth: string;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  stats: MonthAttendanceStats;
  schedule: EmployeeSchedule | null;
};

const AttendanceCalendarView = ({
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

  const calendarStats = useMemo(
    () => [
      {
        label: arabicSource("common.working_days"),
        value: stats.daysWorked,
        icon: CalendarDays,
        color: "text-emerald-400",
      },
      {
        label: arabicSource("common.total_hours"),
        value: formatWorkHours(stats.totalHours),
        icon: Clock,
        color: "text-blue-400",
      },
      {
        label: arabicSource("common.average_day"),
        value: formatWorkHours(stats.avgHours),
        icon: Timer,
        color: "text-amber-400",
      },
      {
        label: arabicSource("common.additional_label"),
        value: formatWorkHours(stats.overtime),
        icon: TrendingUp,
        color: "text-emerald-400",
      },
      {
        label: arabicSource("common.absence"),
        value: stats.absentCount,
        icon: XCircle,
        color: "text-destructive",
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-5">
      {/* Month stats — compact row */}
      <div className="grid grid-cols-5 gap-3">
        {calendarStats.map((chip, index) => (
          <CalendarStatChip
            key={chip.label}
            label={chip.label}
            value={chip.value}
            icon={chip.icon}
            color={chip.color}
            index={index}
          />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
        {/* Month navigator */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            onClick={onPrev}
          >
            {arabicSource("attendance.previous")}
          </Button>
          <h3 className="text-foreground flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            {monthLabel}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            iconPosition="trailing"
            onClick={onNext}
          >
            {arabicSource("attendance.next")}
          </Button>
        </div>

        {/* Day headers — bold band */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
          {CALENDAR_DAY_HEADERS.map((d) => (
            <CalendarDayHeaderCell
              key={d.label}
              label={d.label}
              isRestDow={restDowSet.has(d.dow)}
            />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const weekIndex = Math.floor(i / 7);

            if (!cell)
              return <CalendarEmptyCell key={`e-${i}`} weekIndex={weekIndex} />;

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
          {attendanceLegendData.map((l) => (
            <CalendarLegendItem key={l.label} label={l.label} dot={l.dot} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendarView;
