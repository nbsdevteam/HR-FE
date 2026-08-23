import { formatCurrency as formatIntlCurrency, formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";

/**
 * Currency/duration display helpers.
 *
 * These live in `shared` rather than inside the payroll engine because
 * `employees`, `attendance`, `reports` and `dashboard` all render salaries too —
 * importing them from `@/features/payroll/services/payslip-engine` made four
 * unrelated features depend on payroll's internals.
 */

/**
 * Render an amount in `currency`. ISO-4217 codes go through Intl; anything else
 * (a free-text currency name from configuration) is appended as a plain suffix.
 */
export const formatCurrency = (val: number, currency: string): string => {
  if (/^[A-Z]{3}$/.test(currency)) {
    return formatIntlCurrency(val, currency);
  }
  return `${formatNumber(val)} ${currency}`;
};

/** Convenience wrapper for the app's default currency. */
export const formatIQD = (value: number): string => formatCurrency(value, "IQD");

/** Render a fractional hour count as a localized "Nh Mm" string. */
export const formatHoursMinutes = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} ${arabicSource("common.min")}`;
  if (m === 0) return `${h} ${arabicSource("common.hours")}`;
  return `${h} ${arabicSource("common.hours")} ${m} ${arabicSource("common.min")}`;
};
