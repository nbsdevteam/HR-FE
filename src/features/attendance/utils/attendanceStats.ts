import type { DbAttendanceRecord } from "@/shared/hooks";
import type { MonthlyBreakdownEntry } from "../types";

/** Raw statuses that mean the employee showed up in some form. */
export const PRESENT_STATUSES = [
  "complete",
  "auto_checkout",
  "checked_in",
  "missing_checkout",
  "missing_checkin",
];

const isComplete = (record: DbAttendanceRecord): boolean =>
  record.status === "complete" || record.status === "auto_checkout";

export type MonthAttendanceStats = {
  daysWorked: number;
  totalHours: number;
  avgHours: number;
  overtime: number;
  lateCount: number;
  lateMins: number;
  absentCount: number;
  checkedInOnly: number;
  totalRecords: number;
};

export type OverallAttendanceStats = {
  daysWorked: number;
  totalHours: number;
  avgHours: number;
  overtime: number;
  lateCount: number;
  lateMins: number;
  absentCount: number;
  totalRecords: number;
  monthsCount: number;
  firstDate: string;
  lastDate: string;
  presentDays: number;
  attendanceRate: number;
};

/** Single pass over one month's records. */
export const buildMonthAttendanceStats = (
  records: DbAttendanceRecord[],
): MonthAttendanceStats => {
  let completeCount = 0;
  let totalHours = 0;
  let overtime = 0;
  let lateCount = 0;
  let lateMins = 0;
  let absentCount = 0;
  let checkedInOnly = 0;

  for (const record of records) {
    if (isComplete(record)) completeCount++;
    totalHours += record.working_hours || 0;
    overtime += record.overtime_hours || 0;
    if (record.is_late) lateCount++;
    lateMins += record.late_minutes || 0;
    if (record.status === "absent") absentCount++;
    if (record.status === "checked_in" || record.status === "missing_checkout") {
      checkedInOnly++;
    }
  }

  return {
    daysWorked: completeCount + checkedInOnly,
    totalHours,
    avgHours: completeCount > 0 ? totalHours / completeCount : 0,
    overtime,
    lateCount,
    lateMins,
    absentCount,
    checkedInOnly,
    totalRecords: records.length,
  };
};

/** Single pass over the employee's whole history. */
export const buildOverallAttendanceStats = (
  records: DbAttendanceRecord[],
): OverallAttendanceStats => {
  let completeCount = 0;
  let totalHours = 0;
  let overtime = 0;
  let lateCount = 0;
  let lateMins = 0;
  let absentCount = 0;
  let presentCount = 0;
  const months = new Set<string>();

  for (const record of records) {
    if (isComplete(record)) completeCount++;
    totalHours += record.working_hours || 0;
    overtime += record.overtime_hours || 0;
    if (record.is_late) lateCount++;
    lateMins += record.late_minutes || 0;
    if (record.status === "absent") absentCount++;
    if (PRESENT_STATUSES.includes(record.status)) presentCount++;
    months.add(record.date.slice(0, 7));
  }

  return {
    daysWorked: completeCount,
    totalHours,
    avgHours: completeCount > 0 ? totalHours / completeCount : 0,
    overtime,
    lateCount,
    lateMins,
    absentCount,
    totalRecords: records.length,
    monthsCount: months.size,
    firstDate: records.length > 0 ? records[0].date : "—",
    lastDate: records.length > 0 ? records[records.length - 1].date : "—",
    presentDays: presentCount,
    attendanceRate:
      records.length > 0
        ? Math.round((presentCount / records.length) * 100)
        : 0,
  };
};

/** Newest month first. */
export const buildMonthlyBreakdown = (
  records: DbAttendanceRecord[],
): MonthlyBreakdownEntry[] => {
  const byMonth = new Map<string, MonthlyBreakdownEntry>();

  for (const record of records) {
    const month = record.date.slice(0, 7);
    let entry = byMonth.get(month);
    if (!entry) {
      entry = { month, days: 0, hours: 0, overtime: 0, late: 0, absent: 0 };
      byMonth.set(month, entry);
    }
    if (PRESENT_STATUSES.includes(record.status)) entry.days++;
    entry.hours += record.working_hours || 0;
    entry.overtime += record.overtime_hours || 0;
    if (record.is_late) entry.late++;
    if (record.status === "absent") entry.absent++;
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
};
