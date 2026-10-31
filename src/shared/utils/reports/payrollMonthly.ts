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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The `YYYY-MM` holding most of the days from `dateFrom` to `dateTo` (the later
 * month on a tie) — the month the backend picks for `payroll_monthly` when none
 * is sent. `null` for a range that is not two valid ISO dates in order.
 */
export const majorityMonthOfRange = (dateFrom: string, dateTo: string): string | null => {
  if (!ISO_DATE.test(dateFrom) || !ISO_DATE.test(dateTo) || dateFrom > dateTo) return null;
  const counts = new Map<string, number>();
  const day = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  while (day <= end) {
    const month = day.toISOString().slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
    day.setUTCDate(day.getUTCDate() + 1);
  }
  let best: string | null = null;
  for (const [month, count] of counts) {
    if (best === null || count > (counts.get(best) ?? 0) || (count === counts.get(best) && month > best)) best = month;
  }
  return best;
};

/** Build filters for payroll_monthly generate. Prefers explicit month YYYY-MM. */
export function buildPayrollMonthlyFilters(
  input: PayrollMonthlyFilterInput,
): Record<string, unknown> {
  const defaults = defaultMonthRangeBaghdad(input.now);
  const date_from = (input.dateFrom || "").trim() || defaults.date_from;
  const date_to = (input.dateTo || "").trim() || defaults.date_to;
  let month = (input.month || "").trim();
  if (!month) {
    month = majorityMonthOfRange(date_from, date_to) ?? date_from.slice(0, 7);
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
