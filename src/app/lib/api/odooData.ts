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

export async function fetchAttendance(date?: string): Promise<DbAttendanceRecord[]> {
  const params: Record<string, unknown> = { limit: date ? 500 : 5000, offset: 0 };
  if (date) {
    params.date_from = date;
    params.date_to = date;
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
