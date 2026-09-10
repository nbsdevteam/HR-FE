import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm } from "../types";

export interface LeaveTypeFormErrors {
  name?: string;
  encashment_percentage?: string;
  min_service_months?: string;
}

/**
 * Mirrors the backend's own create-time validation (hand-off §4) so the form
 * can surface the same errors inline before a round-trip, and knows which of
 * them live behind the Advanced disclosure so that section can auto-expand.
 */
export const useLeaveTypeFormValidation = (form: NewLeaveTypeForm) => {
  const errors = useMemo<LeaveTypeFormErrors>(() => {
    const next: LeaveTypeFormErrors = {};

    if (!form.name_ar.trim() && !form.name_en.trim()) {
      next.name = arabicSource("settings.leave_type_name_required");
    }
    if (form.encashment_percentage < 0 || form.encashment_percentage > 100) {
      next.encashment_percentage = arabicSource("settings.encashment_percentage_range");
    }
    if (form.min_service_months < 0) {
      next.min_service_months = arabicSource("settings.min_service_months_negative");
    }

    return next;
  }, [form]);

  const hasAdvancedError = Boolean(errors.encashment_percentage || errors.min_service_months);
  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid, hasAdvancedError };
};
