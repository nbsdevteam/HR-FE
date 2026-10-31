import type { HrApiError } from "@/shared/api/client";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

/**
 * `/employees/create` and `/employees/<id>/update` refuse these with a typed
 * `error_code`, and a refused request writes nothing — so the whole save has
 * to be corrected and resubmitted.
 */
const EMPLOYEE_WRITE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_blood_type: "employees.error_invalid_blood_type",
  invalid_end_date: "employees.error_invalid_end_date",
  end_date_before_joining: "employees.error_end_date_before_joining",
  unknown_nationality: "employees.error_unknown_nationality",
};

/** Localized message for a refused employee save, or `null` when the code is not one of these. */
export const employeeWriteErrorMessage = (error: unknown): string | null => {
  const code = (error as HrApiError | null)?.code;
  const key = code ? EMPLOYEE_WRITE_ERROR_KEYS[code] : undefined;
  return key ? arabicSource(key) : null;
};
