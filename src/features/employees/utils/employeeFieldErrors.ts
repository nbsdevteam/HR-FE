import type { HrApiError } from "@/shared/api/client";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

/** Which input a rejected employee create/update belongs under. */
export type EmployeeFieldErrors = {
  department: string | null;
  designation: string | null;
};

export const NO_EMPLOYEE_FIELD_ERRORS: EmployeeFieldErrors = { department: null, designation: null };

/**
 * `/employees/create` and `/employees/<id>/update` now reject an unknown
 * `department_id` / `designation_id` with a typed `error_code` instead of
 * bubbling a raw database FK error (backend §4).
 *
 * The usual cause is a stale dropdown option — a department deleted in another
 * tab since this form was opened — so the message belongs on the select the
 * user has to change, not in the form-level error box. A rejected payload
 * writes nothing at all, so the whole save must be resubmitted after fixing it.
 */
const FIELD_ERROR_KEYS: Record<string, { field: keyof EmployeeFieldErrors; key: ArabicSourceKey }> = {
  department_not_found: { field: "department", key: "employees.error_department_not_found" },
  designation_not_found: { field: "designation", key: "employees.error_designation_not_found" },
};

/** Field-level errors for a rejected save, or `null` when the failure belongs on the form. */
export const employeeFieldErrors = (error: unknown): EmployeeFieldErrors | null => {
  const code = (error as HrApiError | null)?.code;
  const mapped = code ? FIELD_ERROR_KEYS[code] : undefined;
  if (!mapped) return null;
  return { ...NO_EMPLOYEE_FIELD_ERRORS, [mapped.field]: arabicSource(mapped.key) };
};
