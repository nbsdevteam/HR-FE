import { hrCall } from "./client";
import {
  mapLeaveType,
  mapLeavePolicy,
  mapLeaveRequest,
  mapLeaveBalance,
  mapLeavePermission,
} from "./mappers";
import type {
  DbEmployee,
  DbLeaveType,
  DbLeavePolicy,
  DbLeaveRequest,
  DbLeaveBalance,
  DbLeavePermission,
} from "../hooks";
import { eid } from "./httpHelpers";
import { crudFactory, fetchList, withEid } from "./crud";
import { fetchEmployees, fetchCurrentEmployee } from "./core";
import { timeToFloat } from "./attendance";

const leaveTypes = crudFactory("/api/hr/leave/types");
const leavePolicies = crudFactory("/api/hr/leave/policies");

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

export const fetchLeaveTypes = (): Promise<DbLeaveType[]> =>
  fetchList("/api/hr/leave/types", mapLeaveType);

export const createLeaveType = leaveTypes.create;
export const updateLeaveType = leaveTypes.update;
export const deleteLeaveType = leaveTypes.remove;

export const fetchLeavePolicies = (): Promise<DbLeavePolicy[]> =>
  fetchList("/api/hr/leave/policies/list", mapLeavePolicy);

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
  const mapped = await fetchList("/api/hr/leave/list", mapLeaveRequest, params);
  if (filters?.status) {
    return mapped.filter((r) => r.status === filters.status || r.status.includes(filters.status!));
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

export const fetchLeavePermissions = (employeeId?: string): Promise<DbLeavePermission[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  return fetchList("/api/hr/leave/permissions/list", mapLeavePermission, params);
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

export const createLeavePolicy = (payload: Record<string, unknown>) =>
  leavePolicies.create(withEid(payload, ["leave_type_id"]));

export const updateLeavePolicy = leavePolicies.update;
export const deleteLeavePolicy = leavePolicies.remove;
