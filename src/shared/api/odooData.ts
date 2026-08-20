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
  mapContractType,
  mapEmployeeContract,
  mapExitChecklistItem,
  mapExitProcess,
  mapExitChecklistLine,
  mapWarning,
  mapNotification,
  mapIssue,
  mapApprovalWorkflow,
  mapApprovalRequest,
  mapAuditLog,
  mapEvaluation,
  mapEvaluationCriterion,
  mapPolicy,
  mapTrainingProgram,
  mapTrainingParticipant,
  mapJobOpening,
  mapApplicant,
  mapLoan,
  mapReportTemplate,
  mapReportHistory,
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
  DbContractType,
  DbEmployeeContract,
  DbExitChecklistItem,
  DbExitProcess,
  DbExitChecklist,
  DbWarning,
  DbNotification,
  DbAuditLog,
  DbEvaluation,
  DbEvaluationCriteria,
  DbPolicy,
  DbTrainingProgram,
  DbTrainingParticipant,
  DbJobOpening,
  DbApplicant,
  DbLoan,
  DbReportTemplate,
  DbReportHistory,
  JobRankingStats,
  ApplicationLink,
} from "../hooks";

async function items<T>(path: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const data = await hrCall<{ items?: T[] } | T[]>(path, params);
  if (Array.isArray(data)) return data;
  return (data?.items as T[]) || [];
}

export const fetchEmployees = async (): Promise<DbEmployee[]> => {
  // Backend allows up to 5000; load the full active roster for dropdowns.
  const rows = await items<any>("/api/hr/employees/list", { limit: 5000, offset: 0 });
  return rows.map(mapEmployee);
}

/** Scoped dashboard cards from Odoo (present/absent/on_leave/late). */
export const fetchHrDashboard = async (params?: {
  departmentId?: string | number;
  newJoinerDays?: number;
}): Promise<Record<string, unknown>> => {
  const body: Record<string, unknown> = {};
  if (params?.departmentId != null) body.department_id = eid(params.departmentId);
  if (params?.newJoinerDays != null) body.new_joiner_days = params.newJoinerDays;
  return hrCall("/api/hr/dashboard", body);
}

/** Server-side payroll compute (same snapshot contract as FE generate). */
export const computePayrollServer = async (month: string) => {
  return hrCall("/api/hr/payroll/compute", { month });
}

/** Current user's linked hr.employee (JWT only; does not require hr.employees.list). */
export const fetchCurrentEmployee = async (): Promise<DbEmployee> => {
  const data = await hrCall<any>("/api/hr/employees/me", {});
  return mapEmployee(data);
}

const UNLINKED_EMPLOYEE_MSG =
  "Your user account is not linked to an employee. Please contact HR.";

/** True when /api/hr/employees/list failed due to missing hr.employees.list (not network). */
export const isEmployeesListForbiddenError = (error: unknown): boolean => {
  const msg = String(
    error && typeof error === "object" && "message" in error
      ? (error as { message?: unknown }).message
      : error ?? "",
  );
  return /forbidden|hr\.employees\.list|permission required/i.test(msg);
}

export type LeaveEmployeeScopeResult = {
  selfOnly: boolean;
  employees: DbEmployee[];
  linkError: string | null;
};

export type LeaveEmployeeScopeDeps = {
  fetchEmployees: () => Promise<DbEmployee[]>;
  fetchCurrentEmployee: () => Promise<DbEmployee>;
};

/**
 * Resolve Leave page employee roster without CRM permission APIs.
 * - Has hr.employees.list → full /employees/list (HR/admin dropdown).
 * - Forbidden on list → /employees/me + selfOnly (agent self-leave).
 */
export const resolveLeaveEmployeeScope = async (
  deps: LeaveEmployeeScopeDeps = {
    fetchEmployees,
    fetchCurrentEmployee,
  },
): Promise<LeaveEmployeeScopeResult> => {
  try {
    const employees = await deps.fetchEmployees();
    return { selfOnly: false, employees, linkError: null };
  } catch (listErr) {
    if (!isEmployeesListForbiddenError(listErr)) {
      throw listErr;
    }
  }

  try {
    const me = await deps.fetchCurrentEmployee();
    return { selfOnly: true, employees: [me], linkError: null };
  } catch (e: unknown) {
    const msg = String(
      e && typeof e === "object" && "message" in e
        ? (e as { message?: unknown }).message
        : e ?? "",
    );
    return {
      selfOnly: true,
      employees: [],
      linkError: /no hr employee linked|not linked/i.test(msg)
        ? UNLINKED_EMPLOYEE_MSG
        : msg || UNLINKED_EMPLOYEE_MSG,
    };
  }
}

/**
 * Self-leave payloads must omit employee_id so the backend uses current_employee().
 * Roster mode may include a selected employee_id (HR manage_types path unchanged).
 */
