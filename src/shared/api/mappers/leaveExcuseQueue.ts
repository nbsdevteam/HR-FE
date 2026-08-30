import type { DbLeaveExcuseQueueItem } from "../../hooks";
import { sid, sornull, num } from "./mapHelpers";
import { mapLeaveExcuse } from "./leaveExcuse";

/** One `/api/hr/leave/excuse/pending` row (backend v1.16.0 §4). */
export const mapLeaveExcuseQueueItem = (r: any): DbLeaveExcuseQueueItem => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    employee_name: r.employee_name || "",
    manager_id: sornull(r.manager_id),
    manager_name: r.manager_name || "",
    leave_type_id: sid(r.leave_type_id),
    leave_type_name: r.leave_type_name || "",
    date_from: r.date_from || "",
    date_to: r.date_to || "",
    number_of_days: num(r.number_of_days),
    reason: r.reason || "",
    current_balance: num(r.current_balance),
    excuse: mapLeaveExcuse(r.excuse),
    approval_request_id: sid(r.approval_request_id),
  };
}
