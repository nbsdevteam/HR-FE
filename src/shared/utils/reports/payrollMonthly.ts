/**
 * Helpers for Monthly Salaries report (P0d) — BE generate API.
 */
import { defaultMonthRangeBaghdad } from "./attendanceMonthly";

export type PayrollMonthlyFilterInput = {
  dateFrom?: string;
  dateTo?: string;
  month?: string;
  departmentId?: string | number | null;
  employeeId?: string | number | null;
  now?: Date;
};

/** Build filters for payroll_monthly generate. Prefers explicit month YYYY-MM. */
export function buildPayrollMonthlyFilters(
  input: PayrollMonthlyFilterInput,
): Record<string, unknown> {
  const defaults = defaultMonthRangeBaghdad(input.now);
  const date_from = (input.dateFrom || "").trim() || defaults.date_from;
  const date_to = (input.dateTo || "").trim() || defaults.date_to;
  let month = (input.month || "").trim();
  if (!month && date_from) {
    month = date_from.slice(0, 7);
  }
  const filters: Record<string, unknown> = {
    month,
    date_from,
    date_to,
  };
  if (input.departmentId != null && input.departmentId !== "") {
    const n = Number(input.departmentId);
    if (Number.isFinite(n) && n > 0) filters.department_id = n;
  }
  if (input.employeeId != null && input.employeeId !== "") {
    const n = Number(input.employeeId);
    if (Number.isFinite(n) && n > 0) filters.employee_id = n;
  }
  return filters;
}

export function formatPayrollReportCell(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (
      key === "basic_salary" ||
      key === "allowances" ||
      key === "deductions" ||
      key === "net_salary"
    ) {
      return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    if (
      key === "worked_hours" ||
      key === "shortfall_hours" ||
      key === "excused_shortfall_hours" ||
      key === "overtime_hours"
    ) {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(value);
  }
  return String(value);
}
