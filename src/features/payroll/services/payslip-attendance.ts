import {
  DEFAULT_SETTINGS,
  type PayslipSettings,
  type ProcessedAttendanceRecord,
  type RawAttendanceRecord,
  type EmployeePayConfig,
} from "./payslip-types";
import { computeDayMetrics, resolveDayPunches } from "./payslip-day";
import {
  dayNamesAr,
  formatTimeStr,
  getDayOfWeek,
  getMonthDates,
} from "./payslip-time";

/**
 * Stage 2 of the payslip pipeline: raw device punches → one processed record
 * per scheduled working day.
 *
 * The per-day rules (which punches count, and what hours/lateness they imply)
 * live in `./payslip-day.ts`; this module owns the month-level walk that
 * composes them.
 */

/** A public holiday falling on a scheduled working day — no punches expected. */
const buildHolidayRecord = (
  employeeConfig: EmployeePayConfig,
  date: string,
  dayName: string
): ProcessedAttendanceRecord => ({
  id: `${employeeConfig.id}-${date}`,
  employeeId: employeeConfig.id,
  date,
  dayOfWeek: dayNamesAr[dayName] || dayName,
  isScheduledWorkingDay: false,
  isWorkingDay: false,
  status: "holiday",
  checkInTime: undefined,
  checkOutTime: undefined,
  workingHours: 0,
  overtimeHours: 0,
  isLate: false,
  lateMinutes: 0,
  isEarly: false,
  autoCheckoutApplied: false,
  autoCheckinApplied: false,
  excusedAbsence: false,
  excusedLate: false,
  excusedShortfall: false,
});

/** Bucket this employee's punches for this month by date, in one pass. */
const groupPunchesByDate = (
  rawRecords: RawAttendanceRecord[],
  personId: string,
  monthYear: string
): Record<string, RawAttendanceRecord[]> => {
  const byDate: Record<string, RawAttendanceRecord[]> = {};
  for (const rec of rawRecords) {
    if (rec.personId !== personId) continue;
    const dateStr = rec.time.substring(0, 10);
    if (!dateStr.startsWith(monthYear)) continue;
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(rec);
  }
  return byDate;
};

export const processAttendanceRecords = (
  rawRecords: RawAttendanceRecord[],
  employeeConfig: EmployeePayConfig,
  monthYear: string,
  settings: PayslipSettings = DEFAULT_SETTINGS,
  holidays?: Set<string>
): ProcessedAttendanceRecord[] => {
  const monthDates = getMonthDates(monthYear);
  const schedule = employeeConfig.schedule;
  const byDate = groupPunchesByDate(rawRecords, employeeConfig.personId, monthYear);

  const processed: ProcessedAttendanceRecord[] = [];

  for (const date of monthDates) {
    const dayName = getDayOfWeek(date);
    const daySchedule = schedule[dayName];
    const isScheduled = daySchedule?.isWorkingDay ?? false;

    if (!isScheduled) continue; // Skip non-working days

    // Skip public holidays — treat as non-working day
    if (holidays?.has(date)) {
      processed.push(buildHolidayRecord(employeeConfig, date, dayName));
      continue;
    }

    const dayRecords = byDate[date] || [];
    const punches = resolveDayPunches(dayRecords, settings);
    const metrics = computeDayMetrics(punches, daySchedule, settings);

    processed.push({
      id: `${employeeConfig.id}-${date}`,
      employeeId: employeeConfig.id,
      date,
      dayOfWeek: dayName,
      checkInTime: punches.checkInTime,
      checkOutTime: metrics.checkOutTime,
      workingHours: Math.max(0, metrics.workingHours),
      overtimeHours: Math.max(0, metrics.overtimeHours),
      isLate: metrics.isLate,
      lateMinutes: metrics.lateMinutes,
      isEarly: metrics.isEarly,
      status: metrics.status,
      autoCheckoutApplied: metrics.autoCheckoutApplied,
      autoCheckinApplied: punches.autoCheckinApplied,
      absenceReason: metrics.absenceReason,
      excusedAbsence: dayRecords.some((r) => r.excused_absence) || false,
      excusedLate: dayRecords.some((r) => r.excused_late) || false,
      excusedShortfall: dayRecords.some((r) => r.excused_shortfall) || false,
      formattedCheckIn: punches.checkInTime ? formatTimeStr(punches.checkInTime) : undefined,
      formattedCheckOut: metrics.checkOutTime ? formatTimeStr(metrics.checkOutTime) : undefined,
      expectedStartTime: daySchedule?.startTime,
      expectedEndTime: daySchedule?.endTime,
      isScheduledWorkingDay: isScheduled,
    });
  }

  return processed;
};
