import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `/api/hr/employees/<id>/device_mapping` `error_code` → localized message key (backend lugal_hr ≥ 1.24.0). */
const DEVICE_MAPPING_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  not_a_device_origin_employee: "employees.device_mapping_error_not_device_origin",
  invalid_mapping_target: "employees.device_mapping_error_invalid_target",
  mapping_target_inactive: "employees.device_mapping_error_target_inactive",
  mapping_target_has_device_number: "employees.device_mapping_error_target_has_number",
  device_origin_has_records: "employees.device_mapping_error_has_records",
  employee_inactive: "employees.device_mapping_error_archived",
  employee_not_found: "employees.device_mapping_error_not_found",
};

/** Branch on `error.code`, never on message text; an unknown code gets the generic message. */
export const deviceMappingErrorMessage = (error: unknown): string => {
  const code = (error as HrApiError | undefined)?.code;
  return arabicSource((code && DEVICE_MAPPING_ERROR_KEYS[code]) || "employees.device_mapping_error_generic");
};
