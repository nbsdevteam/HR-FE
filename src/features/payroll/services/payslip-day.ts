import type {
  EmployeeSchedule,
  PayslipSettings,
  ProcessedAttendanceRecord,
  RawAttendanceRecord,
} from "./payslip-types";
import { minutesToHours, timeToMinutes } from "./payslip-time";

/**
 * Single-day attendance rules — the two decisions that used to be inlined in
 * the middle of a ~217-line `processAttendanceRecords`:
 *   1. which punches count as the day's check-in / check-out, and
 *   2. what hours, lateness and early-leave that pair implies.
 */

export type DaySchedule = EmployeeSchedule[string] | undefined;

/** Which punches count as the day's check-in / check-out, and what that implies. */
export type ResolvedPunches = {
  checkInTime?: string;
  checkOutTime?: string;
  status: ProcessedAttendanceRecord["status"];
  absenceReason?: ProcessedAttendanceRecord["absenceReason"];
  autoCheckinApplied: boolean;
  autoCheckoutApplied: boolean;
};

/** Hours/lateness derived from a resolved pair of punches. */
export type DayMetrics = {
  workingHours: number;
  overtimeHours: number;
  isLate: boolean;
  lateMinutes: number;
  isEarly: boolean;
  status: ProcessedAttendanceRecord["status"];
  absenceReason?: ProcessedAttendanceRecord["absenceReason"];
  checkOutTime?: string;
  autoCheckoutApplied: boolean;
};

/**
 * Decide the day's effective check-in/check-out from its raw punches.
 * Handles the messy real-world cases: no punches, two check-ins and no
 * check-out, a lone afternoon punch that is really a check-out, and so on.
 */
export const resolveDayPunches = (
  dayRecords: RawAttendanceRecord[],
  settings: PayslipSettings
): ResolvedPunches => {
  const checkIns = dayRecords.filter((r) => r.attendanceStatus === "Check-in");
  const checkOuts = dayRecords.filter((r) => r.attendanceStatus === "Check-out");
  const noneRecords = dayRecords.filter((r) => r.attendanceStatus === "None");

  let checkInTime: string | undefined;
  let checkOutTime: string | undefined;
  let status: ProcessedAttendanceRecord["status"] = "complete";
  let absenceReason: ProcessedAttendanceRecord["absenceReason"];
  let autoCheckinApplied = false;
  let autoCheckoutApplied = false;

  if (checkIns.length === 0 && checkOuts.length === 0) {
    // No punches
    status = "absent";
    absenceReason = "no_punches";
  } else if (checkIns.length > 0 && checkOuts.length > 0) {
    // Normal: first check-in, last check-out
    checkInTime = checkIns[0].time.substring(11, 19);
    checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
  } else if (checkIns.length > 0 && checkOuts.length === 0) {
    if (checkIns.length >= 2) {
      // Two check-ins, no check-out → earliest as in, latest as out
      checkInTime = checkIns[0].time.substring(11, 19);
      checkOutTime = checkIns[checkIns.length - 1].time.substring(11, 19);
      autoCheckoutApplied = true;
    } else {
      // Single check-in
      const inTime = checkIns[0].time.substring(11, 19);
      const inMinutes = timeToMinutes(inTime);
      if (inMinutes >= (settings.noonCutoffMinutes ?? 720)) {
        // After noon cutoff (configurable) — treat as check-out only
        checkOutTime = inTime;
        status = "missing_checkin";
        absenceReason = "checkout_without_checkin";
        autoCheckinApplied = true;
      } else {
        checkInTime = inTime;
        status = "missing_checkout";
        autoCheckoutApplied = true;
      }
    }
  } else if (checkOuts.length > 0 && checkIns.length === 0) {
    if (checkOuts.length >= 2) {
      // Two check-outs → earliest as in, latest as out
      checkInTime = checkOuts[0].time.substring(11, 19);
      checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
      autoCheckinApplied = true;
    } else {
      // Single check-out
      checkOutTime = checkOuts[0].time.substring(11, 19);
      status = "missing_checkin";
      absenceReason = "checkout_without_checkin";
    }
  }

  // If it was marked by "None" records, force absent
  if (noneRecords.length > 0 && checkIns.length === 0 && checkOuts.length === 0) {
    status = "absent";
    absenceReason = "no_punches";
  }

  return { checkInTime, checkOutTime, status, absenceReason, autoCheckinApplied, autoCheckoutApplied };
};

/**
 * Turn a resolved pair of punches into worked/overtime hours plus the
 * late/early flags, escalating to `absent_due_to_late_threshold` when lateness
 * crosses the configured cutoff.
 */
export const computeDayMetrics = (
  punches: ResolvedPunches,
  daySchedule: DaySchedule,
  settings: PayslipSettings
): DayMetrics => {
  const { checkInTime } = punches;
  let { checkOutTime, status, absenceReason, autoCheckoutApplied } = punches;

  let workingHours = 0;
  let overtimeHours = 0;
  let isLate = false;
  let lateMinutes = 0;
  let isEarly = false;

  if (checkInTime && checkOutTime && status !== "absent") {
    const inMin = timeToMinutes(checkInTime);
    const outMin = timeToMinutes(checkOutTime);
    const totalMin = outMin > inMin ? outMin - inMin : outMin + 1440 - inMin;
    workingHours = minutesToHours(totalMin);

    // Overtime: only time after scheduled end
    if (daySchedule?.endTime) {
      const endMin = timeToMinutes(daySchedule.endTime);
      if (outMin > endMin) {
        overtimeHours = minutesToHours(outMin - endMin);
      }
    }

    // Late check
    if (daySchedule?.startTime) {
      const expectedStart = timeToMinutes(daySchedule.startTime);
      const graceEnd = expectedStart + settings.shiftGraceMinutes;
      if (inMin > graceEnd) {
        isLate = true;
        lateMinutes = inMin - graceEnd; // Only charge minutes beyond grace period
      }
    }

    // Late-to-absent threshold
    if (isLate && lateMinutes >= settings.lateToAbsentHours * 60) {
      status = "absent_due_to_late_threshold";
      absenceReason = "late_threshold";
    }

    // Early leave — threshold is configurable via settings (from configurations table)
    if (daySchedule?.endTime) {
      const endMin = timeToMinutes(daySchedule.endTime);
      const earlyLeaveThreshold = settings.earlyLeaveThresholdMinutes ?? 10;
      if (outMin < endMin - earlyLeaveThreshold) {
        isEarly = true;
      }
    }
  } else if (checkInTime && !checkOutTime && status === "missing_checkout") {
    // Only check-in, assume worked until scheduled end
    if (daySchedule?.endTime) {
      const inMin = timeToMinutes(checkInTime);
      const endMin = timeToMinutes(daySchedule.endTime);
      workingHours = minutesToHours(endMin - inMin);
      checkOutTime = daySchedule.endTime + ":00";
      autoCheckoutApplied = true;
    }
  }

  return {
    workingHours,
    overtimeHours,
    isLate,
    lateMinutes,
    isEarly,
    status,
    absenceReason,
    checkOutTime,
    autoCheckoutApplied,
  };
};
