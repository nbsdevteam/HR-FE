import { useState, useMemo, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { useLeaveBalanceSummary } from "@/shared/hooks";
import type { DbLeaveType, DbLeaveBalance, DbLeaveSettings } from "@/shared/hooks";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { earliestLeaveStartDate, firstAccrualDate, formatLeaveDays } from "../utils/accrual";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";
import { useLeaveHourlyAttachment } from "./useLeaveHourlyAttachment";

type UseLeaveRequestFormArgs = {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  selfOnly: boolean;
  linkError: string | null;
  settings: DbLeaveSettings | null;
  onSubmit: () => Promise<void>;
};

/** Iraqi weekend — Friday (5) and Saturday (6) are not working days. */
const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6;
};

/**
 * Form state, derived duration/balance figures and submit handling for the new
 * leave request modal — kept out of the component so the modal stays a view.
 */
export const useLeaveRequestForm = ({
  employees,
  leaveTypes,
  balances,
  selfOnly,
  linkError,
  settings,
  onSubmit,
}: UseLeaveRequestFormArgs) => {
  const selfEmployee = selfOnly ? employees[0] || null : null;
  const selfEmployeeId = selfEmployee ? String(selfEmployee.id) : "";

  const [employeeId, setEmployeeId] = useState(selfEmployeeId);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"morning" | "afternoon">("morning");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedType = leaveTypes.find((leaveType) => leaveType.id === leaveTypeId) ?? null;

  const hourly = useLeaveHourlyAttachment({ selectedType, settings });
  const isHourly = hourly.durationUnit === "hour";

  // Accrual/probation figures for whoever the request is for. Self-service
  // agents omit `employee_id` — sending it needs approver rights they lack.
  const { summary: balanceSummary } = useLeaveBalanceSummary(
    selfOnly ? null : employeeId || null,
    { enabled: selfOnly || Boolean(employeeId) },
  );

  // Working days between the two dates, excluding the weekend.
  const days = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      if (!isWeekend(cursor)) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, isHalfDay]);

  /** The `/leave/balances` row for the selected type, when the summary loaded. */
  const balanceItem = useMemo(
    () => balanceSummary?.items.find((item) => item.leave_type_id === leaveTypeId) ?? null,
    [balanceSummary, leaveTypeId],
  );

  const probationEndDate = balanceSummary?.probation_end_date ?? null;
  const blockedByProbation = Boolean(balanceItem?.blocked_by_probation);

  /**
   * `blocked_by_probation` is a *today* snapshot while the backend gates on the
   * leave start date, so the form stays open and only the earliest start date
   * moves — booking 1 April while on probation until 31 March is legitimate.
   */
  const minStartDate = useMemo(
    () => (blockedByProbation ? earliestLeaveStartDate(probationEndDate) : ""),
    [blockedByProbation, probationEndDate],
  );

  /** True once accrual has granted nothing at all — the employee's first month. */
  const firstAccrualOn = useMemo(() => {
    if (!balanceItem?.accrual_enabled) return "";
    if (balanceItem.accrued > 0 || balanceItem.accrual_periods > 0) return "";
    return firstAccrualDate(balanceSummary?.joining_date ?? null);
  }, [balanceItem, balanceSummary]);

  /** Zero balance only blocks types that actually consume an allocation. */
  const outOfBalance = Boolean(
    balanceItem && balanceItem.requires_allocation && balanceItem.remaining <= 0,
  );

  // Remaining balance for the selected employee + leave type.
  const remainingBalance = useMemo(() => {
    if (!leaveTypeId || !selectedType) return null;
    // `remaining` already nets off pending requests — prefer it over the
    // legacy per-year row whenever the balances summary is available.
    if (balanceItem) return balanceItem.remaining;
    if (!employeeId) return null;
    const balance = balances.find(
      (b) =>
        b.employee_id === employeeId &&
        (b.leave_type_id === leaveTypeId || b.leave_type === selectedType.name_ar),
    );
    if (!balance) {
      // No balance record — if the leave type normally allocates days, treat as 0
      // remaining (unpaid leave with default_days_per_year=30 still needs a
      // balance record to track usage).
      return (selectedType as any).default_days_per_year > 0 ? 0 : null;
    }
    return balance.total_days + balance.carryover_days + balance.accrued_days - balance.used_days;
  }, [balanceItem, employeeId, leaveTypeId, balances, selectedType]);

  const handleSelectLeaveType = useCallback((leaveType: DbLeaveType) => {
    setLeaveTypeId(leaveType.id);
    if (!leaveType.allow_half_day) setIsHalfDay(false);
    hourly.resetForType(leaveType);
  }, [hourly]);

  const handleEmployeeChange = useCallback((id: string): void => {
    setEmployeeId(String(id));
  }, []);

  const handleIsHalfDayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setIsHalfDay(e.target.checked);
  }, []);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setStartDate(e.target.value);
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setEndDate(e.target.value);
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReason(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (selfOnly && (linkError || !selfEmployee)) {
      setError(linkError || "Your user account is not linked to an employee. Please contact HR.");
      return;
    }
    if ((!selfOnly && !employeeId) || !leaveTypeId || !startDate) {
      setError(arabicSource("common.please_fill_out_all_required_fields"));
      return;
    }
    if (!selectedType) return;

    // Deliberately not blocked client-side on `outOfBalance` (still shown as
    // a warning above): the backend now routes an insufficient-balance
    // Annual Leave request into a manager-excuse request instead of
    // rejecting it outright (backend v1.16.0 §2.3) — the backend, not this
    // form, is the source of truth for whether that request is allowed.

    if (minStartDate && startDate < minStartDate) {
      setError(
        `${arabicSource("leave.error_probation_block")} ${arabicSource("leave.earliest_start_date")} ${minStartDate}`,
      );
      return;
    }

    // Requested days over the balance is a warning, not a block: Odoo counts
    // working days against the work calendar, so the FE estimate can differ —
    // the backend decides (backend §12).

    const hourlyError = hourly.validate();
    if (hourlyError) {
      setError(hourlyError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Self-only: omit employee_id so backend uses current_employee().
      // List + manage_types: pass selected employee (existing HR behavior).
      // List without manage_types: still pass selection for UI consistency;
      // backend ignores employee_id unless manage_types (unchanged model).
      const payload: Parameters<typeof odooData.requestLeave>[0] = {
        leave_type_id: selectedType.id,
        date_from: startDate,
        date_to: isHourly || isHalfDay ? startDate : (endDate || startDate),
        reason: reason || null,
        half_day: isHalfDay && !isHourly,
        ...odooData.leaveRequestEmployeeIdField(selfOnly, employeeId),
        ...(await hourly.buildRequestFields()),
      };
      const created = await odooData.requestLeave(payload);
      setSaving(false);
      hourly.reset();
      if (created.excuse.active && created.excuse.state === "pending") {
        localizedAlert(arabicSource("leave.excuse_pending_notice"));
      }
      await onSubmit();
    } catch (e: any) {
      setError(leaveErrorMessage(e, "فشل إنشاء طلب الإجازة"));
      setSaving(false);
    }
  }, [
    employeeId, endDate, hourly, isHalfDay, isHourly, leaveTypeId, linkError,
    minStartDate, onSubmit, reason, selectedType, selfEmployee,
    selfOnly, startDate,
  ]);

  useEffect(() => {
    if (selfOnly && selfEmployeeId) {
      setEmployeeId(selfEmployeeId);
    }
  }, [selfOnly, selfEmployeeId]);

  const balanceWarning =
    !isHourly && remainingBalance !== null && days > remainingBalance
      ? `${arabicSource("leave.days_exceed_available_balance")} (${formatLeaveDays(remainingBalance)} ${arabicSource("common.days_2")})`
      : "";

  return {
    balanceItem,
    balanceWarning,
    blockedByProbation,
    days,
    employeeId,
    firstAccrualOn,
    minStartDate,
    outOfBalance,
    probationEndDate,
    endDate,
    error,
    halfDayPeriod,
    handleEmployeeChange,
    handleEndDateChange,
    handleIsHalfDayChange,
    handleReasonChange,
    handleSelectLeaveType,
    handleStartDateChange,
    handleSubmit,
    hourly,
    isHalfDay,
    isHourly,
    leaveTypeId,
    reason,
    remainingBalance,
    saving,
    selectedType,
    selfEmployee,
    setHalfDayPeriod,
    startDate,
  };
};
