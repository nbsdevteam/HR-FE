import { defaultMonthRangeBaghdad } from "@/shared/utils/reports/attendanceMonthly";

/**
 * First/last day (YYYY-MM-DD) of the current calendar month in Baghdad — the
 * sane default for report date filters. Built from the Baghdad calendar
 * date, not from local midnights run through `toISOString()`: that converts
 * to UTC, which in a UTC+3 browser is always the previous day.
 */
export const getCurrentMonthRange = (now: Date = new Date()): { from: string; to: string } => {
  const { date_from, date_to } = defaultMonthRangeBaghdad(now);
  return { from: date_from, to: date_to };
};
