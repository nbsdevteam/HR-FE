/**
 * Odoo data fetchers for dual-mode hooks (Phase 7).
 * Used when VITE_API_BASE is set.
 */
import { hrCall } from "./client";
import {
  mapEmployee,
  mapDepartment,
  mapAttendance,
  mapShift,
  mapPosition,
  mapShiftAssignment,
  mapMonthlyRecord,
  mapMonthlyLedger,
  mapConfig,
  mapModule,
  mapHoliday,
  mapLeaveType,
  mapLeavePolicy,
  mapLeaveRequest,
  mapLeaveBalance,
  mapLeavePermission,
  mapAllowanceType,
  mapEmployeeAllowance,
  mapDeductionType,
  mapEmployeeDeduction,
  mapDocumentType,
  mapDocument,
} from "./mappers";
import type {
  DbEmployee,
  DbDepartment,
  DbAttendanceRecord,
  DbMonthlyRecord,
  DbMonthlyLedger,
  DbShift,
  DbPosition,
  DbEmployeeShiftAssignment,
  DbSystemModule,
  DbConfiguration,
  DbPublicHoliday,
  DbLeaveType,
  DbLeavePolicy,
  DbLeaveRequest,
  DbLeaveBalance,
  DbLeavePermission,
  DbAllowanceType,
  DbEmployeeAllowance,
  DbDeductionType,
  DbEmployeeDeduction,
  DbDocumentType,
  DbEmployeeDocument,
} from "../hooks";

async function items<T>(path: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const data = await hrCall<{ items?: T[] } | T[]>(path, params);
  if (Array.isArray(data)) return data;
  return (data?.items as T[]) || [];
}

export async function fetchEmployees(): Promise<DbEmployee[]> {
  const rows = await items<any>("/api/hr/employees/list", { limit: 200, offset: 0 });
  return rows.map(mapEmployee);
}

export async function fetchDepartments(): Promise<DbDepartment[]> {
  const rows = await items<any>("/api/hr/departments/list", { limit: 200 });
  return rows.map(mapDepartment);
}

export type AttendanceFetchOpts = {
  date?: string;
  date_from?: string;
  date_to?: string;
  employee_id?: string | number;
  limit?: number;
};

export async function fetchAttendance(
  dateOrOpts?: string | AttendanceFetchOpts,
): Promise<DbAttendanceRecord[]> {
  const opts: AttendanceFetchOpts =
    typeof dateOrOpts === "string" || dateOrOpts === undefined
      ? { date: dateOrOpts }
      : dateOrOpts;
  const params: Record<string, unknown> = {
    limit: opts.limit ?? (opts.date || opts.employee_id ? 500 : 5000),
    offset: 0,
  };
  if (opts.date) {
    params.date_from = opts.date;
    params.date_to = opts.date;
  }
  if (opts.date_from) params.date_from = opts.date_from;
  if (opts.date_to) params.date_to = opts.date_to;
  if (opts.employee_id != null && opts.employee_id !== "") {
    params.employee_id = Number(opts.employee_id) || opts.employee_id;
  }
  const rows = await items<any>("/api/hr/attendance/list", params);
  return rows.map(mapAttendance);
}

export async function fetchMonthlyRecords(monthYear?: string): Promise<DbMonthlyRecord[]> {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/monthly_records/list", params);
  return rows.map(mapMonthlyRecord);
}

export async function fetchMonthlyLedgers(monthYear?: string): Promise<DbMonthlyLedger[]> {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/ledgers/list", params);
  return rows.map(mapMonthlyLedger);
}

export async function fetchShifts(): Promise<DbShift[]> {
  const rows = await items<any>("/api/hr/shifts/list", { limit: 200 });
  return rows.map(mapShift);
}

export async function fetchPositions(): Promise<DbPosition[]> {
  const rows = await items<any>("/api/hr/designations/list", { limit: 200 });
  return rows.map(mapPosition);
}

export async function fetchShiftAssignments(): Promise<DbEmployeeShiftAssignment[]> {
  const rows = await items<any>("/api/hr/shift_assignments/list", { active_only: true, limit: 500 });
  return rows.map(mapShiftAssignment);
}

export async function fetchModules(): Promise<DbSystemModule[]> {
  const rows = await items<any>("/api/hr/modules/list");
  return rows.map(mapModule);
}

export async function fetchConfigs(): Promise<DbConfiguration[]> {
  const rows = await items<any>("/api/hr/configs/list");
  return rows.map(mapConfig);
}

export async function fetchHolidays(year?: number): Promise<DbPublicHoliday[]> {
  const params: Record<string, unknown> = { limit: 200 };
  if (year) params.year = year;
  const rows = await items<any>("/api/hr/holidays/list", params);
  return rows.map(mapHoliday);
}

export async function fetchLeaveTypes(): Promise<DbLeaveType[]> {
  const rows = await items<any>("/api/hr/leave/types");
  return rows.map(mapLeaveType);
}

