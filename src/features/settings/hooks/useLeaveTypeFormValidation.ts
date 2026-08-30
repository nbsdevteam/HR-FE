import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm } from "../types";

export interface LeaveTypeFormErrors {
  name?: string;
  encashment_percentage?: string;
  days_per_request?: string;
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
    if (form.is_encashable && (form.encashment_percentage < 0 || form.encashment_percentage > 100)) {
      next.encashment_percentage = arabicSource("settings.encashment_percentage_range");
    }
    // `max_days_per_request` of 0 means "no cap set yet", not "cap of zero" —
    // only flag the range once a real cap is chosen.
    if (form.max_days_per_request > 0 && form.min_days_per_request > form.max_days_per_request) {
      next.days_per_request = arabicSource("settings.days_per_request_range");
    }

    return next;
  }, [form]);

  const hasAdvancedError = Boolean(errors.encashment_percentage || errors.days_per_request);
  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid, hasAdvancedError };
};
