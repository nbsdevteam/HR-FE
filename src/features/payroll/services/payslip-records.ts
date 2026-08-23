import type { ProcessedAttendanceRecord } from "./payslip-types";

/** Record-set filters used by the payroll detail views. */

export const getShortfallRecords = (
  records: ProcessedAttendanceRecord[],
  targetHours: number
): ProcessedAttendanceRecord[] => {
  return records.filter(
    (r) =>
      r.isScheduledWorkingDay &&
      r.status !== "absent" &&
      r.status !== "absent_due_to_late_threshold" &&
      r.status !== "leave" &&
      r.workingHours < targetHours
  );
};

export const getAbsenceRecords = (
  records: ProcessedAttendanceRecord[]
): ProcessedAttendanceRecord[] => {
  return records.filter(
    (r) => r.status === "absent" || r.status === "absent_due_to_late_threshold" ||
           (r.status === "leave" && r.isUnpaidLeave)
  );
};

export const getLeaveRecords = (
  records: ProcessedAttendanceRecord[]
): ProcessedAttendanceRecord[] => {
  return records.filter((r) => r.status === "leave");
};
