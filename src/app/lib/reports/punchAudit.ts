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
