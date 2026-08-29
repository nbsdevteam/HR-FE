import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { empDisplayName, resolveEmployeeShift, shiftToSchedule } from "@/shared/hooks";
import { formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import {
  calculateSalary,
  getShortfallRecords,
  getAbsenceRecords,
  getLeaveRecords,
  buildSettingsFromShift,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
  type ProcessedAttendanceRecord,
  type SalaryCalculation,
  type EmployeePayConfig,
  type MonthlyLedgerEntry,
} from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import type { PayrollDetailPanelProps } from "../types";

export const usePayrollDetailPanel = ({
  empId,
  onClose,
  payrollData,
  selectedMonth,
  employees,
  ledgers,
  onLedgerUpdate,
  dbShifts,
  dbDepartments,
  allowanceTypes,
  allEmployeeAllowances,
  deductionTypes,
  allEmployeeDeductions,
  allLoans,
  appSettings,
  holidayDates,
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

  // Must be declared before any early return (Rules of Hooks)
  const [excuseVersion, bumpExcuseVersion] = useReducer((x: number) => x + 1, 0);

  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);

  const selectedData = useMemo(
    () => payrollData.find((r: any) => r.empId === empId),
    [payrollData, empId],
  );

  // Recalculate salary live (respects excusedShortfall / excusedAbsence mutations)
  const empForCalc = useMemo(
    () => employees.find((e) => e.id === empId),
    [employees, empId],
  );
  const currentLedgerForCalc = useMemo(
    () => ledgers.find((l) => l.employee_id === empId && l.month_year === selectedMonth),
    [ledgers, empId, selectedMonth],
  );
  const liveCalc = useMemo(() => {
    if (!selectedData || !empForCalc) return null;
    const recs = selectedData.records as ProcessedAttendanceRecord[];
    const empShift = resolveEmployeeShift(empForCalc, dbDepartments, dbShifts);
    const empSchedule = empShift ? shiftToSchedule(empShift) : DEFAULT_SCHEDULE;
    const empSettings = empShift ? buildSettingsFromShift(empShift) : DEFAULT_SETTINGS;
    const liveEmpAllowances = allEmployeeAllowances
      .filter(a => a.employee_id === empForCalc.id)
      .map(a => {
        const aType = allowanceTypes.find(t => t.id === a.allowance_type_id);
        return { name: aType?.name_ar || arabicSource("common.allowance"), amount: a.amount, currency: a.currency };
      });
    const liveEmpDeductions = allEmployeeDeductions
      .filter(d => d.employee_id === empForCalc.id)
      .map(d => {
        const dType = deductionTypes.find(t => t.id === d.deduction_type_id);
        return {
          name: dType?.name_ar || arabicSource("common.deduction"),
          amount: d.amount,
          percentage: d.percentage,
          calcMethod: d.calc_method || dType?.calc_method || "fixed",
          percentageOf: dType?.percentage_of || "base_salary",
          currency: d.currency,
        };
      });
    const liveActiveLoan = allLoans.find(l => l.employee_id === empForCalc.id && l.status === "active");

    const config: EmployeePayConfig = {
      id: empForCalc.id,
      personId: String(empForCalc.person_id),
      name: empDisplayName(empForCalc),
      department: empForCalc.department,
      salarySlots: [{ currency: empForCalc.currency || "IQD", amount: empForCalc.monthly_salary || 0, overtimeRate: empForCalc.overtime_rate || 0 }],
      overtimeEnabled: empForCalc.overtime_enabled ?? false,
      schedule: empSchedule,
      allowances: liveEmpAllowances,
      deductions: liveEmpDeductions,
      activeLoanInstallment: liveActiveLoan?.installment_amount,
      activeLoanCurrency: liveActiveLoan?.currency,
      joinDate: empForCalc.join_date || undefined,
    };
    const ledgerEntry: MonthlyLedgerEntry = {
      absenceDays: currentLedgerForCalc?.absence_days || [],
      loanByCurrency: currentLedgerForCalc?.loan_by_currency || {},
      tipByCurrency: currentLedgerForCalc?.tip_by_currency || {},
      penaltyByCurrency: currentLedgerForCalc?.penalty_by_currency || {},
    };
    return calculateSalary(config, recs, selectedMonth, ledgerEntry, empSettings, holidayDates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedData, empForCalc, selectedMonth, currentLedgerForCalc, excuseVersion, dbDepartments, dbShifts, holidayDates, allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans]);

  const isOpen = !!(empId && selectedData && empForCalc);

  const records = isOpen ? (selectedData!.records as ProcessedAttendanceRecord[]) : [];
  // calc is guaranteed non-null when isOpen is true (all JSX usage is inside isOpen guard)
  const calc = (isOpen ? (liveCalc || selectedData!.calc) : null) as SalaryCalculation;

  const shortfallRecs = useMemo(
    () => (isOpen ? getShortfallRecords(records, DEFAULT_SETTINGS.targetWorkingHoursPerDay) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, records, excuseVersion],
  );
  const absenceRecs = useMemo(
    () => (isOpen ? getAbsenceRecords(records) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, records, excuseVersion],
  );
  const leaveRecs = useMemo(
    () => (isOpen ? getLeaveRecords(records) : []),
    [isOpen, records],
  );
  const paidLeaveCount = useMemo(() => leaveRecs.filter((r) => !r.isUnpaidLeave).length, [leaveRecs]);
  const unpaidLeaveCount = useMemo(() => leaveRecs.filter((r) => r.isUnpaidLeave).length, [leaveRecs]);

  const currentLedger = currentLedgerForCalc;

  const handleSaveLedger = useCallback(async () => {
    if (!empId) return;
    setLedgerSaving(true);
    try {
      const c = ledgerCurrency;
      const existingLoan = currentLedger?.loan_by_currency || {};
      const existingTip = currentLedger?.tip_by_currency || {};
      const existingPenalty = currentLedger?.penalty_by_currency || {};
      const payload = {
        employee_id: empId,
        month_year: selectedMonth,
        loan_by_currency: { ...existingLoan, [c]: ledgerLoan },
        tip_by_currency: { ...existingTip, [c]: ledgerTip },
        penalty_by_currency: { ...existingPenalty, [c]: ledgerPenalty },
      };

      await odooData.upsertMonthlyLedger(payload);
      await onLedgerUpdate();
      setEditingLedger(false);
    } catch (e: any) {
      console.error("Failed to save ledger:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_modifications") + " " + (e.message || arabicSource("payroll.an_unexpected_error_occurred")));
    } finally {
      setLedgerSaving(false);
    }
  }, [empId, ledgerCurrency, currentLedger, selectedMonth, ledgerLoan, ledgerTip, ledgerPenalty, onLedgerUpdate]);

  const excuseAbsence = useCallback((id: string) => {
    const rec = records.find((r) => r.id === id);
    if (rec) {
      rec.excusedAbsence = !rec.excusedAbsence;
      bumpExcuseVersion();
      if (empId) {
        odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_absence: rec.excusedAbsence }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, empId]);

  const excuseShortfall = useCallback((id: string) => {
    const rec = records.find((r) => r.id === id);
    if (rec) {
      rec.excusedShortfall = !rec.excusedShortfall;
      bumpExcuseVersion();
      if (empId) {
        odooData.excuseAttendance({ employee_id: empId, date: rec.date, excused_shortfall: rec.excusedShortfall }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, empId]);

  const avgHoursPerDay = calc && calc.daysWorked > 0 ? calc.totalHours / calc.daysWorked : 0;

  // Escape key to dismiss panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset ledger currency to employee's default when employee changes
  useEffect(() => {
    if (!empId) return;
    const empFound = employees.find((e) => e.id === empId);
    setLedgerCurrency((empFound?.currency as "IQD" | "USD") || "IQD");
    setShowShortfall(false);
    setShowAbsence(false);
    setShowCalendar(false);
  }, [empId, employees]);

  // Sync ledger values when employee/month/ledgers/currency change
  useEffect(() => {
    if (!empId) return;
    const cl = ledgers.find((l) => l.employee_id === empId && l.month_year === selectedMonth);
    const c = ledgerCurrency;
    setLedgerLoan(cl?.loan_by_currency?.[c] || 0);
    setLedgerTip(cl?.tip_by_currency?.[c] || 0);
    setLedgerPenalty(cl?.penalty_by_currency?.[c] || 0);
    setEditingLedger(false);
  }, [empId, selectedMonth, ledgers, ledgerCurrency]);

  return {
    absenceRecs,
    avgHoursPerDay,
    calc,
    currentLedger,
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
