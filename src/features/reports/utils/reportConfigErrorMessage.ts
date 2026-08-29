import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `hr.reports.templates.*` `error_code` → localized message key (backend §5). */
const REPORT_CONFIG_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  name_ar_required: "reports.error_name_ar_required",
  code_required: "reports.error_code_required",
  invalid_code: "reports.error_invalid_code",
  code_exists: "reports.error_code_exists",
  invalid_category: "reports.error_invalid_category",
  invalid_format: "reports.error_invalid_format",
  invalid_columns: "reports.error_invalid_columns",
  invalid_default_filters: "reports.error_invalid_default_filters",
  invalid_sort_order: "reports.error_invalid_sort_order",
  invalid_active: "reports.error_invalid_active",
  invalid_name_ar: "reports.error_invalid_name_ar",
  invalid_name_en: "reports.error_invalid_name_en",
  invalid_description: "reports.error_invalid_description",
  invalid_data_source: "reports.error_invalid_data_source",
  template_not_found: "reports.error_template_not_found",
};

/** Codes that carry `allowed_values` worth appending to the message. */
const allowedValuesOf = (error: unknown): string => {
  const value = (error as HrApiError | undefined)?.details?.allowed_values;
  if (value == null) return "";
  return Array.isArray(value) ? value.join(", ") : String(value);
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const reportConfigErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (!code || !REPORT_CONFIG_ERROR_KEYS[code]) {
    return (error as Error | undefined)?.message || fallback;
  }

  const message = arabicSource(REPORT_CONFIG_ERROR_KEYS[code]);
  if (code === "invalid_category" || code === "invalid_format") {
    const allowed = allowedValuesOf(error);
    return allowed ? `${message} (${arabicSource("reports.allowed_values_suffix")}: ${allowed})` : message;
  }
  return message;
};
