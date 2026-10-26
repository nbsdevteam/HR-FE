/**
 * End of Service (exit process) payload types, split out of `lifecycle.ts`
 * to keep that file under the 300-line rule. Re-exported from there, so
 * every existing `@/shared/hooks` import keeps working.
 */

/** End of Service stages, exactly as `lugal.hr.exit.process.status` stores them. */
export type ExitStatus = "in_progress" | "approval" | "clearance" | "settlement" | "completed" | "cancelled";

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

/** A clearance section's stage (backend `clearance_sections[].state`). */
export type ExitSectionState =
  | "pending_approval" | "approved" | "signing" | "completed" | "rejected" | "cancelled";

/** One signer's stage (backend `clearance_sections[].signatures[].state`). */
export type ExitSignatureState =
  | "pending" | "sent" | "viewed" | "signed" | "rejected" | "expired" | "revoked";

export type ExitSignerRole = "hr_manager" | "finance_supervisor" | "it_approver" | "employee";

/** One ordered signer on a clearance section; `can_*` are the backend's verdict for the caller. */
export interface ExitSignature {
  id: string;
  sequence: number;
  signer_role: string;
  signer_name: string;
  state: ExitSignatureState;
  sent_at: string | null;
  decided_at: string | null;
  can_sign: boolean;
  can_resend: boolean;
}

/** An approval + ordered signatures gate over one governed checklist category. */
export interface ExitClearanceSection {
  id: string;
  category: string;
  state: ExitSectionState;
  approved_by_name: string;
  approved_at: string | null;
  completed_at: string | null;
  /** Holders of the category's approver permission; 0 means the section can never be approved. */
  approver_count: number | null;
  can_approve: boolean;
  signatures: ExitSignature[];
}

/** One step of the End of Service approval chain (backend `approval.steps[]`). */
export type ExitApprovalStepState = "approved" | "rejected" | "skipped" | "pending" | "waiting" | "not_reached";

export interface ExitApprovalStep {
  sequence: number;
  name: string;
  approver_type: string;
  approver_permission: string;
  state: ExitApprovalStepState;
  acted_by_name: string;
  acted_at: string | null;
  comment: string;
  /** Who can act on the pending step. */
  waiting_for: { id: string; name: string }[];
}

/** The approval stage of a process; null on the process until it is submitted. */
export interface ExitApproval {
  request_id: string;
  status: string;
  workflow_name: string;
  submitted_by_name: string;
  submitted_at: string | null;
  decided_at: string | null;
  /** Why the last decision sent the process back to in progress. */
  rejection_reason: string;
  current_step: { sequence: number; name: string; approver_type: string } | null;
  steps: ExitApprovalStep[];
}

/** One line of the server-calculated settlement; `loan` and `custody` lines are negative. */
export interface ExitSettlementLine {
  code: string;
  label: string;
  amount: number;
  currency: string;
  basis: string | null;
}

export interface ExitSettlementWarning {
  code: string;
  custody_id: string | null;
  item: string;
}

/** The settlement statement the server calculates, Finance confirms and the employee signs. */
export interface ExitSettlement {
  lines: ExitSettlementLine[];
  /** Per currency; amounts are never converted between currencies. */
  totals: Record<string, number>;
  warnings: ExitSettlementWarning[];
  computed_at: string | null;
  confirmed: boolean;
  confirmed_by_name: string;
  confirmed_at: string | null;
}

export type ExitSigningLinkState = "sent" | "viewed" | "signed" | "rejected" | "expired" | "revoked";

/** The leaving employee's one-time signing link. `path`/`url` are the credential, sent to HR only. */
export interface ExitSigningLink {
  id: string;
  state: ExitSigningLinkState;
  sent_at: string | null;
  expires_at: string | null;
  emailed_to: string;
  first_viewed_at: string | null;
  view_count: number;
  decided_at: string | null;
  typed_name: string;
  decision_notes: string;
  path: string | null;
  /** Absolute link; empty when the server has no public base URL, so callers fall back to the origin. */
  url: string | null;
}

/** Loans still open for the leaving employee (backend `warnings.open_loans`). */
export interface ExitOpenLoans {
  count: number;
  loan_ids: string[];
  /** Outstanding balance per currency — shown, never calculated or deducted (Phase 1). */
  remaining: Record<string, number>;
}

/** Settlement-time warnings on an exit process (backend `serialize_exit_process.warnings`). */
export interface ExitWarnings {
  open_loans: ExitOpenLoans | null;
}

/** The five stages `progress.stages` always lists, in this order. */
export type ExitProgressStageKey = "in_progress" | "approval" | "clearance" | "settlement" | "completed";

/** How one stage is drawn; `cancelled` and `not_reached` only appear on a cancelled process. */
export type ExitProgressStageState = "done" | "current" | "todo" | "skipped" | "cancelled" | "not_reached";

export interface ExitProgressStage {
  key: string;
  state: ExitProgressStageState;
}

/** The owners the backend names; an unknown owner shows as sent. */
export type ExitProgressOwner =
  | "hr" | "it" | "finance" | "admin" | "custodies" | "approver" | "employee" | "hr_manager";

export interface ExitProgressPerson {
  id: string;
  name: string;
}

/** Someone the process waits on now; `people` is filled only for the open approval step. */
export interface ExitWaitingOn {
  owner: string;
  people: ExitProgressPerson[];
}

/** One thing left in the current stage (backend `progress.still_required[]`). */
export interface ExitRequiredItem {
  code: string;
  owner: string;
  label: string;
  label_ar: string;
  /** The checklist line, for `clearance_item`. */
  line_id: string | null;
  /** The custody record, for `custody_item`. */
  custody_id: string | null;
  /** Code-specific extra: a rejection reason, or the signing link's state. */
  detail: string;
  people: ExitProgressPerson[];
}

/** Where the process stands and what is left, worked out by the backend and rendered as sent. */
export interface ExitProgress {
  stages: ExitProgressStage[];
  percent: number;
  waiting_on: ExitWaitingOn[];
  still_required: ExitRequiredItem[];
  /** `still_required[0]`, or null when nothing is left. */
  next: ExitRequiredItem | null;
  /** When the current stage began, an ISO datetime with a +03:00 offset. */
  since: string | null;
  days_in_stage: number | null;
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
  /** Empty until the backend's clearance governance is switched on. */
  clearance_sections: ExitClearanceSection[];
  warnings: ExitWarnings;
  approval: ExitApproval | null;
  approval_submitted_at: string | null;
  /** Null until settlement; the server calculates it, the browser never does. */
  settlement: ExitSettlement | null;
  /** Null until a signing link exists. */
  signature: ExitSigningLink | null;
  progress: ExitProgress;
  /** The buttons the backend lets the signed-in user press (`submit`, `approve`, `complete`, ...). */
  my_actions: string[];
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
