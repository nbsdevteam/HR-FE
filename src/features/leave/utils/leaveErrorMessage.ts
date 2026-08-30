import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** hr.leave `error_code` → localized message key (backend §9). */
const LEAVE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  hours_exceed_maximum: "leave.error_hours_exceed_maximum",
  invalid_hours: "leave.error_invalid_hours",
  hourly_not_supported: "leave.error_hourly_not_supported",
  invalid_hour_from: "leave.error_invalid_hour_from",
  invalid_hour_range: "leave.error_invalid_hour_range",
  attachment_required: "leave.error_attachment_required",
  attachment_file_type: "leave.error_attachment_file_type",
  attachment_invalid: "leave.error_attachment_invalid",
  attachment_too_large: "leave.error_attachment_too_large",
  invalid_duration_unit: "leave.error_invalid_duration_unit",
  attachment_not_found: "leave.error_attachment_not_found",
  leave_locked: "leave.error_leave_locked",
  invalid_max_hours: "leave.error_invalid_max_hours",
  invalid_request: "leave.error_invalid_request",
  // v1.12.9 accrual/probation rejections — Odoo's own wording is passed through
  // unchanged on the wire, so map friendlier copy from the code instead.
  probation_block: "leave.error_probation_block",
  insufficient_balance: "leave.error_insufficient_balance",
  leave_type_not_found: "leave.error_leave_type_not_found",
  employee_not_found: "leave.error_employee_not_found",
  // v1.17.0 Additional Annual Leave grants
  reason_required: "leave.error_reason_required",
  invalid_additional_days: "leave.error_invalid_additional_days",
  // v1.16.0 insufficient-balance manager-excuse workflow
  excuse_followup_blocked: "leave.error_excuse_followup_blocked",
  excuse_not_pending: "leave.error_excuse_not_pending",
};

/** `probation_block` responses also carry the probation end date (backend §6). */
const probationEndDateOf = (error: unknown): string => {
  const value = (error as HrApiError | undefined)?.details?.probation_end_date;
  return typeof value === "string" ? value : "";
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const leaveErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (code === "probation_block") {
    const endDate = probationEndDateOf(error);
    const message = arabicSource("leave.error_probation_block");
    return endDate ? `${message} ${arabicSource("leave.probation_ends_on")} ${endDate}` : message;
  }
  if (code && LEAVE_ERROR_KEYS[code]) return arabicSource(LEAVE_ERROR_KEYS[code]);
  return (error as Error | undefined)?.message || fallback;
};
