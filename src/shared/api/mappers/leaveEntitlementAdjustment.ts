import type { DbLeaveEntitlementAdjustment } from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

/** One `/api/hr/leave/entitlement-adjustments/list` row (backend §3). */
export const mapLeaveEntitlementAdjustment = (r: any): DbLeaveEntitlementAdjustment => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    employee_name: r.employee_name || "",
    leave_type_id: sid(r.leave_type_id),
    leave_type_name: r.leave_type_name || "",
    additional_days: num(r.additional_days),
    reason: r.reason || "",
    effective_date: r.effective_date || "",
    active: r.active !== false,
    funded: bool(r.funded),
    allocation_id: sornull(r.allocation_id),
    granted_by_id: sornull(r.granted_by_id),
    granted_by_name: r.granted_by_name || "",
    created_at: r.created_at || empty,
  };
}
