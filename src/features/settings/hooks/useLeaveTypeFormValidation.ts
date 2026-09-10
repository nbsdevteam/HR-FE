import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm } from "../types";

export interface LeaveTypeFormErrors {
  name?: string;
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

    if (!form.name_ar.trim() || !form.name_en.trim()) {
      next.name = arabicSource("settings.leave_type_name_required");
    }
    if (form.min_service_months < 0) {
      next.min_service_months = arabicSource("settings.min_service_months_negative");
    }

    return next;
  }, [form]);

  const hasAdvancedError = Boolean(errors.min_service_months);
  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid, hasAdvancedError };
};
