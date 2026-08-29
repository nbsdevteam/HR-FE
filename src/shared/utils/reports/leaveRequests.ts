/**
 * Helpers for Leave Requests report (P1) — BE generate API.
 */

export type LeaveRequestsFilterInput = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string | number | null;
  employeeId?: string | number | null;
  leaveTypeId?: string | number | null;
  status?: string;
};

export const LEAVE_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export function buildLeaveRequestsFilters(
  input: LeaveRequestsFilterInput,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  if ((input.dateFrom || "").trim()) filters.date_from = input.dateFrom!.trim();
  if ((input.dateTo || "").trim()) filters.date_to = input.dateTo!.trim();
  if (input.departmentId != null && input.departmentId !== "") {
    const n = Number(input.departmentId);
    if (Number.isFinite(n) && n > 0) filters.department_id = n;
  }
  if (input.employeeId != null && input.employeeId !== "") {
    const n = Number(input.employeeId);
    if (Number.isFinite(n) && n > 0) filters.employee_id = n;
  }
  if (input.leaveTypeId != null && input.leaveTypeId !== "") {
    const n = Number(input.leaveTypeId);
    if (Number.isFinite(n) && n > 0) filters.leave_type_id = n;
  }
  if (input.status && input.status.trim()) {
    filters.status = input.status.trim();
  }
  return filters;
}

export function formatLeaveReportCell(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (key === "number_of_days") {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(value);
  }
  return String(value);
}
