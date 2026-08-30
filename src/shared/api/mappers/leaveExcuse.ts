import type { DbLeaveExcuse, DbLeaveExcuseFollowup } from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

/**
 * Insufficient-balance manager-excuse workflow mappers (backend `lugal_hr`
 * v1.16.0). Split out of `leave.ts` so neither file outgrows the 300-line
 * limit.
 */
export const mapLeaveExcuseFollowup = (r: any): DbLeaveExcuseFollowup => {
  return {
    id: sid(r.id),
    note: r.note || "",
    followup_date: r.followup_date || "",
    created_at: r.created_at || empty,
  };
}

const INACTIVE_EXCUSE: DbLeaveExcuse = {
  active: false,
  state: "none",
  original_balance: 0,
  followup_count: 0,
  followup_max: 2,
  followup_remaining: 2,
  last_followup_date: null,
  followups: [],
  decided_at: null,
  decided_by_id: null,
  decided_by_name: "",
  decision_comment: "",
};

/**
 * One leave object's `excuse` block (backend §2.3) — absent entirely on a
 * backend that predates this feature, so every caller falls back to the
 * same inactive shape rather than needing an `excuse?` check.
 */
export const mapLeaveExcuse = (r: any): DbLeaveExcuse => {
  if (!r) return INACTIVE_EXCUSE;
  return {
    active: bool(r.active),
    state: r.state || "none",
    original_balance: num(r.original_balance),
    followup_count: num(r.followup_count),
    followup_max: num(r.followup_max, 2),
    followup_remaining: num(r.followup_remaining),
    last_followup_date: r.last_followup_date || null,
    followups: Array.isArray(r.followups) ? r.followups.map(mapLeaveExcuseFollowup) : [],
    decided_at: r.decided_at || null,
    decided_by_id: sornull(r.decided_by_id),
    decided_by_name: r.decided_by_name || "",
    decision_comment: r.decision_comment || "",
  };
}
