import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { arabicSource } from "@/i18n/source";
import { usePublicLeaveBalances } from "./usePublicLeaveBalances";
import { usePublicLeaveEmployeeSearch } from "./usePublicLeaveEmployeeSearch";
import { usePublicLeaveInfo } from "./usePublicLeaveInfo";
import { usePublicLeaveRequestForm } from "./usePublicLeaveRequestForm";
import { usePublicLeaveStatus } from "./usePublicLeaveStatus";
import { usePublicLeaveVerification } from "./usePublicLeaveVerification";
import type { PublicLeaveStep } from "../types/publicLeave";

const DEFAULT_MIN_SEARCH_CHARS = 3;

export const usePublicLeaveRequestPage = () => {
  const [step, setStep] = useState<PublicLeaveStep>("search");

  const { token = "" } = useParams();

  const info = usePublicLeaveInfo(token);
  const minSearchChars = info.info?.min_search_chars || DEFAULT_MIN_SEARCH_CHARS;
  const search = usePublicLeaveEmployeeSearch(token, minSearchChars);
  const verification = usePublicLeaveVerification();
  const balances = usePublicLeaveBalances(token);
  const form = usePublicLeaveRequestForm(token);
  const trackSearch = usePublicLeaveEmployeeSearch(token, minSearchChars);
  const trackVerification = usePublicLeaveVerification();
  const trackStatus = usePublicLeaveStatus(token);

  const selectedLeaveType = useMemo(
    () => info.info?.leave_types.find((type) => type.id === form.form.leave_type_id) ?? null,
    [form.form.leave_type_id, info.info],
  );

  const selectedBalance = useMemo(
    () => balances.balances?.items.find((item) => item.leave_type_id === selectedLeaveType?.id) ?? null,
    [balances.balances, selectedLeaveType],
  );

  const formValidationError = useMemo(() => {
    if (!selectedLeaveType || !form.form.date_from) return arabicSource("public_leave.error_missing_params");
    if (selectedBalance && !selectedBalance.can_apply) {
      return selectedBalance.blocked_by_probation
        ? `${arabicSource("public_leave.balance_blocked_by_probation")} ${balances.balances?.probation_end_date || ""}`
        : arabicSource("public_leave.balance_no_remaining");
    }
    if (form.form.duration_unit === "hour") {
      if (!selectedLeaveType.allow_hourly) return arabicSource("public_leave.error_hourly_not_supported");
      const hours = Number(form.form.hours);
      if (!hours || hours <= 0) return arabicSource("public_leave.error_invalid_hours");
      const maxHours = info.info?.max_hours_per_request || 0;
      if (maxHours && hours > maxHours) {
        return `${arabicSource("public_leave.error_hours_exceed_maximum")} ${maxHours}`;
      }
    }
    if (selectedLeaveType.requires_attachment && !form.file) {
      return arabicSource("public_leave.error_attachment_required");
    }
    return "";
  }, [balances.balances, form.file, form.form, info.info, selectedBalance, selectedLeaveType]);

  const canSubmit = formValidationError === "";

  const proceedAfterVerification = useCallback(async (employeeId: number, verificationValue: string | undefined) => {
    await balances.load(employeeId, verificationValue);
    setStep("balances");
  }, [balances]);

  const confirmIdentity = useCallback(async (employeeId: number) => {
    return verification.attempt((verificationValue) => proceedAfterVerification(employeeId, verificationValue));
  }, [proceedAfterVerification, verification]);

  const handleSelectEmployee = useCallback((employeeId: number) => {
    const employee = search.results.find((item) => item.id === employeeId);
    if (!employee) return;
    search.selectEmployee(employee);
    if (!employee.verification_available) return;
    if (!info.info || info.info.verification_method === "none") {
      void confirmIdentity(employee.id);
    } else {
      setStep("verify");
    }
  }, [confirmIdentity, info.info, search]);

  const handleConfirmVerification = useCallback(() => {
    if (!search.selected) return;
    void confirmIdentity(search.selected.id);
  }, [confirmIdentity, search.selected]);

  const handleBackFromVerify = useCallback(() => {
    search.clearSelection();
    verification.reset();
    setStep("search");
  }, [search, verification]);

  const handleContinueFromBalances = useCallback(() => {
    setStep("form");
  }, []);

  const handleGoToReview = useCallback(() => {
    if (!canSubmit) return;
    setStep("review");
  }, [canSubmit]);

  const handleBackFromReview = useCallback(() => {
    setStep("form");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!search.selected || !selectedLeaveType || !canSubmit) return;
    const verificationValue = verification.value.trim() || undefined;
    const ok = await form.submit(search.selected.id, verificationValue, selectedLeaveType.id);
    if (ok) setStep("success");
  }, [canSubmit, form, search.selected, selectedLeaveType, verification.value]);

  const handleGoToTrack = useCallback(() => {
    setStep("track");
  }, []);

  const handleBackFromTrack = useCallback(() => {
    trackSearch.reset();
    trackVerification.reset();
    trackStatus.reset();
    setStep("search");
  }, [trackSearch, trackStatus, trackVerification]);

  const handleTrackCheckStatus = useCallback((employeeId: number) => {
    void trackVerification.attempt((verificationValue) => trackStatus.load(employeeId, verificationValue));
  }, [trackStatus, trackVerification]);

  const handleTrackSelectEmployee = useCallback((employeeId: number) => {
    const employee = trackSearch.results.find((item) => item.id === employeeId);
    if (!employee) return;
    trackSearch.selectEmployee(employee);
    trackVerification.reset();
    if (!employee.verification_available) return;
    // No verification required by this link — go straight to the results
    // instead of making the employee click a second "check status" button.
    if (!info.info || info.info.verification_method === "none") {
      handleTrackCheckStatus(employee.id);
    }
  }, [handleTrackCheckStatus, info.info, trackSearch, trackVerification]);

  return {
    balances,
    canSubmit,
    form,
    formValidationError,
    handleBackFromReview,
    handleBackFromTrack,
    handleBackFromVerify,
    handleConfirmVerification,
    handleContinueFromBalances,
    handleGoToReview,
    handleGoToTrack,
    handleSelectEmployee,
    handleSubmit,
    handleTrackCheckStatus,
    handleTrackSelectEmployee,
    info,
    minSearchChars,
    search,
    selectedBalance,
    selectedLeaveType,
    step,
    token,
    trackSearch,
    trackStatus,
    trackVerification,
    verification,
  };
};