export const leaveRequestEmployeeIdField = (
  selfOnly: boolean,
  employeeId: string | number | null | undefined,
): { employee_id: string | number } | Record<string, never> => {
  if (selfOnly) return {};
  if (employeeId == null || employeeId === "") return {};
  return { employee_id: employeeId };
}

export const fetchDepartments = async (): Promise<DbDepartment[]> => {
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

export const fetchAttendance = async (
  dateOrOpts?: string | AttendanceFetchOpts,
): Promise<DbAttendanceRecord[]> => {
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

export const fetchMonthlyRecords = async (monthYear?: string): Promise<DbMonthlyRecord[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/monthly_records/list", params);
  return rows.map(mapMonthlyRecord);
}

export const fetchMonthlyLedgers = async (monthYear?: string): Promise<DbMonthlyLedger[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (monthYear) params.month_year = monthYear;
  const rows = await items<any>("/api/hr/payroll/ledgers/list", params);
  return rows.map(mapMonthlyLedger);
}

export const fetchShifts = async (): Promise<DbShift[]> => {
  const rows = await items<any>("/api/hr/shifts/list", { limit: 200 });
  return rows.map(mapShift);
}

export const fetchPositions = async (): Promise<DbPosition[]> => {
  const rows = await items<any>("/api/hr/designations/list", { limit: 200 });
  return rows.map(mapPosition);
}

export const fetchShiftAssignments = async (): Promise<DbEmployeeShiftAssignment[]> => {
  const rows = await items<any>("/api/hr/shift_assignments/list", { active_only: true, limit: 500 });
  return rows.map(mapShiftAssignment);
}

export const fetchModules = async (): Promise<DbSystemModule[]> => {
  const rows = await items<any>("/api/hr/modules/list");
  return rows.map(mapModule);
}

export const fetchConfigs = async (): Promise<DbConfiguration[]> => {
  const rows = await items<any>("/api/hr/configs/list");
  return rows.map(mapConfig);
}

export const fetchHolidays = async (year?: number): Promise<DbPublicHoliday[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (year) params.year = year;
  const rows = await items<any>("/api/hr/holidays/list", params);
  return rows.map(mapHoliday);
}

export const fetchLeaveTypes = async (): Promise<DbLeaveType[]> => {
  const rows = await items<any>("/api/hr/leave/types");
  return rows.map(mapLeaveType);
}

export const createLeaveType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/leave/types/create", payload);
}

export const updateLeaveType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/leave/types/${eid(typeId)}/update`, payload);
}

export const deleteLeaveType = async (typeId: string | number) => {
  return hrCall(`/api/hr/leave/types/${eid(typeId)}/delete`, {});
}

export const createDocumentType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/document_types/create", payload);
}

export const updateDocumentType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/document_types/${eid(typeId)}/update`, payload);
}

export const deleteDocumentType = async (typeId: string | number) => {
  return hrCall(`/api/hr/document_types/${eid(typeId)}/delete`, {});
}

export const fetchLeavePolicies = async (): Promise<DbLeavePolicy[]> => {
  const rows = await items<any>("/api/hr/leave/policies/list");
  return rows.map(mapLeavePolicy);
}

export const fetchLeaveRequests = async (filters?: {
  employeeId?: string;
  status?: string;
  month?: string;
}): Promise<DbLeaveRequest[]> => {
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

export const fetchLeaveBalances = async (year?: number): Promise<DbLeaveBalance[]> => {
  const params: Record<string, unknown> = {};
  if (year) params.year = year;
  const data = await hrCall<any>("/api/hr/leave/balances", params);
  const rows = Array.isArray(data) ? data : data?.items || data?.balances || [];
  return rows.map(mapLeaveBalance);
}

export const fetchLeavePermissions = async (employeeId?: string): Promise<DbLeavePermission[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/leave/permissions/list", params);
  return rows.map(mapLeavePermission);
}

export const fetchAllowanceTypes = async (): Promise<DbAllowanceType[]> => {
  const rows = await items<any>("/api/hr/payroll/allowance_types/list");
  return rows.map(mapAllowanceType);
}

export const fetchEmployeeAllowances = async (employeeId?: string): Promise<DbEmployeeAllowance[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_allowances/list", params);
  return rows.map(mapEmployeeAllowance);
}

export const fetchDeductionTypes = async (): Promise<DbDeductionType[]> => {
  const rows = await items<any>("/api/hr/payroll/deduction_types/list");
  return rows.map(mapDeductionType);
}

export const fetchEmployeeDeductions = async (employeeId?: string): Promise<DbEmployeeDeduction[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_deductions/list", params);
  return rows.map(mapEmployeeDeduction);
}

export const fetchDocumentTypes = async (): Promise<DbDocumentType[]> => {
  const rows = await items<any>("/api/hr/document_types/list");
  return rows.map(mapDocumentType);
}

export const fetchDocuments = async (employeeId?: string): Promise<DbEmployeeDocument[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/documents/list", params);
  return rows.map(mapDocument);
}

export const fetchDevices = async (): Promise<any[]> => {
  return items<any>("/api/hr/devices/list", { limit: 100 });
}

// ─── Write helpers (P0 cutover) ───────────────────────────────────────

function eid(id: string | number): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error(`Invalid id: ${id}`);
  return n;
}

