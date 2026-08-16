/**
 * Helpers for Monthly Attendance report (P0c) — BE-authoritative generate API.
 * Pure functions kept separate for unit tests.
 */

export type ReportColumn = { key: string; label: string };

export type AttendanceMonthlyFilterInput = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string | number | null;
  employeeId?: string | number | null;
  status?: string;
  excuseStatus?: "" | "excused" | "not_excused";
  now?: Date;
};

export const ATTENDANCE_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "holiday", label: "Holiday" },
  { value: "rest_day", label: "Rest Day" },
  { value: "missing_checkin", label: "Missing Check-in" },
  { value: "missing_checkout", label: "Missing Check-out" },
  { value: "before_joining", label: "Before Joining" },
  { value: "after_exit", label: "After Exit" },
];

export const ATTENDANCE_EXCUSE_FILTER_OPTIONS: {
  value: "" | "excused" | "not_excused";
  label: string;
}[] = [
  { value: "", label: "All excuse states" },
  { value: "excused", label: "Excused only" },
  { value: "not_excused", label: "Not excused" },
];

export function baghdadYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function defaultMonthRangeBaghdad(now: Date = new Date()): {
  date_from: string;
  date_to: string;
} {
  const ymd = baghdadYmd(now);
  const [y, m] = ymd.split("-").map(Number);
  const date_from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const date_to = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { date_from, date_to };
}

export function buildAttendanceMonthlyFilters(
  input: AttendanceMonthlyFilterInput,
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
  if (input.status && input.status.trim()) {
    filters.status = input.status.trim();
  }
  if (input.excuseStatus === "excused" || input.excuseStatus === "not_excused") {
    filters.excuse_status = input.excuseStatus;
  }
  return filters;
}

export function resolveDepartmentId(
  departments: { id: string; name: string }[],
  filterDept: string,
): string | null {
  if (!filterDept) return null;
  const byId = departments.find((d) => d.id === filterDept);
  if (byId) return byId.id;
  const byName = departments.find((d) => d.name === filterDept);
  return byName ? byName.id : null;
}

export function formatAttendanceReportCell(
  key: string,
  value: unknown,
  row?: Record<string, unknown>,
): string {
  if (key === "status") {
    const label = row?.status_label;
    if (label != null && String(label).trim()) return String(label);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (
      key === "worked_hours" ||
      key === "shortfall_hours" ||
      key === "overtime_hours" ||
      key === "expected_hours"
    ) {
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
    return String(value);
  }
  return String(value);
}

export function columnsForExport(
  columns: ReportColumn[],
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const c of columns) {
      out[c.label] = formatAttendanceReportCell(c.key, row[c.key], row);
    }
    return out;
  });
}
