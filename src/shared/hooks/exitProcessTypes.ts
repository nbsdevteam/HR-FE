/**
 * End of Service (exit process) payload types, split out of `lifecycle.ts`
 * to keep that file under the 300-line rule. Re-exported from there, so
 * every existing `@/shared/hooks` import keeps working.
 */

/** End of Service stages, exactly as `lugal.hr.exit.process.status` stores them. */
export type ExitStatus = "in_progress" | "clearance" | "settlement" | "completed" | "cancelled";

/** The e-sign slot on an exit process (backend `esign`). */
export interface ExitEsign {
  required: boolean;
  state: "not_required" | "required" | "pending" | "signed" | "rejected";
  res_model: string;
  res_id: number | false;
  signed_at: string | null;
}

/** Who the clearance notifications reached (backend `clearance_notifications`). */
export interface ExitClearanceNotifications {
  teams?: Record<string, { permission: string; recipients: number; items: string[] }>;
  employee?: { inbox: boolean; has_login: boolean; email: string };
}

export interface DbExitProcess {
  id: string;
  employee_id: string;
  /** Kept by the API after the employee is archived — the active-employee map drops them. */
  employee_name: string;
  employee_active: boolean;
  exit_type: string;
  exit_date: string;
  last_working_day: string | null;
  reason: string | null;
  notice_date: string | null;
  notice_period_days: number | null;
  eos_amount: number | null;
  eos_currency: string;
  final_settlement_amount: number | null;
  status: string;
  approved_by: string | null;
  approved_by_user_name: string;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** The backend's state machine — rendered as-is, never re-derived here. */
  editable: boolean;
  allowed_transitions: ExitStatus[];
  /** Allowed moves a gate still holds, e.g. `{ settlement: ["clearance_checklist_incomplete"] }`. */
  transition_blockers: Partial<Record<ExitStatus, string[]>>;
  clearance_started_at: string | null;
  settlement_started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  clearance_notifications: ExitClearanceNotifications;
  esign: ExitEsign;
}

export interface DbExitChecklist {
  id: string;
  exit_process_id: string;
  checklist_item_id: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  /** The owning clearance team (`finance`, `it`), or "" when HR clears it. */
  clearance_team: string;
  /** Whether the signed-in user may tick this line now (HR, or its team, while open). */
  can_toggle: boolean;
}