/** Convert "HH:MM" or "HH:MM:SS" → float hours for Odoo. */
export const timeToFloat = (t: string | number | null | undefined): number => {
  if (typeof t === "number") return t;
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) + ((m || 0) / 60);
}

export const createEmployee = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/employees/create", payload);
}

export const updateEmployee = async (employeeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/update`, payload);
}

export const setEmployeeStatus = async (employeeId: string | number, status: string) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/set_status`, { status });
}

export const excuseAttendance = async (payload: {
  attendance_id?: string | number;
  employee_id?: string | number;
  date?: string;
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
  excuse_note?: string | null;
}) => {
  const params: Record<string, unknown> = { ...payload };
  if (payload.attendance_id != null) params.attendance_id = eid(payload.attendance_id);
  if (payload.employee_id != null) params.employee_id = eid(payload.employee_id);
  return hrCall("/api/hr/attendance/excuse", params);
}

export const upsertAttendance = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/attendance/upsert", params);
}

export const importAttendance = async (records: Record<string, unknown>[]) => {
  return hrCall("/api/hr/attendance/import", { records });
}

export const requestLeave = async (payload: {
  leave_type_id: string | number;
  date_from: string;
  date_to?: string;
  reason?: string | null;
  half_day?: boolean;
  employee_id?: string | number;
}) => {
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

export const managerApproveLeave = async (leaveId: string | number) => {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/manager_approve`, {});
}

export const hrApproveLeave = async (leaveId: string | number) => {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/hr_approve`, {});
}

export const refuseLeave = async (leaveId: string | number, reason?: string | null) => {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/refuse`, { reason: reason || "" });
}

export const cancelLeave = async (leaveId: string | number) => {
  return hrCall(`/api/hr/leave/${eid(leaveId)}/cancel`, {});
}

export const createLeavePermission = async (payload: {
  employee_id: string | number;
  date: string;
  start_time: string | number;
  end_time: string | number;
  hours?: number;
  reason?: string | null;
}) => {
  return hrCall("/api/hr/leave/permissions/create", {
    employee_id: eid(payload.employee_id),
    date: payload.date,
    start_time: timeToFloat(payload.start_time),
    end_time: timeToFloat(payload.end_time),
    hours: payload.hours ?? Math.abs(timeToFloat(payload.end_time) - timeToFloat(payload.start_time)),
    reason: payload.reason || "",
  });
}

export const updateLeavePermission = async (
  permissionId: string | number,
  status: "approved" | "refused" | "pending" | string,
) => {
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

export const upsertMonthlyRecord = async (payload: {
  employee_id: string | number;
  month_year: string;
  salary_calculation?: unknown;
}) => {
  return hrCall("/api/hr/payroll/monthly_records/upsert", {
    employee_id: eid(payload.employee_id),
    month_year: payload.month_year,
    salary_calculation: payload.salary_calculation || {},
  });
}

export const upsertMonthlyLedger = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/payroll/ledgers/upsert", params);
}

export const generatePayslips = async (payload: {
  month: string;
  payslips: Record<string, unknown>[];
  replace_month?: boolean;
}) => {
  return hrCall("/api/hr/payroll/payslips/generate", {
    month: payload.month,
    payslips: payload.payslips.map((p) => ({
      ...p,
      employee_id: eid(p.employee_id as string | number),
    })),
    replace_month: Boolean(payload.replace_month),
  });
}

export const createShift = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/shifts/create", payload);
}

export const updateShift = async (shiftId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/update`, payload);
}

export const deleteShift = async (shiftId: string | number) => {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/delete`, {});
}

export const createShiftAssignment = async (payload: {
  employee_id: string | number;
  shift_id: string | number;
  start_date?: string;
  end_date?: string | null;
  set_employee_default?: boolean;
}) => {
  return hrCall("/api/hr/shift_assignments/create", {
    employee_id: eid(payload.employee_id),
    shift_id: eid(payload.shift_id),
    start_date: payload.start_date || new Date().toISOString().slice(0, 10),
    end_date: payload.end_date || false,
    set_employee_default: payload.set_employee_default !== false,
  });
}

export const updateConfig = async (configId: string | number, config_value: unknown) => {
  return hrCall("/api/hr/configs/update", {
    config_id: eid(configId),
    config_value,
  });
}

export const updateModule = async (moduleId: string | number, is_enabled: boolean) => {
  return hrCall("/api/hr/modules/update", {
    module_id: eid(moduleId),
    is_enabled,
  });
}

export const createHoliday = async (payload: {
  name_ar?: string;
  name?: string;
  date: string;
}) => {
  return hrCall("/api/hr/holidays/create", {
    name: payload.name_ar || payload.name,
    name_ar: payload.name_ar,
    date: payload.date,
  });
}

export const deleteHoliday = async (holidayId: string | number) => {
  return hrCall(`/api/hr/holidays/${eid(holidayId)}/delete`, {});
}

export const updateDepartment = async (
  departmentId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/departments/${eid(departmentId)}/update`, payload);
}

