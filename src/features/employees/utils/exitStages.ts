import type { ArabicSourceKey } from "@/i18n/source";
import type { ExitEsign, ExitStatus } from "@/shared/hooks";

/** The shared Button variants a stage button uses. */
export type ExitStageVariant = "info" | "warning" | "success" | "destructive";

/**
 * Labels for the moves the backend offers. Which moves exist, and when, is the
 * backend's `allowed_transitions` — nothing here decides the state machine.
 */
export const EXIT_TRANSITION_LABEL_KEYS: Record<ExitStatus, ArabicSourceKey> = {
  in_progress: "common.my_neighbor",
  clearance: "lifecycle.exit_start_clearance",
  settlement: "lifecycle.exit_to_settlement",
  completed: "lifecycle.exit_complete_process",
  cancelled: "lifecycle.exit_cancel_process",
};

export const EXIT_TRANSITION_VARIANTS: Record<ExitStatus, ExitStageVariant> = {
  in_progress: "warning",
  clearance: "info",
  settlement: "warning",
  completed: "success",
  cancelled: "destructive",
};

/** Why an allowed move is still held (backend `transition_blockers`). */
export const EXIT_BLOCKER_KEYS: Record<string, ArabicSourceKey> = {
  clearance_checklist_incomplete: "lifecycle.exit_blocked_checklist",
  esign_not_signed: "lifecycle.exit_blocked_esign",
};

export const EXIT_ESIGN_STATE_KEYS: Record<ExitEsign["state"], ArabicSourceKey> = {
  not_required: "lifecycle.exit_esign_not_required",
  required: "lifecycle.exit_esign_required",
  pending: "lifecycle.exit_esign_pending",
  signed: "lifecycle.exit_esign_signed",
  rejected: "lifecycle.exit_esign_rejected",
};

export const EXIT_CURRENCY_OPTIONS = ["IQD", "USD", "EUR"] as const;
