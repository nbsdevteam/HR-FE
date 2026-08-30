/**
 * Additional Annual Leave grants — the employee-specific top-up on the
 * Settings base entitlement (backend `lugal_hr` v1.17.0 §3). Split out of
 * `leave.ts` so neither file outgrows the 300-line limit.
 */
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

/** One `/entitlement-adjustments/list` row — a single grant of extra days. */
export interface DbLeaveEntitlementAdjustment {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type_id: string;
  leave_type_name: string;
  additional_days: number;
  reason: string;
  effective_date: string;
  /** `false` once voided via `/deactivate`; the row still lists for audit history. */
  active: boolean;
  /** `false` until `effective_date` arrives — not yet added to the usable balance. */
  funded: boolean;
  allocation_id: string | null;
  granted_by_id: string | null;
  granted_by_name: string;
  created_at: string;
}

/**
 * Grant history for one employee. Pass `null`/`undefined` to read the
 * caller's own grants — `employee_id` is only sent when given, matching
 * `useLeaveBalanceSummary`/`useLeaveAccruals`.
 */
export const useLeaveEntitlementAdjustments = (
  employeeId?: string | null,
  options?: { leaveTypeId?: string | null; includeInactive?: boolean },
) => {
  const leaveTypeId = options?.leaveTypeId ?? null;
  const includeInactive = options?.includeInactive ?? false;
  const { data: adjustments, loading, refetch } = useCachedList(
    "leaveEntitlementAdjustments",
    () =>
      odooData.fetchLeaveEntitlementAdjustments({
        employeeId: employeeId ?? undefined,
        leaveTypeId: leaveTypeId ?? undefined,
        includeInactive,
      }),
    "Failed to load entitlement adjustments",
    [employeeId, leaveTypeId, includeInactive],
  );
  return { adjustments, loading, refetch };
};
