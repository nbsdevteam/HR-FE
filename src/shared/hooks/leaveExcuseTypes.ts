/**
 * Insufficient-balance manager-excuse workflow types (backend `lugal_hr`
 * v1.16.0). Split out of `leave.ts` so neither file outgrows the 300-line
 * limit.
 */

/** One entry of `excuse.followups` — an employee's nudge while a decision is pending. */
export interface DbLeaveExcuseFollowup {
  id: string;
  note: string;
  followup_date: string;
  created_at: string;
}

/**
 * Present (with `active: false`) on every leave object returned anywhere in
 * the Leave API — existing screens that ignore unknown keys need no change.
 */
export interface DbLeaveExcuse {
  active: boolean;
  state: "none" | "pending" | "approved" | "rejected";
  original_balance: number;
  followup_count: number;
  followup_max: number;
  followup_remaining: number;
  last_followup_date: string | null;
  followups: DbLeaveExcuseFollowup[];
  decided_at: string | null;
  decided_by_id: string | null;
  decided_by_name: string;
  decision_comment: string;
}
