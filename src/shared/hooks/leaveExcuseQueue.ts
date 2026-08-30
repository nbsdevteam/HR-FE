/**
 * Manager/HR review queue for insufficient-balance excuse requests (backend
 * `lugal_hr` v1.16.0 §4). Split out of `leave.ts` so neither file outgrows
 * the 300-line limit.
 */
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";
import type { DbLeaveExcuse } from "./leaveExcuseTypes";

export type LeaveExcuseQueueScope = "team" | "hr";

/** One `/api/hr/leave/excuse/pending` row — everything the review screen needs, no per-row fetch. */
export interface DbLeaveExcuseQueueItem {
  id: string;
  employee_id: string;
  employee_name: string;
  manager_id: string | null;
  manager_name: string;
  leave_type_id: string;
  leave_type_name: string;
  date_from: string;
  date_to: string;
  number_of_days: number;
  reason: string;
  /** Live remaining balance, recomputed on every call. */
  current_balance: number;
  excuse: DbLeaveExcuse;
  /** Id to decide through `/api/hr/approvals/requests/<id>/approve|reject` — not the leave's own id. */
  approval_request_id: string;
}

/**
 * `scope: "team"` — the caller's direct reports only (`hr.leave.team_approve`).
 * `scope: "hr"` — every pending excuse company-wide (`hr.leave.hr_approve`).
 */
export const useLeaveExcuseQueue = (scope: LeaveExcuseQueueScope) => {
  const { data: items, loading, refetch } = useCachedList(
    "leaveExcuseQueue",
    () => odooData.fetchLeaveExcuseQueue({ scope }),
    "Failed to load excuse requests",
    [scope],
  );
  return { items, loading, refetch };
};