export async function fetchLeavePolicies(): Promise<DbLeavePolicy[]> {
  const rows = await items<any>("/api/hr/leave/policies/list");
  return rows.map(mapLeavePolicy);
}

export async function fetchLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
  month?: string;
}): Promise<DbLeaveRequest[]> {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.employeeId) params.employee_id = Number(filters.employeeId) || filters.employeeId;
  if (filters?.month) {
    params.date_from = `${filters.month}-01`;
    params.date_to = `${filters.month}-31`;
  }
  // FE may pass Arabic status; leave raw and filter client-side if needed
  const rows = await items<any>("/api/hr/leave/list", params);
  let mapped = rows.map(mapLeaveRequest);
  if (filters?.status) {
    mapped = mapped.filter((r) => r.status === filters.status || r.status.includes(filters.status!));
  }
  return mapped;
}

export async function fetchLeaveBalances(year?: number): Promise<DbLeaveBalance[]> {
  const params: Record<string, unknown> = {};
  if (year) params.year = year;
  const data = await hrCall<any>("/api/hr/leave/balances", params);
  const rows = Array.isArray(data) ? data : data?.items || data?.balances || [];
  return rows.map(mapLeaveBalance);
}

export async function fetchLeavePermissions(employeeId?: string): Promise<DbLeavePermission[]> {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/leave/permissions/list", params);
  return rows.map(mapLeavePermission);
}

export async function fetchAllowanceTypes(): Promise<DbAllowanceType[]> {
  const rows = await items<any>("/api/hr/payroll/allowance_types/list");
  return rows.map(mapAllowanceType);
}

export async function fetchEmployeeAllowances(employeeId?: string): Promise<DbEmployeeAllowance[]> {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_allowances/list", params);
  return rows.map(mapEmployeeAllowance);
}

export async function fetchDeductionTypes(): Promise<DbDeductionType[]> {
  const rows = await items<any>("/api/hr/payroll/deduction_types/list");
  return rows.map(mapDeductionType);
}

export async function fetchEmployeeDeductions(employeeId?: string): Promise<DbEmployeeDeduction[]> {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_deductions/list", params);
  return rows.map(mapEmployeeDeduction);
}

export async function fetchDocumentTypes(): Promise<DbDocumentType[]> {
  const rows = await items<any>("/api/hr/document_types/list");
  return rows.map(mapDocumentType);
}

export async function fetchDocuments(employeeId?: string): Promise<DbEmployeeDocument[]> {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/documents/list", params);
  return rows.map(mapDocument);
}

export async function fetchDevices(): Promise<any[]> {
  return items<any>("/api/hr/devices/list", { limit: 100 });
}

// ─── Write helpers (P0 cutover) ───────────────────────────────────────

function eid(id: string | number): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error(`Invalid id: ${id}`);
  return n;
}

/** Convert "HH:MM" or "HH:MM:SS" → float hours for Odoo. */
export function timeToFloat(t: string | number | null | undefined): number {
  if (typeof t === "number") return t;
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) + ((m || 0) / 60);
}

export async function createEmployee(payload: Record<string, unknown>) {
  return hrCall("/api/hr/employees/create", payload);
}

export async function updateEmployee(employeeId: string | number, payload: Record<string, unknown>) {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/update`, payload);
}

export async function setEmployeeStatus(employeeId: string | number, status: string) {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/set_status`, { status });
}

export async function excuseAttendance(payload: {
  attendance_id?: string | number;
  employee_id?: string | number;
  date?: string;
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
  excuse_note?: string | null;
}) {
  const params: Record<string, unknown> = { ...payload };
  if (payload.attendance_id != null) params.attendance_id = eid(payload.attendance_id);
  if (payload.employee_id != null) params.employee_id = eid(payload.employee_id);
  return hrCall("/api/hr/attendance/excuse", params);
}

export async function upsertAttendance(payload: Record<string, unknown>) {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/attendance/upsert", params);
}

export async function importAttendance(records: Record<string, unknown>[]) {
  return hrCall("/api/hr/attendance/import", { records });
}

export async function requestLeave(payload: {
  leave_type_id: string | number;
  date_from: string;
  date_to?: string;
  reason?: string | null;
  half_day?: boolean;
  employee_id?: string | number;
}) {
  const params: Record<string, unknown> = {
    leave_type_id: eid(payload.leave_type_id),
    date_from: payload.date_from,
    date_to: payload.date_to || payload.date_from,
    reason: payload.reason || "",
    half_day: Boolean(payload.half_day),
  };
  if (payload.employee_id != null) params.employee_id = eid(payload.employee_id);
  return hrCall("/api/hr/leave/request", params);
}

export async function managerApproveLeave(leaveId: string | number) {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/manager_approve`, {});
}

export async function hrApproveLeave(leaveId: string | number) {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/hr_approve`, {});
}

export async function refuseLeave(leaveId: string | number, reason?: string | null) {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/refuse`, { reason: reason || "" });
}

export async function cancelLeave(leaveId: string | number) {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/cancel`, {});
}

