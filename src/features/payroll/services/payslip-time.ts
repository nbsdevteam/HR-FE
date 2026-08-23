import { arabicSource } from "@/i18n/source";

/**
 * Date/time primitives shared by the attendance-processing and salary stages.
 * These were file-private helpers inside the former monolithic engine.
 */

export const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const dayNamesAr: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"),
  monday: arabicSource("common.monday"),
  tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"),
  thursday: arabicSource("common.thursday"),
  friday: arabicSource("common.friday"),
  saturday: arabicSource("common.saturday"),
};

/** "HH:MM[:SS]" → minutes since midnight. */
export const timeToMinutes = (t: string): number => {
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
};

/** Minutes → hours, rounded to 2dp. */
export const minutesToHours = (m: number): number => Math.round((m / 60) * 100) / 100;

/** "HH:MM[:SS]" → localized 12-hour display string. */
export const formatTimeStr = (t: string): string => {
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const suffix = h < 12 ? arabicSource("common.p") : arabicSource("common.m");
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
};

/** "YYYY-MM-DD" → lowercase English weekday key (UTC-anchored). */
export const getDayOfWeek = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00Z");
  return DAYS_OF_WEEK[d.getUTCDay()];
};

/** Get all dates in a month as YYYY-MM-DD */
export const getMonthDates = (monthYear: string): string[] => {
  const [y, m] = monthYear.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return dates;
};
