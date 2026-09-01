import type { HrApiError } from "@/shared/api/client";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

/**
 * The backend rejects a bad `birth_date` with a typed `error_code` rather than
 * an HTTP error, and a rejected payload writes *nothing* — so these belong on
 * the field itself, next to the input the user has to fix, not in the generic
 * form-level error box.
 */
const BIRTH_DATE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_birth_date: "employees.birth_date_invalid_format",
  birth_date_in_future: "employees.birth_date_cannot_be_in_the_future",
};

/** Field-level message for a rejected birth date, or `null` when the failure belongs on the form. */
export const birthDateFieldError = (error: unknown): string | null => {
  const code = (error as HrApiError | null)?.code;
  const key = code ? BIRTH_DATE_ERROR_KEYS[code] : undefined;
  return key ? arabicSource(key) : null;
};
