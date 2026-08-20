import { memo, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import type {
  ProcessedAttendanceRecord,
  PayslipSettings,
} from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import CalendarDayCell from "./CalendarDayCell";
import CalendarDayHeaderCell from "./CalendarDayHeaderCell";
import CalendarLegendItem from "./CalendarLegendItem";
import { DAY_HEADERS, LEGEND_ITEMS } from "../data";

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
  const displayMonth = (m: string) =>
    formatMonthYear(m, appSettings.monthFormat);

  const recordMap = useMemo(() => {
    const map: Record<string, ProcessedAttendanceRecord> = {};
    records.forEach((r) => {
      map[r.date] = r;
    });
    return map;
  }, [records]);

  const cells = useMemo(() => {
    const [y, m] = monthYear.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

    const result: Array<{
      date: string;
      day: number;
      dayOfWeek: number;
    } | null> = [];
    for (let i = 0; i < firstDayIdx; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(y, m - 1, d).getDay();
      result.push({ date: dateStr, day: d, dayOfWeek: dow });
    }
    return result;
  }, [monthYear]);

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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-foreground text-lg">
          {arabicSource("payroll.calendar")} {displayMonth(monthYear)}
        </h3>
      </div>

      {/* Day headers — bold band */}
      <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
        {DAY_HEADERS.map((d) => (
          <CalendarDayHeaderCell
            key={d.label}
            label={d.label}
            isRestDay={restDowSet.has(d.dow)}
          />
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          // Alternating week backgrounds
          const weekIdx = Math.floor(i / 7);
          const weekBg = weekIdx % 2 === 1 ? "bg-muted/[0.03]" : "";

          if (!cell)
            return (
              <div
                key={`empty-${i}`}
                className={`min-h-[68px] border-b border-e border-border/20 ${weekBg}`}
              />
            );

          const rec = recordMap[cell.date];
          const isRest = restDowSet.has(cell.dayOfWeek);
          const isFuture = cell.date > today;

          return (
            <CalendarDayCell
              key={cell.date}
              cell={cell}
              rec={rec}
              today={cell.date === today}
              isRest={isRest}
              isFuture={isFuture}
              weekBg={weekBg}
              settings={settings}
              onExcuseAbsence={onExcuseAbsence}
              onExcuseShortfall={onExcuseShortfall}
            />
          );
        })}
      </div>

      {/* Legend — prominent bar */}
      <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3.5 border-t border-border/30 bg-muted/10">
        {LEGEND_ITEMS.map((l) => (
          <CalendarLegendItem
            key={l.label}
            label={l.label}
            dotClassName={l.dot}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(CalendarView);
