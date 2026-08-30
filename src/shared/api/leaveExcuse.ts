/**
 * Insufficient-balance manager-excuse workflow (backend `lugal_hr` v1.16.0
 * §4-§6). Split out of `leave.ts` so neither file outgrows the 300-line
 * limit. The manager/HR *decision* itself reuses the generic approvals API
 * (`approveApprovalRequest`/`rejectApprovalRequest` in `lifecycle.ts`) — no
 * dedicated endpoint exists for that step.
 */
import { hrCall } from "./client";
import { mapLeaveExcuseQueueItem, mapLeaveRequest } from "./mappers";
import type { DbLeaveExcuseQueueItem, DbLeaveRequest, LeaveExcuseQueueScope } from "../hooks";
import { eid, items } from "./httpHelpers";

export const fetchLeaveExcuseQueue = async (filters?: {
  scope?: LeaveExcuseQueueScope;
  limit?: number;
  offset?: number;
}): Promise<DbLeaveExcuseQueueItem[]> => {
  const params: Record<string, unknown> = {
    scope: filters?.scope || "team",
    limit: filters?.limit ?? 100,
    offset: filters?.offset ?? 0,
  };
  const rows = await items<unknown>("/api/hr/leave/excuse/pending", params);
  return rows.map(mapLeaveExcuseQueueItem);
};

/** Employee-only (`hr.leave.own`), and only on their own leave. */
export const followUpLeaveExcuse = async (
  leaveId: string | number,
  note?: string,
): Promise<DbLeaveRequest> => {
  const data = await hrCall<unknown>(`/api/hr/leave/${eid(leaveId)}/excuse/followup`, {
    note: note || undefined,
  });
  return mapLeaveRequest(data);
};

/**
 * `hr.leave.hr_approve` only — decides a still-pending excuse in the
 * manager's place. Only works while the excuse is still pending; an
 * already-decided one rejects with `excuse_not_pending`.
 */
export const overrideLeaveExcuse = async (
  leaveId: string | number,
  approved: boolean,
  comment?: string,
): Promise<DbLeaveRequest> => {
  const data = await hrCall<unknown>(`/api/hr/leave/${eid(leaveId)}/excuse/override`, {
    approved,
    comment: comment || undefined,
  });
  return mapLeaveRequest(data);
};