export const createDepartment = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/departments/create", payload);
}

export const createDesignation = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/designations/create", payload);
}

export const updateDesignation = async (jobId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/designations/${eid(jobId)}/update`, payload);
}

export const deleteDesignation = async (jobId: string | number) => {
  return hrCall(`/api/hr/designations/${eid(jobId)}/delete`, {});
}

export const createDocument = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.document_type_id != null) {
    params.document_type_id = eid(params.document_type_id as string | number);
  }
  return hrCall("/api/hr/documents/create", params);
}

export const updateDocument = async (documentId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/documents/${eid(documentId)}/update`, payload);
}

export const deleteDocument = async (documentId: string | number) => {
  return hrCall(`/api/hr/documents/${eid(documentId)}/delete`, {});
}

export const linkEmployeesToUsers = async (dry_run = true, employee_ids?: number[]) => {
  return hrCall("/api/hr/employees/link_users", { dry_run, employee_ids });
}

// ─── Slice A: Lifecycle (contracts / exit / custodies) ───────────────

export const fetchContractTypes = async (): Promise<DbContractType[]> => {
  const rows = await items<any>("/api/hr/contract_types/list", { active_only: true });
  return rows.map(mapContractType);
}

export const createContractType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/contract_types/create", payload);
}

export const updateContractType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/contract_types/${eid(typeId)}/update`, payload);
}

export const deleteContractType = async (typeId: string | number) => {
  return hrCall(`/api/hr/contract_types/${eid(typeId)}/delete`, {});
}

export const fetchContracts = async (employeeId?: string | number): Promise<DbEmployeeContract[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/contracts/list", params);
  return rows.map(mapEmployeeContract);
}

export const createContract = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/contracts/create", params);
}

export const updateContract = async (contractId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/contracts/${eid(contractId)}/update`, payload);
}

export const deleteContract = async (contractId: string | number) => {
  return hrCall(`/api/hr/contracts/${eid(contractId)}/delete`, {});
}

export const fetchExitChecklistItems = async (): Promise<DbExitChecklistItem[]> => {
  const rows = await items<any>("/api/hr/exit/checklist_items/list", { active_only: true });
  return rows.map(mapExitChecklistItem);
}

export const fetchExitProcesses = async (
  employeeId?: string | number,
): Promise<{ processes: DbExitProcess[]; checklist: DbExitChecklist[] }> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/exit/list", params);
  const processes = rows.map(mapExitProcess);
  const checklist: DbExitChecklist[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.checklist)) {
      checklist.push(...r.checklist.map(mapExitChecklistLine));
    }
  }
  return { processes, checklist };
}

export const createExitProcess = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/exit/create", params);
}

export const updateExitProcess = async (exitId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/exit/${eid(exitId)}/update`, payload);
}

export const updateExitChecklistLine = async (lineId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/exit/checklist/${eid(lineId)}/update`, payload);
}

export const fetchCustodies = async (employeeId?: string | number): Promise<any[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return items<any>("/api/hr/custodies/list", params);
}

export const createCustody = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/custodies/create", params);
}

export const updateCustody = async (custodyId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/custodies/${eid(custodyId)}/update`, payload);
}

export const deleteCustody = async (custodyId: string | number) => {
  return hrCall(`/api/hr/custodies/${eid(custodyId)}/delete`, {});
}

// ─── Slice A: Warnings ────────────────────────────────────────────────

export const fetchWarnings = async (employeeId?: string | number): Promise<DbWarning[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/warnings/list", params);
  return rows.map(mapWarning);
}

export const createWarning = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/warnings/create", params);
}

export const updateWarning = async (warningId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/warnings/${eid(warningId)}/update`, payload);
}

export const deleteWarning = async (warningId: string | number) => {
  return hrCall(`/api/hr/warnings/${eid(warningId)}/delete`, {});
}

// ─── Slice A: Notifications ───────────────────────────────────────────

export const fetchNotifications = async (includeDismissed = false): Promise<DbNotification[]> => {
  const rows = await items<any>("/api/hr/notifications/list", {
    include_dismissed: includeDismissed,
    limit: 200,
  });
  return rows.map(mapNotification);
}

export const createNotification = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/notifications/create", payload);
}

export const markNotificationRead = async (notificationId: string | number) => {
  return hrCall(`/api/hr/notifications/${eid(notificationId)}/mark_read`, {});
}

export const dismissNotification = async (notificationId: string | number) => {
  return hrCall(`/api/hr/notifications/${eid(notificationId)}/dismiss`, {});
}

