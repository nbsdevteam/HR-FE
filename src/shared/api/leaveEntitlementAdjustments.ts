/**
 * Additional Annual Leave grants (backend `lugal_hr` v1.17.0 §3) — the
 * employee-specific top-up HR/Admin records on top of the Settings base
 * entitlement. Split out of `leave.ts` so neither file outgrows the
 * 300-line limit.
 */
import { hrCall } from "./client";
import { mapLeaveEntitlementAdjustment } from "./mappers";
import type { DbLeaveEntitlementAdjustment } from "../hooks";
import { eid, items } from "./httpHelpers";

export const fetchLeaveEntitlementAdjustments = async (filters?: {
  employeeId?: string | number;
  leaveTypeId?: string | number;
  includeInactive?: boolean;
}): Promise<DbLeaveEntitlementAdjustment[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.employeeId != null && filters.employeeId !== "")
    params.employee_id = eid(filters.employeeId);
  if (filters?.leaveTypeId != null && filters.leaveTypeId !== "")
    params.leave_type_id = eid(filters.leaveTypeId);
  if (filters?.includeInactive) params.include_inactive = true;
  const rows = await items<unknown>(
    "/api/hr/leave/entitlement-adjustments/list",
    params,
  );
  return rows.map(mapLeaveEntitlementAdjustment);
};

/** HR/Admin-only (`hr.leave.manage_types`) — backend answers `Forbidden` otherwise. */
export const createLeaveEntitlementAdjustment = async (payload: {
  employee_id: string | number;
  leave_type_id: string | number;
  additional_days: number;
  reason: string;
  effective_date?: string;
}): Promise<DbLeaveEntitlementAdjustment> => {
  const data = await hrCall<unknown>("/api/hr/leave/entitlement-adjustments/create", {
    employee_id: eid(payload.employee_id),
    leave_type_id: eid(payload.leave_type_id),
    additional_days: payload.additional_days,
    reason: payload.reason,
    ...(payload.effective_date ? { effective_date: payload.effective_date } : {}),
  });
  return mapLeaveEntitlementAdjustment(data);
};

/** Voids a grant — archives its funding allocation but keeps the row for audit history. */
export const deactivateLeaveEntitlementAdjustment = (id: string | number) => {
  return hrCall(`/api/hr/leave/entitlement-adjustments/${eid(id)}/deactivate`, {});
};
