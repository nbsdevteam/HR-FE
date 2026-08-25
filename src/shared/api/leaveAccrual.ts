/**
 * Accrual + probation reads (backend `lugal_hr` v1.12.9). Split out of
 * `leave.ts` so neither file outgrows the 300-line limit.
 */
import { hrCall } from "./client";
import { mapLeaveBalance, mapLeaveBalanceSummary, mapLeaveAccrualHistory } from "./mappers";
import type { DbLeaveBalance, DbLeaveBalanceSummary, DbLeaveAccrualHistory } from "../hooks";
import { eid } from "./httpHelpers";

/**
 * Full `/api/hr/leave/balances` envelope — per-type accrual figures plus the
 * employee's probation window (backend v1.12.9 §1).
 *
 * `employee_id` is only sent when a caller explicitly asks for someone else:
 * reading another employee additionally requires `hr.leave.team_approve`, so an
 * agent with only `hr.leave.own` must omit the param to get their own balances.
 */
export const fetchLeaveBalanceSummary = async (
  employeeId?: string | number,
  year?: number,
): Promise<DbLeaveBalanceSummary> => {
  const params: Record<string, unknown> = {};
  if (employeeId != null && employeeId !== "") params.employee_id = eid(employeeId);
  if (year) params.year = year;
  const data = await hrCall<any>("/api/hr/leave/balances", params);
  return mapLeaveBalanceSummary(data);
};

/**
 * Monthly accrual grants behind the `accrued` figure (backend §2). One row per
 * completed month of service, newest period first.
 */
export const fetchLeaveAccruals = async (filters?: {
  employeeId?: string | number;
  leaveTypeId?: string | number;
  limit?: number;
}): Promise<DbLeaveAccrualHistory> => {
  const params: Record<string, unknown> = {};
  if (filters?.employeeId != null && filters.employeeId !== "")
    params.employee_id = eid(filters.employeeId);
  if (filters?.leaveTypeId != null && filters.leaveTypeId !== "")
    params.leave_type_id = eid(filters.leaveTypeId);
  // Backend default is 100, hard max 500.
  if (filters?.limit) params.limit = Math.min(filters.limit, 500);
  const data = await hrCall<any>("/api/hr/leave/accruals", params);
  return mapLeaveAccrualHistory(data);
};

export const fetchLeaveBalances = async (
  year?: number,
): Promise<DbLeaveBalance[]> => {
  const params: Record<string, unknown> = {};
  if (year) params.year = year;
  const data = await hrCall<any>("/api/hr/leave/balances", params);
  const rows = Array.isArray(data) ? data : data?.items || data?.balances || [];
  // `employee_id` sits on the envelope, not on each item — stamp it onto the
  // rows so callers can still group balances by employee.
  return rows.map((row: any) =>
    mapLeaveBalance({ employee_id: data?.employee_id, year, ...row }),
  );
};
