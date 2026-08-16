/**
 * Helpers for Punch Audit report (P2) — BE generate API.
 */

import { defaultMonthRangeBaghdad } from "./attendanceMonthly";

export type PunchAuditFilterInput = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string | number | null;
  employeeId?: string | number | null;
  employeeNo?: string | null;
  deviceId?: string | number | null;
  status?: string;
  now?: Date;
};

export const PUNCH_AUDIT_DISPLAY_COLUMNS: { key: string; label: string }[] = [
  { key: "employee_no", label: "Employee No" },
  { key: "employee_name", label: "Employee" },
  { key: "department", label: "Department" },
  { key: "event_date", label: "Date" },
  { key: "punch_time", label: "Punch Time (Asia/Baghdad)" },
  { key: "punch_role_label", label: "Punch Type" },
  { key: "device_name", label: "Device" },
  { key: "problem_label", label: "Status / Problem" },
];

export const PUNCH_AUDIT_DETAIL_COLUMNS: { key: string; label: string }[] = [
  { key: "device_event_id", label: "Device Event ID" },
  { key: "punch_role", label: "Punch Role" },
  { key: "punch_source_label", label: "Punch Source" },
  { key: "verify_mode", label: "Verification Method" },
  { key: "card_no", label: "Card No" },
  { key: "door_no", label: "Door" },
  { key: "processed", label: "Processed" },
  { key: "process_error", label: "Process Error" },
  { key: "attendance_id", label: "Attendance ID" },
  { key: "attendance_check_in", label: "Attendance Check-in (Baghdad)" },
  { key: "attendance_check_out", label: "Attendance Check-out (Baghdad)" },
  { key: "attendance_source", label: "Attendance Source" },
  { key: "attendance_day_status", label: "Attendance Day Status" },
  { key: "problem", label: "Problem Code" },
];

export function isPunchAuditReport(code?: string | null): boolean {
  return code === "punch_audit" || code === "device_events" || code === "punch_ledger";
}

export const PUNCH_PROBLEM_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All punch results" },
  { value: "problems", label: "Problems only" },
  { value: "ok", label: "OK / linked" },
  { value: "unprocessed", label: "Unprocessed" },
  { value: "process_error", label: "Process error" },
  { value: "employee_unresolved", label: "Employee unresolved" },
  { value: "no_attendance", label: "Punch without attendance" },
  { value: "missing_checkout", label: "Missing check-out" },
  { value: "attendance_without_punch", label: "Attendance without punch" },
];

export function buildPunchAuditFilters(
  input: PunchAuditFilterInput,
): Record<string, unknown> {
  const defaults = defaultMonthRangeBaghdad(input.now);
  const date_from = (input.dateFrom || "").trim() || defaults.date_from;
  const date_to = (input.dateTo || "").trim() || defaults.date_to;
  const filters: Record<string, unknown> = { date_from, date_to };

  if (input.departmentId != null && input.departmentId !== "") {
    const n = Number(input.departmentId);
    if (Number.isFinite(n) && n > 0) filters.department_id = n;
  }
  if (input.employeeId != null && input.employeeId !== "") {
    const n = Number(input.employeeId);
    if (Number.isFinite(n) && n > 0) filters.employee_id = n;
  }
  if (input.deviceId != null && input.deviceId !== "") {
    const n = Number(input.deviceId);
    if (Number.isFinite(n) && n > 0) filters.device_id = n;
  }
  if ((input.employeeNo || "").trim()) {
    filters.employee_no = input.employeeNo!.trim();
  }
  if (input.status && input.status.trim()) {
    filters.status = input.status.trim();
  }
  return filters;
}

export function formatPunchAuditCell(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null || value === "") return "—";
  if (typeof value === "number") return String(value);
  return String(value);
}
