import type { EmployeeSchedule } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import type { DbAttendanceRecord } from "@/shared/hooks";

export type CalendarCell = { date: string; day: number; dayOfWeek: number };

const DOW_TO_DAY_KEY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const CALENDAR_DAY_HEADERS = [
  { label: arabicSource("common.sunday_2"), dow: 0 },
  { label: arabicSource("common.monday"), dow: 1 },
  { label: arabicSource("common.tuesday"), dow: 2 },
  { label: arabicSource("common.wednesday"), dow: 3 },
  { label: arabicSource("common.thursday"), dow: 4 },
  { label: arabicSource("common.friday"), dow: 5 },
  { label: arabicSource("common.saturday"), dow: 6 },
];

export const buildCalendarCells = (calMonth: string): (CalendarCell | null)[] => {
  const [y, m] = calMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0=Sun, 5=Fri, 6=Sat
    cells.push({ date: dateStr, day: d, dayOfWeek: dow });
  }
  return cells;
};

export const buildRecordMap = (records: DbAttendanceRecord[]): Record<string, DbAttendanceRecord> => {
  const map: Record<string, DbAttendanceRecord> = {};
  records.forEach((r) => { map[r.date] = r; });
  return map;
};

// Rest days come from the employee's shift schedule — nothing hardcoded
export const isRestDay = (schedule: EmployeeSchedule | null, dow: number): boolean => {
  if (!schedule) return false; // no shift assigned → treat all days as work days
  const dayKey = DOW_TO_DAY_KEY[dow];
  return !(schedule[dayKey]?.isWorkingDay ?? true);
};

// Which day-of-week indices are rest days (for header styling)
export const buildRestDowSet = (schedule: EmployeeSchedule | null): Set<number> => (
  new Set(DOW_TO_DAY_KEY.map((_, i) => i).filter((i) => isRestDay(schedule, i)))
);

export const isFutureDate = (dateStr: string): boolean => dateStr > new Date().toISOString().slice(0, 10);
