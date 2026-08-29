import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import { PublicLeaveApiError } from "../api/publicLeaveApi";

/** `error_code` → localized message key (backend hand-off §3/§4/§6/§7). */
const PUBLIC_LEAVE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_link: "public_leave.error_invalid_link",
  rate_limited: "public_leave.error_rate_limited",
  verification_required: "public_leave.error_verification_required",
  verification_failed: "public_leave.error_verification_failed",
  verification_unavailable: "public_leave.error_verification_unavailable",
  missing_params: "public_leave.error_missing_params",
  leave_type_not_available: "public_leave.error_leave_type_not_available",
  invalid_duration_unit: "public_leave.error_generic",
  hourly_not_supported: "public_leave.error_hourly_not_supported",
  invalid_hours: "public_leave.error_invalid_hours",
  invalid_hour_from: "public_leave.error_invalid_hour_from",
  invalid_hour_range: "public_leave.error_invalid_hour_range",
  insufficient_balance: "public_leave.error_insufficient_balance",
  attachment_required: "public_leave.error_attachment_required",
  attachment_not_allowed: "public_leave.error_attachment_not_allowed",
  attachment_invalid: "public_leave.error_attachment_invalid",
  validation_error: "public_leave.error_generic",
  rejected: "public_leave.error_generic",
  not_found: "public_leave.error_status_not_found",
};

const detailOf = (error: unknown, key: string): unknown =>
  (error as PublicLeaveApiError | undefined)?.details?.[key];

/** Branch on `error.code`, never on message text, per the backend contract. */
export const publicLeaveErrorMessage = (error: unknown, fallback: string): string => {
  const code = error instanceof PublicLeaveApiError ? error.code : "";

  if (code === "probation_block") {
    const endDate = detailOf(error, "probation_end_date");
    const message = arabicSource("public_leave.error_probation_block");
    return typeof endDate === "string" && endDate
      ? `${message} ${arabicSource("public_leave.probation_ends_on")} ${endDate}`
      : message;
  }

  if (code === "hours_exceed_maximum") {
    const maxHours = detailOf(error, "max_hours");
    return `${arabicSource("public_leave.error_hours_exceed_maximum")} ${maxHours ?? ""}`.trim();
  }

  if (code === "attachment_too_large") {
    const maxMb = detailOf(error, "max_mb");
    return maxMb != null
      ? `${arabicSource("public_leave.error_attachment_too_large")} ${maxMb} MB`
      : arabicSource("public_leave.error_attachment_too_large");
  }

  if (code === "attachment_file_type") {
    const formats = detailOf(error, "accepted_formats");
    const formatsText = Array.isArray(formats) ? formats.join("، ") : "";
    return formatsText
      ? `${arabicSource("public_leave.error_attachment_file_type")} ${formatsText}`
      : arabicSource("public_leave.error_attachment_file_type");
  }

  if (code && PUBLIC_LEAVE_ERROR_KEYS[code]) return arabicSource(PUBLIC_LEAVE_ERROR_KEYS[code]);
  return (error instanceof PublicLeaveApiError && error.message) || fallback;
};
