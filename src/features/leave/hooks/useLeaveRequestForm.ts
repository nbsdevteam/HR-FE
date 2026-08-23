import { useState, useMemo, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { indexBy } from "@/shared/utils/collections";
import type { DbLeaveType, DbLeaveBalance } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type UseLeaveRequestFormArgs = {
  employees: any[];
  leaveTypes: DbLeaveType[];
  balances: DbLeaveBalance[];
  selfOnly: boolean;
  linkError: string | null;
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

  const leaveTypesById = useMemo(
    () => indexBy(leaveTypes, (leaveType) => leaveType.id),
    [leaveTypes],
  );

  const selectedType = leaveTypesById.get(leaveTypeId) ?? null;

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

  // Remaining balance for the selected employee + leave type.
  const remainingBalance = useMemo(() => {
    if (!employeeId || !leaveTypeId || !selectedType) return null;
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
  }, [employeeId, leaveTypeId, balances, selectedType]);

  const handleSelectLeaveType = useCallback((leaveType: DbLeaveType) => {
    setLeaveTypeId(leaveType.id);
    if (!leaveType.allow_half_day) setIsHalfDay(false);
  }, []);

  const handleEmployeeChange = useCallback((id: string): void => {
    setEmployeeId(String(id));
  }, []);

  const handleIsHalfDayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setIsHalfDay(e.target.checked);
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

    if (remainingBalance !== null && days > remainingBalance) {
      setError(`${arabicSource("leave.remaining_balance")}${remainingBalance} ${arabicSource("leave.day_is_not_enough_for_the_required_number_of_days")}${days} ${arabicSource("common.days_3")}`);
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
        date_to: isHalfDay ? startDate : (endDate || startDate),
        reason: reason || null,
        half_day: isHalfDay,
        ...odooData.leaveRequestEmployeeIdField(selfOnly, employeeId),
      };
      await odooData.requestLeave(payload);
      setSaving(false);
      await onSubmit();
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء طلب الإجازة");
      setSaving(false);
    }
  }, [
    days, employeeId, endDate, isHalfDay, leaveTypeId, linkError, onSubmit,
    reason, remainingBalance, selectedType, selfEmployee, selfOnly, startDate,
  ]);

  useEffect(() => {
    if (selfOnly && selfEmployeeId) {
      setEmployeeId(selfEmployeeId);
    }
  }, [selfOnly, selfEmployeeId]);

  return {
    days,
    employeeId,
    endDate,
    error,
    halfDayPeriod,
    handleEmployeeChange,
    handleEndDateChange,
    handleIsHalfDayChange,
    handleReasonChange,
    handleSelectLeaveType,
    handleSubmit,
    isHalfDay,
    leaveTypeId,
    reason,
    remainingBalance,
    saving,
    selectedType,
    selfEmployee,
    setHalfDayPeriod,
    setStartDate,
    startDate,
  };
};
