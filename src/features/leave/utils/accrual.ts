import type { DbLeaveAccrualEntry } from "@/shared/hooks";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

type DateParts = { year: number; month: number; day: number };

const parseIsoDate = (iso: string | null | undefined): DateParts | null => {
  const match = ISO_DATE.exec(String(iso || ""));
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const toIsoDate = ({ year, month, day }: DateParts): string =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** `YYYY-MM-DD` + N days, in UTC so a local timezone can't shift the day. */
export const addDaysToIsoDate = (iso: string | null | undefined, days: number): string => {
  const parts = parseIsoDate(iso);
  if (!parts) return "";
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return toIsoDate({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
};

/**
 * `YYYY-MM-DD` + N months, clamped to the end of a shorter target month
 * (31 Jan + 1 month → 28 Feb), matching how the backend anchors accrual periods
 * on the joining date. Plain `Date#setMonth` would overflow into 3 March.
 */
export const addMonthsToIsoDate = (iso: string | null | undefined, months: number): string => {
  const parts = parseIsoDate(iso);
  if (!parts) return "";
  const monthIndex = parts.month - 1 + months;
  const year = parts.year + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12 + 1;
  return toIsoDate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
};

/**
 * Leave balances are quarters (1.75, 3.50, 5.25) — never round them to whole
 * days, and always show at least one decimal (backend §8).
 *
 * Deliberately not `Intl.NumberFormat`: the app's Arabic locale renders
 * Arabic-Indic digits, and every other figure on the leave screens (durations,
 * hours, dates) is Latin — a mixed-numeral card reads as a bug.
 */
export const formatLeaveDays = (value: number): string =>
  value.toFixed(2).replace(/(\.\d)0$/, "$1");

/** Progress is "how much of the year's entitlement has been earned" (backend §8). */
export const accrualProgressPercent = (accrued: number, annualEntitlement: number): number => {
  if (!(annualEntitlement > 0)) return 0;
  return Math.min(100, Math.max(0, (accrued / annualEntitlement) * 100));
};

/** The first day a probation-gated leave request may start. */
export const earliestLeaveStartDate = (probationEndDate: string | null): string =>
  probationEndDate ? addDaysToIsoDate(probationEndDate, 1) : "";

/** Nothing is granted on the joining date itself — the first month has to complete. */
export const firstAccrualDate = (joiningDate: string | null): string =>
  joiningDate ? addMonthsToIsoDate(joiningDate, 1) : "";

export type AccrualHistoryRow = DbLeaveAccrualEntry & { running_total: number };

/**
 * Rows arrive newest-first; the running total accumulates from the oldest, so
 * the newest row's total equals the response's `total_days`.
 */
export const withRunningTotals = (items: DbLeaveAccrualEntry[]): AccrualHistoryRow[] => {
  const rows = new Array<AccrualHistoryRow>(items.length);
  let total = 0;
  for (let index = items.length - 1; index >= 0; index--) {
    total += items[index].days;
    rows[index] = { ...items[index], running_total: total };
  }
  return rows;
};
