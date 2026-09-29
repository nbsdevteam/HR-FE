import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `/api/hr/exit/*` `error_code` → localized message key (backend lifecycle_controller). */
const EXIT_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_exit_status: "lifecycle.exit_error_invalid_status",
  invalid_exit_transition: "lifecycle.exit_error_invalid_transition",
  clearance_checklist_incomplete: "lifecycle.exit_error_checklist_incomplete",
  esign_not_signed: "lifecycle.exit_error_esign_not_signed",
  exit_already_completed: "lifecycle.exit_error_already_completed",
  exit_already_cancelled: "lifecycle.exit_error_already_cancelled",
  open_exit_process_exists: "lifecycle.exit_error_open_exists",
  exit_date_required: "lifecycle.exit_error_date_required",
  employee_required: "lifecycle.exit_error_employee_required",
  invalid_exit_type: "lifecycle.exit_error_invalid_type",
  invalid_currency: "lifecycle.exit_error_invalid_currency",
  invalid_exit_value: "lifecycle.exit_error_invalid_value",
  employee_already_exited: "lifecycle.exit_error_employee_already_exited",
  exit_checklist_closed: "lifecycle.exit_error_checklist_closed",
  exit_not_found: "lifecycle.exit_error_not_found",
};

/** The backend's `error_code` on a failed exit call, if it sent one. */
export const exitErrorCode = (error: unknown): string | undefined =>
  (error as HrApiError | undefined)?.code;

/**
 * Branch on `error.code`, never on message text. An unknown code falls back
 * to the caller's localized message rather than the raw server text, which
 * used to reach the user as "Wrong value for lugal.hr.exit.process.status".
 */
export const exitProcessErrorMessage = (error: unknown, fallback: ArabicSourceKey): string => {
  const code = exitErrorCode(error);
  const key = code ? EXIT_ERROR_KEYS[code] : undefined;
  return arabicSource(key ?? fallback);
};