export const markAllNotificationsRead = async () => {
  return hrCall("/api/hr/notifications/mark_all_read", {});
}

// ─── Slice A: Audit log ───────────────────────────────────────────────

export const fetchAuditLog = async (filters?: {
  entityType?: string;
  action?: string;
  entityId?: string | number;
}): Promise<DbAuditLog[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.entityType) params.entity_type = filters.entityType;
  if (filters?.action) params.action = filters.action;
  if (filters?.entityId != null) params.entity_id = filters.entityId;
  const rows = await items<any>("/api/hr/audit/list", params);
  return rows.map(mapAuditLog);
}

export const createAuditLog = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/audit/create", payload);
}

// ─── Slice B: Evaluations ─────────────────────────────────────────────

export const fetchEvaluations = async (employeeId?: string | number): Promise<DbEvaluation[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/evaluations/list", params);
  return rows.map(mapEvaluation);
}

export const fetchEvaluationCriteria = async (): Promise<DbEvaluationCriteria[]> => {
  // Criteria are embedded in evaluations/list responses; provided for API parity.
  const rows = await items<any>("/api/hr/evaluations/list", { limit: 500 });
  const criteria: DbEvaluationCriteria[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.criteria)) {
      criteria.push(...r.criteria.map(mapEvaluationCriterion));
    }
  }
  return criteria;
}

export const fetchEvaluationsWithCriteria = async (
  employeeId?: string | number,
): Promise<{ evaluations: DbEvaluation[]; criteria: DbEvaluationCriteria[] }> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/evaluations/list", params);
  const evaluations = rows.map(mapEvaluation);
  const criteria: DbEvaluationCriteria[] = [];
  for (const r of rows as any[]) {
    if (Array.isArray(r.criteria)) {
      criteria.push(...r.criteria.map(mapEvaluationCriterion));
    }
  }
  return { evaluations, criteria };
}

export const createEvaluation = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/evaluations/create", params);
}

export const updateEvaluation = async (evaluationId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/evaluations/${eid(evaluationId)}/update`, payload);
}

export const deleteEvaluation = async (evaluationId: string | number) => {
  return hrCall(`/api/hr/evaluations/${eid(evaluationId)}/delete`, {});
}

// ─── Slice B: Policies ────────────────────────────────────────────────

export const fetchPolicies = async (): Promise<DbPolicy[]> => {
  const rows = await items<any>("/api/hr/policies/list", { limit: 200 });
  return rows.map(mapPolicy);
}

export const createPolicy = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/policies/create", payload);
}

export const updatePolicy = async (policyId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/policies/${eid(policyId)}/update`, payload);
}

export const deletePolicy = async (policyId: string | number) => {
  return hrCall(`/api/hr/policies/${eid(policyId)}/delete`, {});
}

// ─── Slice B: Training ────────────────────────────────────────────────

export const fetchTrainingPrograms = async (): Promise<DbTrainingProgram[]> => {
  const rows = await items<any>("/api/hr/training/programs/list", { limit: 200 });
  return rows.map(mapTrainingProgram);
}

export const createTrainingProgram = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/training/programs/create", payload);
}

export const updateTrainingProgram = async (programId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/training/programs/${eid(programId)}/update`, payload);
}

export const deleteTrainingProgram = async (programId: string | number) => {
  return hrCall(`/api/hr/training/programs/${eid(programId)}/delete`, {});
}

export const fetchTrainingParticipants = async (
  programId?: string | number,
): Promise<DbTrainingParticipant[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (programId) params.program_id = eid(programId);
  const rows = await items<any>("/api/hr/training/participants/list", params);
  return rows.map(mapTrainingParticipant);
}

export const createTrainingParticipant = async (payload: {
  training_program_id: string | number;
  employee_id: string | number;
  completion_status?: string;
  score?: number | null;
}) => {
  return hrCall("/api/hr/training/participants/create", {
    program_id: eid(payload.training_program_id),
    employee_id: eid(payload.employee_id),
    completion_status: payload.completion_status,
    score: payload.score,
  });
}

export const updateTrainingParticipant = async (
  participantId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/training/participants/${eid(participantId)}/update`, payload);
}

export const deleteTrainingParticipant = async (participantId: string | number) => {
  return hrCall(`/api/hr/training/participants/${eid(participantId)}/delete`, {});
}

// ─── Slice C: Recruitment ─────────────────────────────────────────────

export const fetchJobOpenings = async (): Promise<DbJobOpening[]> => {
  const rows = await items<any>("/api/hr/jobs/list", { limit: 200 });
  return rows.map(mapJobOpening);
}

export const createJobOpening = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/jobs/create", payload);
}

