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
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const leaveErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (code && LEAVE_ERROR_KEYS[code]) return arabicSource(LEAVE_ERROR_KEYS[code]);
  return (error as Error | undefined)?.message || fallback;
};
