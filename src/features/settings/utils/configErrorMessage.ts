import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `/api/hr/configs/update` `error_code` → localized message key (backend §2). */
const CONFIG_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_missing_checkout_policy: "settings.error_invalid_missing_checkout_policy",
  missing_checkout_amount_required: "settings.error_missing_checkout_amount_required",
  invalid_fixed_amount: "settings.error_invalid_fixed_amount",
  invalid_overnight_window: "settings.error_invalid_overnight_window",
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const configErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (code && CONFIG_ERROR_KEYS[code]) return arabicSource(CONFIG_ERROR_KEYS[code]);
  return (error as Error | undefined)?.message || fallback;
};
