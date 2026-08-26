import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** hr.warnings `error_code` → localized message key (backend §5). */
const WARNING_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_duration_months: "warnings.error_invalid_duration_months",
  attachment_required: "warnings.error_attachment_required",
  attachment_file_type: "warnings.error_attachment_file_type",
  attachment_invalid: "warnings.error_attachment_invalid",
  attachment_too_large: "warnings.error_attachment_too_large",
  attachment_not_found: "warnings.error_attachment_not_found",
  warning_not_found: "warnings.error_warning_not_found",
};

/** Codes that carry a limit worth appending to the message. */
const detailOf = (error: unknown, key: string): string => {
  const value = (error as HrApiError | undefined)?.details?.[key];
  if (value == null) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const warningErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (!code || !WARNING_ERROR_KEYS[code]) {
    return (error as Error | undefined)?.message || fallback;
  }

  const message = arabicSource(WARNING_ERROR_KEYS[code]);
  if (code === "invalid_duration_months") {
    const max = detailOf(error, "max_duration_months");
    return max ? `${message} (1–${max})` : message;
  }
  if (code === "attachment_file_type") {
    const formats = detailOf(error, "accepted_formats");
    return formats ? `${message} (${arabicSource("leave.accepted_formats")}: ${formats})` : message;
  }
  if (code === "attachment_too_large") {
    const maxMb = detailOf(error, "max_mb");
    return maxMb ? `${message} (${arabicSource("leave.max_file_size")}: ${maxMb}MB)` : message;
  }
  return message;
};
