import i18n from "@/i18n";
import type { HrApiError } from "@/shared/api/client";
import { errorMessage } from "./errorMessage";

const nextDay = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

/**
 * Message for a failed `/api/hr/payroll/payslips/generate` (or `/compute`).
 * Branches on `error.code`: `month_not_over` is a month still running in
 * Baghdad, and `month_end` is its last day — payslips open the day after.
 */
export const generateErrorMessage = (error: unknown): string => {
  const apiError = error as HrApiError | undefined;
  if (apiError?.code === "month_not_over") {
    const monthEnd = apiError.details?.month_end;
    if (typeof monthEnd === "string") {
      return i18n.t("payroll.error_month_not_over", { date: nextDay(monthEnd) });
    }
  }
  return errorMessage(error);
};
