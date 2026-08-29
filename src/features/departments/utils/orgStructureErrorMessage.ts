import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `hr.departments.*` / `hr.designations.*` `error_code` → localized message key (backend §5). */
const ORG_STRUCTURE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  name_required: "org_structure.error_name_required",
  invalid_name: "org_structure.error_invalid_name",
  invalid_name_ar: "org_structure.error_invalid_name_ar",
  invalid_title_ar: "org_structure.error_invalid_title_ar",
  invalid_description: "org_structure.error_invalid_description",
  invalid_color: "org_structure.error_invalid_color",
  invalid_sort_order: "org_structure.error_invalid_sort_order",
  invalid_level: "org_structure.error_invalid_level",
  invalid_max_headcount: "org_structure.error_invalid_max_headcount",
  invalid_active: "org_structure.error_invalid_active",
  invalid_parent_id: "org_structure.error_invalid_parent_id",
  invalid_manager_id: "org_structure.error_invalid_manager_id",
  invalid_department_id: "org_structure.error_invalid_department_id",
  invalid_reports_to_job_id: "org_structure.error_invalid_reports_to_job_id",
  parent_not_found: "org_structure.error_parent_not_found",
  shift_not_found: "org_structure.error_shift_not_found",
  department_not_found: "org_structure.error_department_not_found",
  reports_to_not_found: "org_structure.error_reports_to_not_found",
  parent_cycle: "org_structure.error_parent_cycle",
  reports_to_cycle: "org_structure.error_reports_to_cycle",
  designation_not_found: "org_structure.error_designation_not_found",
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const orgStructureErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (!code || !ORG_STRUCTURE_ERROR_KEYS[code]) {
    return (error as Error | undefined)?.message || fallback;
  }
  return arabicSource(ORG_STRUCTURE_ERROR_KEYS[code]);
};