export async function createLeavePermission(payload: {
  employee_id: string | number;
  date: string;
  start_time: string | number;
  end_time: string | number;
  hours?: number;
  reason?: string | null;
}) {
  return hrCall("/api/hr/leave/permissions/create", {
    employee_id: eid(payload.employee_id),
    date: payload.date,
    start_time: timeToFloat(payload.start_time),
    end_time: timeToFloat(payload.end_time),
    hours: payload.hours ?? Math.abs(timeToFloat(payload.end_time) - timeToFloat(payload.start_time)),
    reason: payload.reason || "",
  });
}

export async function updateLeavePermission(
  permissionId: string | number,
  status: "approved" | "refused" | "pending" | string,
) {
  // Map FE Arabic labels → Odoo states
  const map: Record<string, string> = {
    مقبول: "approved",
    مرفوض: "refused",
    معلق: "pending",
    approved: "approved",
    refused: "refused",
    pending: "pending",
  };
  return hrCall(`/api/hr/leave/permissions/${eid(permissionId)}/update`, {
    status: map[status] || status,
  });
}

export async function upsertMonthlyRecord(payload: {
  employee_id: string | number;
  month_year: string;
  salary_calculation?: unknown;
}) {
  return hrCall("/api/hr/payroll/monthly_records/upsert", {
    employee_id: eid(payload.employee_id),
    month_year: payload.month_year,
    salary_calculation: payload.salary_calculation || {},
  });
}

export async function upsertMonthlyLedger(payload: Record<string, unknown>) {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/payroll/ledgers/upsert", params);
}

export async function generatePayslips(payload: {
  month: string;
  payslips: Record<string, unknown>[];
  replace_month?: boolean;
}) {
  return hrCall("/api/hr/payroll/payslips/generate", {
    month: payload.month,
    payslips: payload.payslips.map((p) => ({
      ...p,
      employee_id: eid(p.employee_id as string | number),
    })),
    replace_month: Boolean(payload.replace_month),
  });
}

export async function createShift(payload: Record<string, unknown>) {
  return hrCall("/api/hr/shifts/create", payload);
}

export async function updateShift(shiftId: string | number, payload: Record<string, unknown>) {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/update`, payload);
}

export async function deleteShift(shiftId: string | number) {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/delete`, {});
}

export async function createShiftAssignment(payload: {
  employee_id: string | number;
  shift_id: string | number;
  start_date?: string;
  end_date?: string | null;
  set_employee_default?: boolean;
}) {
  return hrCall("/api/hr/shift_assignments/create", {
    employee_id: eid(payload.employee_id),
    shift_id: eid(payload.shift_id),
    start_date: payload.start_date || new Date().toISOString().slice(0, 10),
    end_date: payload.end_date || false,
    set_employee_default: payload.set_employee_default !== false,
  });
}

export async function updateConfig(configId: string | number, config_value: unknown) {
  return hrCall("/api/hr/configs/update", {
    config_id: eid(configId),
    config_value,
  });
}

export async function updateModule(moduleId: string | number, is_enabled: boolean) {
  return hrCall("/api/hr/modules/update", {
    module_id: eid(moduleId),
    is_enabled,
  });
}

export async function createHoliday(payload: {
  name_ar?: string;
  name?: string;
  date: string;
}) {
  return hrCall("/api/hr/holidays/create", {
    name: payload.name_ar || payload.name,
    name_ar: payload.name_ar,
    date: payload.date,
  });
}

export async function deleteHoliday(holidayId: string | number) {
  return hrCall(`/api/hr/holidays/${eid(holidayId)}/delete`, {});
}

export async function updateDepartment(
  departmentId: string | number,
  payload: Record<string, unknown>,
) {
  return hrCall(`/api/hr/departments/${eid(departmentId)}/update`, payload);
}

export async function createDepartment(payload: Record<string, unknown>) {
  return hrCall("/api/hr/departments/create", payload);
}

export async function createDesignation(payload: Record<string, unknown>) {
  return hrCall("/api/hr/designations/create", payload);
}

export async function updateDesignation(jobId: string | number, payload: Record<string, unknown>) {
  return hrCall(`/api/hr/designations/${eid(jobId)}/update`, payload);
}

export async function deleteDesignation(jobId: string | number) {
  return hrCall(`/api/hr/designations/${eid(jobId)}/delete`, {});
}

export async function createDocument(payload: Record<string, unknown>) {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.document_type_id != null) {
    params.document_type_id = eid(params.document_type_id as string | number);
  }
  return hrCall("/api/hr/documents/create", params);
}

export async function updateDocument(documentId: string | number, payload: Record<string, unknown>) {
  return hrCall(`/api/hr/documents/${eid(documentId)}/update`, payload);
}

export async function deleteDocument(documentId: string | number) {
  return hrCall(`/api/hr/documents/${eid(documentId)}/delete`, {});
}

export async function linkEmployeesToUsers(dry_run = true, employee_ids?: number[]) {
  return hrCall("/api/hr/employees/link_users", { dry_run, employee_ids });
}