export const updateJobOpening = async (jobId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/jobs/${eid(jobId)}/update`, payload);
}

export const deleteJobOpening = async (jobId: string | number) => {
  return hrCall(`/api/hr/jobs/${eid(jobId)}/delete`, {});
}

export const fetchApplicants = async (jobOpeningId?: string | number): Promise<DbApplicant[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (jobOpeningId) params.job_opening_id = eid(jobOpeningId);
  const rows = await items<any>("/api/hr/applicants/list", params);
  return rows.map(mapApplicant);
}

export const createApplicant = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.job_opening_id != null) {
    params.job_opening_id = eid(params.job_opening_id as string | number);
  }
  return hrCall("/api/hr/applicants/create", params);
}

export const updateApplicant = async (applicantId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/update`, payload);
}

export const deleteApplicant = async (applicantId: string | number) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/delete`, {});
}

export const uploadApplicantResume = async (
  applicantId: string | number,
  fileDataBase64: string,
  fileName?: string,
) => {
  return hrCall(`/api/hr/applicants/${eid(applicantId)}/upload_resume`, {
    file_data: fileDataBase64,
    file_name: fileName,
  });
}

/**
 * Download an applicant's CV.
 *
 * The attachment is private and we authenticate with a JWT, so a plain
 * `<a href="/web/content/...">` cannot work — the browser sends no auth on a
 * link navigation. Fetch the bytes through the authenticated API instead and
 * hand the browser a Blob.
 */
export const downloadApplicantResume = async (applicantId: string | number) => {
  const res = await hrCall<{
    file_name: string;
    mimetype: string;
    file_data: string;
  }>(`/api/hr/applicants/${eid(applicantId)}/resume`, {});

  const binary = atob(res.file_data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const url = URL.createObjectURL(new Blob([bytes], { type: res.mimetype }));
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = res.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoke on the next tick — revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

// ─── AI resume screening / Initial Rating ─────────────────────────────

/** Queue (or with `sync`, immediately run) the AI screening for one applicant. */
export const screenApplicant = async (
  applicantId: string | number,
  options: { force?: boolean; sync?: boolean } = {},
): Promise<DbApplicant> => {
  const row = await hrCall<any>(`/api/hr/applicants/${eid(applicantId)}/screen`, {
    force: Boolean(options.force),
    sync: Boolean(options.sync),
  });
  return mapApplicant(row);
}

export const fetchApplicantScreening = async (applicantId: string | number): Promise<{
  applicant: DbApplicant;
  parsed_profile: Record<string, unknown>;
  runs: ScreeningRun[];
}> => {
  const data = await hrCall<any>(`/api/hr/applicants/${eid(applicantId)}/screening`, {});
  return {
    applicant: mapApplicant(data.applicant || {}),
    parsed_profile: data.parsed_profile || {},
    runs: (data.runs || []) as ScreeningRun[],
  };
}

export const bulkScreenApplicants = async (params: {
  applicantIds?: Array<string | number>;
  jobOpeningId?: string | number;
  force?: boolean;
}): Promise<{ queued: number; skipped: number }> => {
  return hrCall("/api/hr/applicants/bulk_screen", {
    applicant_ids: params.applicantIds?.map(eid),
    job_opening_id: params.jobOpeningId != null ? eid(params.jobOpeningId) : undefined,
    force: Boolean(params.force),
  });
}

export const fetchJobRanking = async (
  jobId: string | number,
  params: { minIr?: number; stage?: string } = {},
): Promise<{ job: DbJobOpening; items: DbApplicant[]; stats: JobRankingStats }> => {
  const data = await hrCall<any>(`/api/hr/jobs/${eid(jobId)}/ranking`, {
    limit: 200,
    min_ir: params.minIr,
    stage: params.stage,
  });
  return {
    job: mapJobOpening(data.job || {}),
    items: (data.items || []).map((row: any) => ({
      ...mapApplicant(row),
      rank: row.rank ?? null,
    })),
    stats: data.stats as JobRankingStats,
  };
}

export const getJobApplyLink = async (
  jobId: string | number,
  params: { rotate?: boolean; expires_on?: string | null; max_submissions?: number; active?: boolean } = {},
): Promise<ApplicationLink> => {
  return hrCall<ApplicationLink>(`/api/hr/jobs/${eid(jobId)}/apply_link`, params);
}

export const fetchApplicationLinks = async (jobOpeningId?: string | number): Promise<ApplicationLink[]> => {
  return items<ApplicationLink>("/api/hr/recruitment/links/list", {
    limit: 200,
    job_opening_id: jobOpeningId != null ? eid(jobOpeningId) : undefined,
  });
}

export const updateApplicationLink = async (
  linkId: string | number,
  payload: Record<string, unknown>,
): Promise<ApplicationLink> => {
  return hrCall<ApplicationLink>(`/api/hr/recruitment/links/${eid(linkId)}/update`, payload);
}

export const deleteApplicationLink = async (linkId: string | number) => {
  return hrCall(`/api/hr/recruitment/links/${eid(linkId)}/delete`, {});
}

export const fetchScreeningSettings = async (): Promise<ScreeningSettings> => {
  return hrCall<ScreeningSettings>("/api/hr/recruitment/screening_settings", {});
}

export const updateScreeningSettings = async (
  payload: Partial<{
    weights: Record<string, number>;
    min_confidence: number;
    retention_months: number;
    max_resume_mb: number;
    model: string;
  }>,
): Promise<ScreeningSettings> => {
  return hrCall<ScreeningSettings>("/api/hr/recruitment/screening_settings/update", payload);
}

export interface ScreeningRun {
  id: number;
  model_name: string;
  prompt_version: string;
  ir_score: number;
  confidence: number;
  prompt_tokens: number;
  output_tokens: number;
  latency_ms: number;
  used_vision: boolean;
  state: string;
  error: string;
  created_at: string;
}

export interface ScreeningSettings {
  weights: Record<string, number>;
  default_weights: Record<string, number>;
  min_confidence: number;
  retention_months: number;
  max_resume_mb: number;
  model: string;
  api_key_configured: boolean;
  prompt_version: string;
  runs_total: number;
  runs_failed: number;
}

// ─── Slice C: Loans ───────────────────────────────────────────────────

export const fetchLoans = async (employeeId?: string | number): Promise<DbLoan[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/payroll/loans/list", params);
  return rows.map(mapLoan);
}

export const createLoan = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/payroll/loans/create", params);
}

export const updateLoan = async (loanId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/loans/${eid(loanId)}/update`, payload);
}

