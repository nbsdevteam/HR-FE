import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/**
 * `/api/hr/leave/types/create|update` `error_code` → localized message key.
 * The 2026-09-10 field-removal hand-off retired eight codes tied to fields no
 * longer sent from this form (`leave_type_code_taken`, `invalid_code`,
 * `invalid_gender_restriction`, `invalid_accrual_method`,
 * `invalid_days_per_request_range`, `invalid_sort_order`,
 * `invalid_min_days_per_request`, `invalid_max_days_per_request`) — only the
 * codes that can still be returned are mapped here.
 */
const LEAVE_TYPE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  name_required: "settings.leave_type_name_required",
  invalid_encashment_percentage: "settings.encashment_percentage_range",
  invalid_min_service_months: "settings.error_invalid_min_service_months",
  leave_type_system_protected: "settings.error_leave_type_system_protected",
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const leaveTypeErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (code && LEAVE_TYPE_ERROR_KEYS[code]) return arabicSource(LEAVE_TYPE_ERROR_KEYS[code]);
  return (error as Error | undefined)?.message || fallback;
};
