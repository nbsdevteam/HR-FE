import type { ArabicSourceKey } from "@/i18n/source";
import type {
  ExitApprovalStepState, ExitEsign, ExitSectionState, ExitSignatureState, ExitSigningLinkState, ExitStatus,
} from "@/shared/hooks";

/** The shared Button variants a stage button uses. */
export type ExitStageVariant = "info" | "warning" | "success" | "destructive";

/**
 * Labels for the moves the backend offers. Which moves exist, and when, is the
 * backend's `allowed_transitions` — nothing here decides the state machine.
 */
export const EXIT_TRANSITION_LABEL_KEYS: Record<ExitStatus, ArabicSourceKey> = {
  in_progress: "common.my_neighbor",
  approval: "lifecycle.exit_submit_for_approval",
  clearance: "lifecycle.exit_start_clearance",
  settlement: "lifecycle.exit_to_settlement",
  completed: "lifecycle.exit_complete_process",
  cancelled: "lifecycle.exit_cancel_process",
};

export const EXIT_TRANSITION_VARIANTS: Record<ExitStatus, ExitStageVariant> = {
  in_progress: "warning",
  approval: "info",
  clearance: "info",
  settlement: "warning",
  completed: "success",
  cancelled: "destructive",
};

/** Why an allowed move is still held (backend `transition_blockers`). */
export const EXIT_BLOCKER_KEYS: Record<string, ArabicSourceKey> = {
  clearance_checklist_incomplete: "lifecycle.exit_blocked_checklist",
  esign_not_signed: "lifecycle.exit_blocked_esign",
  clearance_approval_incomplete: "lifecycle.exit_blocked_clearance_approval",
  clearance_signatures_incomplete: "lifecycle.exit_blocked_clearance_signatures",
  custody_not_returned: "lifecycle.exit_blocked_custody",
  approval_required: "lifecycle.exit_blocked_approval_required",
  approval_pending: "lifecycle.exit_blocked_approval_pending",
  second_person_required: "lifecycle.exit_blocked_second_person",
};

export const EXIT_APPROVAL_STEP_STATE_KEYS: Record<ExitApprovalStepState, ArabicSourceKey> = {
  approved: "lifecycle.exit_approval_step_approved",
  rejected: "lifecycle.exit_approval_step_rejected",
  skipped: "lifecycle.exit_approval_step_skipped",
  pending: "lifecycle.exit_approval_step_pending",
  waiting: "lifecycle.exit_approval_step_waiting",
  not_reached: "lifecycle.exit_approval_step_not_reached",
};

export const EXIT_APPROVAL_STEP_STATE_TONES: Record<ExitApprovalStepState, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  skipped: "bg-muted/30 text-muted-foreground border-border/40",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  waiting: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  not_reached: "bg-muted/30 text-muted-foreground border-border/40",
};

/** The employee's signing link, reusing the clearance signature wording where it already exists. */
export const EXIT_SIGNING_LINK_STATE_KEYS: Record<ExitSigningLinkState, ArabicSourceKey> = {
  sent: "lifecycle.exit_clr_sig_sent",
  viewed: "lifecycle.exit_clr_sig_viewed",
  signed: "lifecycle.exit_esign_signed",
  rejected: "lifecycle.exit_clr_sig_rejected",
  expired: "lifecycle.exit_clr_sig_expired",
  revoked: "lifecycle.exit_clr_sig_revoked",
};

/** Settlement line codes the server names; an unknown code shows the line's own label. */
export const EXIT_SETTLEMENT_LINE_KEYS: Record<string, ArabicSourceKey> = {
  eos_benefit: "lifecycle.exit_line_eos_benefit",
  leave_payout: "lifecycle.exit_line_leave_payout",
  loan: "lifecycle.exit_line_loan",
  custody: "lifecycle.exit_line_custody",
};

/** Settlement warnings the server names; an unknown code shows as sent. */
export const EXIT_SETTLEMENT_WARNING_KEYS: Record<string, ArabicSourceKey> = {
  joining_date_missing: "lifecycle.exit_warning_joining_date_missing",
  salary_missing: "lifecycle.exit_warning_salary_missing",
  custody_value_missing: "lifecycle.exit_warning_custody_value_missing",
  leave_payout_type_missing: "lifecycle.exit_warning_leave_payout_type_missing",
};

export const EXIT_ESIGN_STATE_KEYS: Record<ExitEsign["state"], ArabicSourceKey> = {
  not_required: "lifecycle.exit_esign_not_required",
  required: "lifecycle.exit_esign_required",
  pending: "lifecycle.exit_esign_pending",
  signed: "lifecycle.exit_esign_signed",
  rejected: "lifecycle.exit_esign_rejected",
};

export const EXIT_SECTION_STATE_KEYS: Record<ExitSectionState, ArabicSourceKey> = {
  pending_approval: "lifecycle.exit_clr_section_pending_approval",
  approved: "lifecycle.exit_clr_section_approved",
  signing: "lifecycle.exit_clr_section_signing",
  completed: "lifecycle.exit_clr_section_completed",
  rejected: "lifecycle.exit_clr_section_rejected",
  cancelled: "lifecycle.exit_clr_section_cancelled",
};

export const EXIT_SIGNATURE_STATE_KEYS: Record<ExitSignatureState, ArabicSourceKey> = {
  pending: "lifecycle.exit_clr_sig_pending",
  sent: "lifecycle.exit_clr_sig_sent",
  viewed: "lifecycle.exit_clr_sig_viewed",
  signed: "lifecycle.exit_esign_signed",
  rejected: "lifecycle.exit_clr_sig_rejected",
  expired: "lifecycle.exit_clr_sig_expired",
  revoked: "lifecycle.exit_clr_sig_revoked",
};

/** Signer roles the backend names; an unknown role shows its own name. */
export const EXIT_SIGNER_ROLE_KEYS: Record<string, ArabicSourceKey> = {
  hr_manager: "common.human_resources_manager",
  finance_supervisor: "lifecycle.exit_clr_role_finance_supervisor",
  it_approver: "lifecycle.exit_clr_role_it_approver",
  employee: "lifecycle.exit_clr_role_employee",
};