export const deleteLoan = async (loanId: string | number) => {
  return hrCall(`/api/hr/payroll/loans/${eid(loanId)}/delete`, {});
}

// ─── Slice D: Reports ─────────────────────────────────────────────────

export const fetchReportTemplates = async (): Promise<DbReportTemplate[]> => {
  const rows = await items<any>("/api/hr/reports/templates/list", { active_only: true });
  return rows.map(mapReportTemplate);
}

export const createReportTemplate = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/reports/templates/create", payload);
}

export const updateReportTemplate = async (templateId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/reports/templates/${eid(templateId)}/update`, payload);
}

export const deleteReportTemplate = async (templateId: string | number) => {
  return hrCall(`/api/hr/reports/templates/${eid(templateId)}/delete`, {});
}

export const fetchReportHistory = async (templateId?: string | number): Promise<DbReportHistory[]> => {
  const params: Record<string, unknown> = { limit: 100 };
  if (templateId) params.report_template_id = eid(templateId);
  const rows = await items<any>("/api/hr/reports/history/list", params);
  return rows.map(mapReportHistory);
}

export const createReportHistory = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.report_template_id != null) {
    params.report_template_id = eid(params.report_template_id as string | number);
  }
  return hrCall("/api/hr/reports/history/create", params);
}

// ─── Slice D: Payroll catalog writes (allowances / deductions) ───────

export const createAllowanceType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/payroll/allowance_types/create", payload);
}

export const updateAllowanceType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/allowance_types/${eid(typeId)}/update`, payload);
}

export const deleteAllowanceType = async (typeId: string | number) => {
  return hrCall(`/api/hr/payroll/allowance_types/${eid(typeId)}/delete`, {});
}

export const createEmployeeAllowance = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.allowance_type_id != null) {
    params.allowance_type_id = eid(params.allowance_type_id as string | number);
  }
  return hrCall("/api/hr/payroll/employee_allowances/create", params);
}

export const updateEmployeeAllowance = async (allowanceId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/employee_allowances/${eid(allowanceId)}/update`, payload);
}

export const deleteEmployeeAllowance = async (allowanceId: string | number) => {
  return hrCall(`/api/hr/payroll/employee_allowances/${eid(allowanceId)}/delete`, {});
}

export const createDeductionType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/payroll/deduction_types/create", payload);
}

export const updateDeductionType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/deduction_types/${eid(typeId)}/update`, payload);
}

export const deleteDeductionType = async (typeId: string | number) => {
  return hrCall(`/api/hr/payroll/deduction_types/${eid(typeId)}/delete`, {});
}

export const createEmployeeDeduction = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.deduction_type_id != null) {
    params.deduction_type_id = eid(params.deduction_type_id as string | number);
  }
  return hrCall("/api/hr/payroll/employee_deductions/create", params);
}

export const updateEmployeeDeduction = async (deductionId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/employee_deductions/${eid(deductionId)}/update`, payload);
}

export const deleteEmployeeDeduction = async (deductionId: string | number) => {
  return hrCall(`/api/hr/payroll/employee_deductions/${eid(deductionId)}/delete`, {});
}

// ─── Slice D: Leave policy CRUD ───────────────────────────────────────

export const createLeavePolicy = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.leave_type_id != null) params.leave_type_id = eid(params.leave_type_id as string | number);
  return hrCall("/api/hr/leave/policies/create", params);
}

export const updateLeavePolicy = async (policyId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/leave/policies/${eid(policyId)}/update`, payload);
}

export const deleteLeavePolicy = async (policyId: string | number) => {
  return hrCall(`/api/hr/leave/policies/${eid(policyId)}/delete`, {});
}

