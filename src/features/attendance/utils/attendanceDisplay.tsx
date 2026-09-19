import { CreditCard, Fingerprint, ScanFace, Smartphone } from "lucide-react";
import { getIntlLocale, normalizeLanguage, type AppLanguage } from "@/i18n";
import { arabicSource } from "@/i18n/source";
import { mapAttendanceStatus, type DbAttendanceRecord } from "@/shared/hooks";
import {
  dayNames,
  type AttendanceRow,
  type AttendanceStatusCountKey,
  type TodayAttendanceStats,
  type WeeklyAttendanceRow,
} from "../types";

/** Sunday → Saturday, the full calendar week the chart reports on. */
const WEEK_DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const attendanceStatusKeyByLabel: Record<string, AttendanceStatusCountKey> = {
  [arabicSource("common.present")]: "present",
  [arabicSource("common.late")]: "late",
  [arabicSource("common.absent")]: "absent",
  [arabicSource("common.leave")]: "leave",
};

const createEmptyAttendanceCounts = (): Record<AttendanceStatusCountKey, number> => ({
  present: 0,
  late: 0,
  absent: 0,
  leave: 0,
});

const formatAverageHours = (hours: number, language?: AppLanguage | string): string => {
  if (hours === 0) return "0";

  return new Intl.NumberFormat(getIntlLocale(normalizeLanguage(language)), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(hours);
};

/**
 * Who should have been at work on the day. Someone who did not punch has no
 * attendance row at all, so absence can only be derived from the roster.
 */
export type AttendanceRoster = {
  activeEmployeeIds: readonly string[];
  /** Employees with an approved leave request covering the day. */
  onLeaveEmployeeIds: ReadonlySet<string>;
};

export const buildTodayAttendanceStats = (
  records: DbAttendanceRecord[],
  selectedDate: string,
  language?: AppLanguage | string,
  roster?: AttendanceRoster,
): TodayAttendanceStats => {
  const counts = createEmptyAttendanceCounts();
  const rowEmployeeIds = new Set<string>();
  const rowLeaveIds = new Set<string>();
  const rowAbsentIds = new Set<string>();
  let total = 0;
  let totalWorkingHours = 0;
  let validHoursCount = 0;
  let autoCheckouts = 0;

  records.forEach((record) => {
    if (record.date !== selectedDate) return;

    total++;
    rowEmployeeIds.add(record.employee_id);

    const status = mapAttendanceStatus(record.status, record.is_late, record.excused_late);
    const countKey = attendanceStatusKeyByLabel[status];
    if (countKey) counts[countKey]++;
    if (countKey === "leave") rowLeaveIds.add(record.employee_id);
    if (countKey === "absent") rowAbsentIds.add(record.employee_id);

    // Average only rows that have a check-out: `working_hours` is 0 until then.
    if (record.check_out_time && record.working_hours > 0) {
      totalWorkingHours += record.working_hours;
      validHoursCount++;
    }

    if (record.auto_checkout_applied) {
      autoCheckouts++;
    }
  });

  if (roster) {
    const active = new Set(roster.activeEmployeeIds);
    const leaveIds = new Set(rowLeaveIds);
    roster.onLeaveEmployeeIds.forEach((id) => {
      if (active.has(id)) leaveIds.add(id);
    });
    const absentIds = new Set(rowAbsentIds);
    active.forEach((id) => {
      if (!rowEmployeeIds.has(id)) absentIds.add(id);
    });
    leaveIds.forEach((id) => absentIds.delete(id));
    counts.leave = leaveIds.size;
    counts.absent = absentIds.size;
  }

  const averageHours = validHoursCount === 0 ? 0 : totalWorkingHours / validHoursCount;

  return {
    ...counts,
    total,
    avgHours: formatAverageHours(averageHours, language),
    autoCheckouts,
  };
};

/**
 * Midday UTC keeps date math free of DST/timezone drift when only the
 * calendar date matters. Derives the weekday from `date` rather than
 * trusting a record's separately-stored `day_of_week` field, which can be
 * empty or wrong on some records — see `DailyAttendanceTableRow`, the other
 * caller of this.
 */
export const weekdayKeyFromDate = (dateStr: string): string | undefined =>
  WEEK_DAY_KEYS[new Date(`${dateStr}T12:00:00Z`).getUTCDay()];

/** Per-weekday status tallies for the weekly bar chart, Sunday through Saturday. */
export const buildWeeklyAttendance = (
  records: DbAttendanceRecord[],
): WeeklyAttendanceRow[] => {
  const byDay = new Map<string, Record<AttendanceStatusCountKey, number>>();
  WEEK_DAY_KEYS.forEach((day) => {
    byDay.set(day, createEmptyAttendanceCounts());
  });

  records.forEach((record) => {
    if (!record.date) return;
    // Derived from `date` (always present — it's what the range query
    // filtered on) rather than the backend's `day_of_week` field, which can
    // be empty/missing on some records and would otherwise silently drop
    // them from the chart while they still show up in the plain date-keyed
    // table.
    const counts = byDay.get(weekdayKeyFromDate(record.date)!);
    if (!counts) return;

    const countKey =
      attendanceStatusKeyByLabel[
        mapAttendanceStatus(record.status, record.is_late, record.excused_late)
      ];
    if (countKey) counts[countKey]++;
  });

  return WEEK_DAY_KEYS.map((day) => ({
    day: dayNames[day] || day,
    ...byDay.get(day)!,
  }));
};

export const verifyModeLabel = (mode: string | null): string => {
  if (!mode) return arabicSource("common.device");
  const m = mode.toLowerCase().trim();
  if (m.includes("fpandcardandpw") || (m.includes("fp") && m.includes("card"))) return arabicSource("attendance.fingerprint_card");
  if (m.includes("cardandpw") || (m.includes("card") && m.includes("pw"))) return arabicSource("attendance.card_token");
  if (m.includes("faceandcard")) return arabicSource("attendance.face_card");
  if (m.includes("fp") || m.includes("finger")) return arabicSource("common.fingerprint");
  if (m.includes("face")) return arabicSource("common.face");
  if (m.includes("card")) return arabicSource("common.card");
  if (m.includes("iris")) return arabicSource("attendance.iris");
  if (m.includes("pw") || m.includes("password")) return arabicSource("attendance.code");
  return arabicSource("common.device");
};

export const VerifyIcon = ({ mode }: { mode: string | null }) => {
  if (!mode) return null;
  const m = mode.toLowerCase();
  if (m.includes(arabicSource("common.face")) || m.includes("face")) return <ScanFace className="w-3.5 h-3.5 text-blue-400" />;
  if (m.includes(arabicSource("common.fingerprint")) || m.includes("finger") || m.includes("fp")) return <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />;
  if (m.includes(arabicSource("common.card")) || m.includes("card")) return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
  return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
};

export const statusDetail = (row: AttendanceRow): string | null => {
  if (row.rawStatus === "auto_checkout") return arabicSource("attendance.auto_exit");
  if (row.rawStatus === "missing_checkin") return arabicSource("attendance.no_entry");
  if (row.rawStatus === "checked_in") return arabicSource("attendance.did_not_log_out");
  if (row.rawStatus === "missing_checkout") return arabicSource("attendance.no_exit");
  return null;
};
