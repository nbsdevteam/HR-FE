import { useCallback, useEffect, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import { getShortfallRecords, getAbsenceRecords, getLeaveRecords, DEFAULT_SETTINGS } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import type { PayrollDetailPanelProps } from "../types";
import { usePayrollEmployeeDetail } from "./usePayrollEmployeeDetail";
import { mapPayrollDetailToCalc, mapPayrollDetailToRecords } from "../utils/mapPayrollDetail";
import { errorMessage } from "../utils/errorMessage";

export const usePayrollDetailPanel = ({
  empId,
  onClose,
  selectedMonth,
  onLedgerUpdate,
  appSettings,
}: PayrollDetailPanelProps) => {
  const [showShortfall, setShowShortfall] = useState(false);
  const [showAbsence, setShowAbsence] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingLedger, setEditingLedger] = useState(false);
  const [ledgerSaving, setLedgerSaving] = useState(false);
  const [ledgerLoan, setLedgerLoan] = useState(0);
  const [ledgerTip, setLedgerTip] = useState(0);
  const [ledgerPenalty, setLedgerPenalty] = useState(0);
  const [ledgerCurrency, setLedgerCurrency] = useState<"IQD" | "USD">("IQD");

  const { detail, detailLoading, refetchDetail } = usePayrollEmployeeDetail(empId, selectedMonth);

  const calc = useMemo(() => (detail ? mapPayrollDetailToCalc(detail) : null), [detail]);
  const records = useMemo(() => (detail ? mapPayrollDetailToRecords(detail) : []), [detail]);
  const selectedData = useMemo(
    () => (detail ? { name: detail.employee.name, department: detail.calculation.department_name } : null),
    [detail],
  );

  const shortfallRecs = useMemo(
    () => getShortfallRecords(records, DEFAULT_SETTINGS.targetWorkingHoursPerDay),
    [records],
  );
  const absenceRecs = useMemo(() => getAbsenceRecords(records), [records]);
  const leaveRecs = useMemo(() => getLeaveRecords(records), [records]);
  const paidLeaveCount = useMemo(() => leaveRecs.filter((r) => !r.isUnpaidLeave).length, [leaveRecs]);
  const unpaidLeaveCount = useMemo(() => leaveRecs.filter((r) => r.isUnpaidLeave).length, [leaveRecs]);

  const isOpen = Boolean(empId);
  const currentLedger = detail?.ledger ?? undefined;
  const avgHoursPerDay = calc && calc.daysWorked > 0 ? calc.totalHours / calc.daysWorked : 0;

  const displayMonth = useCallback(
    (m: string) => formatMonthYear(m, appSettings.monthFormat),
    [appSettings.monthFormat],
  );

  const handleSaveLedger = useCallback(async (): Promise<void> => {
    if (!empId) return;
    setLedgerSaving(true);
    try {
      const c = ledgerCurrency;
      const existingLoan = currentLedger?.loan_by_currency || {};
      const existingTip = currentLedger?.tip_by_currency || {};
      const existingPenalty = currentLedger?.penalty_by_currency || {};
      await odooData.upsertMonthlyLedger({
        employee_id: empId,
        month_year: selectedMonth,
        loan_by_currency: { ...existingLoan, [c]: ledgerLoan },
        tip_by_currency: { ...existingTip, [c]: ledgerTip },
        penalty_by_currency: { ...existingPenalty, [c]: ledgerPenalty },
      });
      refetchDetail();
      onLedgerUpdate();
      setEditingLedger(false);
    } catch (e: unknown) {
      const message = errorMessage(e);
      console.error("Failed to save ledger:", message);
      localizedAlert(`${arabicSource("payroll.error_saving_modifications")} ${message}`);
    } finally {
      setLedgerSaving(false);
    }
  }, [empId, ledgerCurrency, currentLedger, selectedMonth, ledgerLoan, ledgerTip, ledgerPenalty, onLedgerUpdate, refetchDetail]);

  const excuseAbsence = useCallback((id: string): void => {
    const rec = records.find((r) => r.id === id);
    if (!rec || !empId) return;
    odooData
      .excuseAttendance({ employee_id: empId, date: rec.date, excused_absence: !rec.excusedAbsence })
      .then(refetchDetail)
      .catch(() => {});
  }, [records, empId, refetchDetail]);

  const excuseShortfall = useCallback((id: string): void => {
    const rec = records.find((r) => r.id === id);
    if (!rec || !empId) return;
    odooData
      .excuseAttendance({ employee_id: empId, date: rec.date, excused_shortfall: !rec.excusedShortfall })
      .then(refetchDetail)
      .catch(() => {});
  }, [records, empId, refetchDetail]);

  // Escape key to dismiss panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset transient panel state when the employee changes
  useEffect(() => {
    if (!empId) return;
    setShowShortfall(false);
    setShowAbsence(false);
    setShowCalendar(false);
    setEditingLedger(false);
  }, [empId]);

  // Sync ledger values when the detail response (employee/month/ledger/currency) changes
  useEffect(() => {
    if (!empId) return;
    const c = ledgerCurrency;
    setLedgerLoan(currentLedger?.loan_by_currency?.[c] || 0);
    setLedgerTip(currentLedger?.tip_by_currency?.[c] || 0);
    setLedgerPenalty(currentLedger?.penalty_by_currency?.[c] || 0);
  }, [empId, currentLedger, ledgerCurrency]);

  return {
    absenceRecs,
    avgHoursPerDay,
    calc,
    currentLedger,
    detailLoading,
    displayMonth,
    editingLedger,
    excuseAbsence,
    excuseShortfall,
    handleSaveLedger,
    isOpen,
    leaveRecs,
    ledgerCurrency,
    ledgerLoan,
    ledgerPenalty,
    ledgerSaving,
    ledgerTip,
    paidLeaveCount,
    records,
    selectedData,
    setEditingLedger,
    setLedgerCurrency,
    setLedgerLoan,
    setLedgerPenalty,
    setLedgerTip,
    setShowAbsence,
    setShowCalendar,
    setShowShortfall,
    shortfallRecs,
    showAbsence,
    showCalendar,
    showShortfall,
    unpaidLeaveCount,
  };
};