// ─── Slice F: Devices process / Issues / Approvals / Currency / Trends ─

export const syncDevices = async (deviceId?: string | number, processEvents = true) => {
  const params: Record<string, unknown> = { process_events: processEvents };
  if (deviceId != null) params.device_id = eid(deviceId);
  return hrCall("/api/hr/devices/sync", params);
}

export const processDeviceEvents = async (deviceId?: string | number, limit = 500) => {
  const params: Record<string, unknown> = { limit };
  if (deviceId != null) params.device_id = eid(deviceId);
  return hrCall("/api/hr/devices/events/process", params);
}

export const createDeviceEvent = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/devices/events/create", payload);
}

/** Raw punch ledger (lugal.hr.device.event). */
export const fetchDeviceEvents = async (filters?: {
  deviceId?: string | number;
  employeeNo?: string;
  dateFrom?: string;
  dateTo?: string;
  processed?: boolean;
  limit?: number;
}): Promise<any[]> => {
  const params: Record<string, unknown> = {
    limit: filters?.limit ?? 2000,
    offset: 0,
  };
  if (filters?.deviceId != null) params.device_id = eid(filters.deviceId);
  if (filters?.employeeNo) params.employee_no = filters.employeeNo;
  if (filters?.dateFrom) params.date_from = filters.dateFrom;
  if (filters?.dateTo) params.date_to = filters.dateTo;
  if (filters?.processed !== undefined) params.processed = filters.processed;
  return items<any>("/api/hr/devices/events/list", params);
}

export const fetchAttendanceTrends = async (params?: {
  employeeId?: string | number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const body: Record<string, unknown> = {};
  if (params?.employeeId != null) body.employee_id = eid(params.employeeId);
  if (params?.dateFrom) body.date_from = params.dateFrom;
  if (params?.dateTo) body.date_to = params.dateTo;
  return hrCall("/api/hr/attendance/trends", body);
}

export const fetchIssues = async (filters?: {
  employeeId?: string | number;
  state?: string;
  category?: string;
}): Promise<any[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.employeeId != null) params.employee_id = eid(filters.employeeId);
  if (filters?.state) params.state = filters.state;
  if (filters?.category) params.category = filters.category;
  const rows = await items<any>("/api/hr/issues/list", params);
  return rows.map(mapIssue);
}

export const createIssue = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/issues/create", params);
}

export const updateIssue = async (issueId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/issues/${eid(issueId)}/update`, payload);
}

export const resolveIssue = async (
  issueId: string | number,
  resolution_note?: string,
  state = "resolved",
) => {
  return hrCall(`/api/hr/issues/${eid(issueId)}/resolve`, { resolution_note, state });
}

export const fetchApprovalWorkflows = async (entityType = "leave_request"): Promise<any[]> => {
  const data = await hrCall<{ items?: any[] }>("/api/hr/approvals/workflows/list", {
    entity_type: entityType,
    active_only: true,
  });
  const rows = data?.items || [];
  return rows.map(mapApprovalWorkflow);
}

export const createApprovalWorkflow = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/approvals/workflows/create", payload);
}

export const updateApprovalWorkflow = async (
  workflowId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/approvals/workflows/${eid(workflowId)}/update`, payload);
}

export const fetchApprovalRequests = async (filters?: {
  entityType?: string;
  status?: string;
  mineOnly?: boolean;
}): Promise<any[]> => {
  const params: Record<string, unknown> = {
    status: filters?.status || "pending",
    limit: 200,
  };
  if (filters?.entityType) params.entity_type = filters.entityType;
  if (filters?.mineOnly) params.mine_only = true;
  const rows = await items<any>("/api/hr/approvals/requests/list", params);
  return rows.map(mapApprovalRequest);
}

export const approveApprovalRequest = async (requestId: string | number, comment?: string) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/approve`, { comment });
}

export const rejectApprovalRequest = async (requestId: string | number, comment?: string) => {
  return hrCall(`/api/hr/approvals/requests/${eid(requestId)}/reject`, { comment });
}

export const fetchCurrencies = async () => {
  return hrCall("/api/hr/currencies/list", {});
}

export const fetchCurrencyRates = async (filters?: {
  currencyFrom?: string;
  currencyTo?: string;
}) => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.currencyFrom) params.currency_from = filters.currencyFrom;
  if (filters?.currencyTo) params.currency_to = filters.currencyTo;
  return items<any>("/api/hr/currency_rates/list", params);
}

export const createCurrencyRate = async (payload: {
  currency_from: string;
  currency_to: string;
  rate: number;
  rate_date?: string;
  note?: string;
}) => {
  return hrCall("/api/hr/currency_rates/create", payload);
}

export const convertCurrency = async (payload: {
  amount: number;
  currency_from: string;
  currency_to: string;
  rate_date?: string;
}) => {
  return hrCall("/api/hr/currency_rates/convert", payload);
}
