import { arabicSource } from "@/i18n/source";
import { normalizeLeaveStatus } from "@/i18n/status";
import type { ProcessedAttendanceRecord } from "./payslip-types";

/**
 * Stage 4 of the payslip pipeline: overlay approved leave onto processed days.
 */

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id?: string | null;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day?: boolean;
  half_day_period?: string | null;
  status: string;
}

/** Configurable leave type info for payslip engine — passed from DB leave_types table */
export interface LeaveTypeInfo {
  code: string;
  name_ar: string;
  is_paid: boolean;
}

export interface LeaveDateEntry {
  leaveType: string;
  isUnpaid: boolean;
  isHalfDay: boolean;
  halfDayPeriod?: string | null;
}

/**
 * Index leave types by both lookup keys so resolving a request's paid/unpaid
 * flag is a Map hit rather than a full scan per leave request.
 */
const indexLeaveTypes = (leaveTypeInfos: LeaveTypeInfo[]): Map<string, LeaveTypeInfo> => {
  const index = new Map<string, LeaveTypeInfo>();
  // This replaced a `.find(t => t.name_ar === x || t.code === x)` per leave
  // request. `.find` returns the FIRST info matching on either field, so keys
  // are registered first-wins to keep resolution identical.
  for (const info of leaveTypeInfos) {
    if (info.name_ar && !index.has(info.name_ar)) index.set(info.name_ar, info);
    if (info.code && !index.has(info.code)) index.set(info.code, info);
  }
  return index;
};

/** Advance a "YYYY-MM-DD" string by one calendar day (no UTC shift). */
const nextDate = (date: string): string => {
  const [cy, cm, cd] = date.split("-").map(Number);
  const next = new Date(cy, cm - 1, cd + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
};

/** Build a map of dates → leave info for an employee's approved leaves in a given month.
 *  Now supports configurable leave types (is_paid) and half-day leaves. */
export const buildLeaveDateMap = (
  leaves: LeaveRequest[],
  employeeId: string,
  monthYear: string,
  leaveTypeInfos?: LeaveTypeInfo[]
): Record<string, LeaveDateEntry> => {
  const map: Record<string, LeaveDateEntry> = {};
  const [y, m] = monthYear.split("-").map(Number);
  const monthEnd = new Date(y, m, 0); // last day of month
  const typeIndex = leaveTypeInfos ? indexLeaveTypes(leaveTypeInfos) : undefined;

  const acceptedKey = arabicSource("common.accepted");
  for (const lv of leaves) {
    if (lv.employee_id !== employeeId) continue;
    // Accept Odoo validate / approved / localized "accepted" labels.
    if (normalizeLeaveStatus(lv.status) !== acceptedKey) continue;

    // Determine if unpaid: first check leave_types table, fallback to hardcoded name
    let isUnpaid = lv.leave_type === arabicSource("common.without_salary");
    const typeInfo = typeIndex?.get(lv.leave_type);
    if (typeInfo) isUnpaid = !typeInfo.is_paid;

    // Calendar-date iteration (no UTC shift) so leave days match Baghdad dates.
    const clampStart = lv.start_date > `${monthYear}-01` ? lv.start_date : `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = monthEnd.getDate();
    const clampEndCandidate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const clampEnd = lv.end_date < clampEndCandidate ? lv.end_date : clampEndCandidate;
    if (!clampStart || !clampEnd || clampStart > clampEnd) continue;

    let cur = clampStart;
    while (cur <= clampEnd) {
      map[cur] = {
        leaveType: lv.leave_type,
        isUnpaid,
        isHalfDay: lv.is_half_day || false,
        halfDayPeriod: lv.half_day_period,
      };
      cur = nextDate(cur);
    }
  }
  return map;
};

/** Apply approved leave data to processed attendance records.
 *  Supports both old format (Record<string, string>) and new format (Record<string, LeaveDateEntry>).
 *  - Paid leave: mark as "leave", excusedAbsence=true, no deduction.
 *  - Unpaid leave: mark as "leave" + isUnpaidLeave=true, excusedAbsence=false → WILL be deducted.
 *  - Half-day leave: mark partial leave, half the working hours count.
 */
export const applyLeaveToRecords = (
  records: ProcessedAttendanceRecord[],
  leaveDateMap: Record<string, string | LeaveDateEntry>
): ProcessedAttendanceRecord[] => {
  return records.map((rec) => {
    const entry = leaveDateMap[rec.date];
    if (!entry) return rec;

    // Support both old (string) and new (LeaveDateEntry) formats
    let leaveType: string;
    let isUnpaid: boolean;
    let isHalfDay: boolean;

    if (typeof entry === "string") {
      leaveType = entry;
      isUnpaid = entry === arabicSource("common.without_salary");
      isHalfDay = false;
    } else {
      leaveType = entry.leaveType;
      isUnpaid = entry.isUnpaid;
      isHalfDay = entry.isHalfDay;
    }

    // If the employee was actually present (has check-in), leave doesn't override
    if (rec.status === "complete" && rec.checkInTime && rec.checkOutTime) {
      return {
        ...rec,
        isLeaveDay: true,
        leaveType,
        isUnpaidLeave: isUnpaid,
      };
    }

    // For absent days or missing punch days — mark as leave
    return {
      ...rec,
      status: "leave" as const,
      isLeaveDay: true,
      leaveType,
      isUnpaidLeave: isUnpaid,
      excusedAbsence: !isUnpaid,
      excusedShortfall: !isUnpaid,
      workingHours: isHalfDay ? (rec.workingHours || 0) : 0,
      overtimeHours: 0,
      isLate: false,
      lateMinutes: 0,
      isEarly: false,
    };
  });
};
