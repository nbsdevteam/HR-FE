import { useCallback, useEffect, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  useEmployees, empDisplayName, useShifts, resolveEmployeeShift, shiftToSchedule,
  useHierarchyData, usePublicHolidays, useConfigurations, useAllowanceTypes,
  useEmployeeAllowances, useDeductionTypes, useEmployeeDeductions, useLoans,
  useMonthlyRecords, useMonthlyLedgers, useAttendanceRecords, useLeaveRequests,
  useLeaveTypes,
} from "@/shared/hooks";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import type { DbEmployee } from "@/shared/hooks";
import {
  processAttendanceRecords,
  calculateSalary,
  formatCurrency,
  buildLeaveDateMap,
  applyLeaveToRecords,
  buildSettingsFromShift,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
  type RawAttendanceRecord,
  type ProcessedAttendanceRecord,
  type SalaryCalculation,
  type EmployeePayConfig,
  type MonthlyLedgerEntry,
  type LeaveRequest,
} from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import type { PayrollTabId } from "../types";

export const usePayrollPage = () => {
  const { employees, loading: empLoading } = useEmployees();
  const { settings: appSettings } = useAppSettings();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const { holidays: dbHolidays } = usePublicHolidays();
  const { getNumber, getValue } = useConfigurations();
  const { types: allowanceTypes } = useAllowanceTypes();
  const { allowances: allEmployeeAllowances } = useEmployeeAllowances();
  const { types: deductionTypes } = useDeductionTypes();
  const { deductions: allEmployeeDeductions } = useEmployeeDeductions();
  const { loans: allLoans } = useLoans();
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [activeTab, setActiveTab] = useState<PayrollTabId>("overview");
  const { records: monthlyRecords, loading: mrLoading, refetch: refetchMonthly } = useMonthlyRecords();
  const { ledgers, loading: ledLoading, refetch: refetchLedgers } = useMonthlyLedgers();
  const { records: attRecords, loading: attLoading, refetch: refetchAtt } = useAttendanceRecords();
  const { requests: leaveReqRows, loading: lvLoading } = useLeaveRequests({ status: "مقبول" });
  const { types: leaveTypes } = useLeaveTypes();
  const leaveRequests = leaveReqRows as LeaveRequest[];
  const leaveTypeInfos = useMemo(
    () => leaveTypes.map((t) => ({ code: t.code || t.id, name_ar: t.name_ar || t.name_en || "", is_paid: Boolean(t.is_paid) })),
    [leaveTypes],
  );
  const loading = empLoading || mrLoading || ledLoading || attLoading || lvLoading;
  const [selectedMonth, setSelectedMonth] = useState("");

  // Detail panel state
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [savingPayslips, setSavingPayslips] = useState(false);
  const [payslipsSaved, setPayslipsSaved] = useState(false);


  const empMap = useMemo(() => {
    const m: Record<string, DbEmployee> = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    monthlyRecords.forEach((r) => months.add(r.month_year));
    attRecords.forEach((r) => {
      const m = r.date?.substring(0, 7);
      if (m) months.add(m);
    });
    // Also add current month
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return [...months].sort().reverse();
  }, [monthlyRecords, attRecords]);

  // Create holiday set for O(1) lookups
  const holidayDates = useMemo(() => new Set(dbHolidays.map(h => h.date)), [dbHolidays]);

  // Build payroll data for selected month
  const payrollData = useMemo(() => {
    const monthAtt = attRecords.filter((r) => r.date?.startsWith(selectedMonth));
    const monthRecs = monthlyRecords.filter((r) => r.month_year === selectedMonth);

    const empIds = new Set<string>();
    monthAtt.forEach((r) => empIds.add(r.employee_id));
    monthRecs.forEach((r) => empIds.add(r.employee_id));

    const rows: Array<{
      empId: string;
      name: string;
      department: string;
      basicSalary: number;
      currency: string;
      daysWorked: number;
      totalHours: number;
      overtime: number;
      shortfall: number;
      absences: number;
      netSalary: number;
      calc: SalaryCalculation | null;
      records: ProcessedAttendanceRecord[];
    }> = [];

    for (const empId of empIds) {
      const emp = empMap[empId];
      if (!emp) continue;

      // Build employee config with dynamic shift
      const empShift = resolveEmployeeShift(emp, dbDepartments, dbShifts);
      const empSchedule = empShift ? shiftToSchedule(empShift) : DEFAULT_SCHEDULE;
      const empSettings = empShift ? buildSettingsFromShift(empShift) : DEFAULT_SETTINGS;

      // Build allowances for this employee
      const empAllowances = allEmployeeAllowances
        .filter(a => a.employee_id === empId)
        .map(a => {
          const aType = allowanceTypes.find(t => t.id === a.allowance_type_id);
          return { name: aType?.name_ar || arabicSource("common.allowance"), amount: a.amount, currency: a.currency };
        });

      // Build deductions for this employee
      const empDeductions = allEmployeeDeductions
        .filter(d => d.employee_id === empId)
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

      // Find active loan for this employee
      const activeLoan = allLoans.find(l => l.employee_id === empId && l.status === "active");

      const config: EmployeePayConfig = {
        id: emp.id,
        personId: String(emp.person_id),
        name: empDisplayName(emp),
        department: emp.department,
        salarySlots: [
          {
            currency: emp.currency || "IQD",
            amount: emp.monthly_salary || 0,
            overtimeRate: emp.overtime_rate || 0,
          },
        ],
        overtimeEnabled: emp.overtime_enabled ?? false,
        schedule: empSchedule,
        allowances: empAllowances,
        deductions: empDeductions,
        activeLoanInstallment: activeLoan?.installment_amount,
        activeLoanCurrency: activeLoan?.currency,
        joinDate: emp.join_date || undefined,
      };

      // Build raw records from DB attendance
      const empAtt = monthAtt.filter((r) => r.employee_id === empId);
      const rawRecs: RawAttendanceRecord[] = empAtt.map((a) => ({
        personId: String(emp.person_id),
        name: empDisplayName(emp),
        department: emp.department,
        time: `${a.date} ${a.check_in_time || a.check_out_time || "00:00:00"}`,
        attendanceStatus: a.check_in_time ? "Check-in" as const : "Check-out" as const,
      }));

      // Build both check-in and check-out records
      const rawRecsAll: RawAttendanceRecord[] = [];
      empAtt.forEach((a) => {
        if (a.check_in_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} ${a.check_in_time}`,
            attendanceStatus: "Check-in",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
        if (a.check_out_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} ${a.check_out_time}`,
            attendanceStatus: "Check-out",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
        if (!a.check_in_time && !a.check_out_time) {
          rawRecsAll.push({
            personId: String(emp.person_id),
            name: empDisplayName(emp),
            time: `${a.date} 00:00:00`,
            attendanceStatus: "None",
            excused_late: a.excused_late || false,
            excused_absence: a.excused_absence || false,
            excused_shortfall: a.excused_shortfall || false,
          });
        }
      });

      let processed = processAttendanceRecords(rawRecsAll, config, selectedMonth, empSettings, holidayDates);

      // Align with Odoo day status (absent / holiday / leave / excused) when present.
      const statusByDate = new Map(empAtt.map((a) => [a.date, a]));
      processed = processed.map((rec) => {
        const a = statusByDate.get(rec.date);
        if (!a) return rec;
        const st = String(a.status || "");
        if (st === "holiday" && !rec.checkInTime) {
          return { ...rec, status: "holiday" as const, isScheduledWorkingDay: false, workingHours: 0 };
        }
        if (st === "leave" && !rec.checkInTime) {
          return {
            ...rec,
            status: "leave" as const,
            isLeaveDay: true,
            excusedAbsence: true,
            workingHours: 0,
          };
        }
        if ((st === "absent" || st === "absent_due_to_late_threshold") && !rec.checkInTime) {
          return {
            ...rec,
            status: st as ProcessedAttendanceRecord["status"],
            absenceReason: "no_punches",
            excusedAbsence: Boolean(a.excused_absence) || rec.excusedAbsence,
          };
        }
        if (a.excused_absence) return { ...rec, excusedAbsence: true };
        return rec;
      });

      // Apply approved leave (paid/unpaid) using leave-type is_paid flags.
      const leaveDateMap = buildLeaveDateMap(leaveRequests, empId, selectedMonth, leaveTypeInfos);
      if (Object.keys(leaveDateMap).length > 0) {
        processed = applyLeaveToRecords(processed, leaveDateMap);
      }

      // Get ledger
      const empLedger = ledgers.find(
        (l) => l.employee_id === empId && l.month_year === selectedMonth
      );
      const ledgerEntry: MonthlyLedgerEntry = {
        absenceDays: empLedger?.absence_days || [],
        loanByCurrency: empLedger?.loan_by_currency || {},
        tipByCurrency: empLedger?.tip_by_currency || {},
        penaltyByCurrency: empLedger?.penalty_by_currency || {},
      };

      const calc = calculateSalary(config, processed, selectedMonth, ledgerEntry, empSettings, holidayDates);

      const primaryCurrency = emp.currency || "IQD";
      const primaryCalc = calc.salaryByCurrency[primaryCurrency];

      rows.push({
        empId,
        name: empDisplayName(emp),
        department: emp.department || "—",
        basicSalary: emp.monthly_salary || 0,
        currency: primaryCurrency,
        daysWorked: calc.daysWorked,
        totalHours: calc.totalHours,
        overtime: calc.overtimeHours,
        shortfall: calc.shortfallHours,
        absences: calc.absenceDays.length,
        netSalary: primaryCalc?.netSalary || 0,
        calc,
        records: processed,
      });
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [attRecords, monthlyRecords, selectedMonth, empMap, ledgers, leaveRequests, leaveTypeInfos, holidayDates, allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans, dbDepartments, dbShifts]);

  // Stats
  const totalBasic = payrollData.reduce((s, r) => s + r.basicSalary, 0);
  const totalNet = payrollData.reduce((s, r) => s + r.netSalary, 0);
  const totalDeductions = totalBasic - totalNet;
  const totalEmployees = payrollData.length;

  // Persist payslips
  const handleSavePayslips = useCallback(async () => {
    if (payrollData.length === 0) return;
    setSavingPayslips(true);
    try {
      const rows = payrollData.map((row: any) => ({
        employee_id: row.empId,
        month: selectedMonth,
        basic_salary: row.basicSalary,
        currency: row.currency,
        days_worked: row.daysWorked,
        total_hours: row.totalHours,
        overtime_hours: row.overtime,
        shortfall_hours: row.shortfall,
        absence_days: row.absences,
        net_salary: row.netSalary,
        late_deduction: row.calc?.salaryByCurrency?.[row.currency]?.lateDeduction || 0,
        shortfall_deduction: row.calc?.salaryByCurrency?.[row.currency]?.shortfallDeduction || 0,
        absence_deduction: row.calc?.salaryByCurrency?.[row.currency]?.absenceDeduction || 0,
        overtime_payment: row.calc?.salaryByCurrency?.[row.currency]?.overtimePayment || 0,
        generated_at: new Date().toISOString(),
      }));

      await odooData.generatePayslips({
        month: selectedMonth,
        payslips: rows,
        replace_month: true,
      });

      setPayslipsSaved(true);
      setTimeout(() => setPayslipsSaved(false), 3000);
    } catch (e: any) {
      console.error("Failed to save payslips:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_statements") + " " + e.message);
    }
    setSavingPayslips(false);
  }, [payrollData, selectedMonth]);

  /** Server-side compute (attendance/leave/holiday) — same snapshot contract. */
  const handleServerComputePayslips = useCallback(async () => {
    if (!selectedMonth) return;
    setSavingPayslips(true);
    try {
      await odooData.computePayrollServer(selectedMonth);
      setPayslipsSaved(true);
      setTimeout(() => setPayslipsSaved(false), 3000);
      localizedAlert("Server payroll computed");
    } catch (e: any) {
      console.error("Server payroll compute failed:", e.message);
      localizedAlert(arabicSource("payroll.error_saving_statements") + " " + e.message);
    }
    setSavingPayslips(false);
  }, [selectedMonth]);



  useEffect(() => {
    if (selectedMonth) return;
    if (monthlyRecords.length > 0) {
      const months = [...new Set(monthlyRecords.map((r) => r.month_year))].sort().reverse();
      setSelectedMonth(months[0]);
    } else {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
  }, [monthlyRecords, selectedMonth]);

  return {
    activeTab,
    allEmployeeAllowances,
    allEmployeeDeductions,
    allLoans,
    allowanceTypes,
    appSettings,
    availableMonths,
    dbDepartments,
    dbHolidays,
    dbShifts,
    deductionTypes,
    displayMonth,
    employees,
    holidayDates,
    handleSavePayslips,
    handleServerComputePayslips,
    ledgers,
    loading,
    payrollData,
    payslipsSaved,
    refetchLedgers,
    savingPayslips,
    selectedEmpId,
    selectedMonth,
    setActiveTab,
    setSelectedEmpId,
    setSelectedMonth,
    totalBasic,
    totalDeductions,
    totalEmployees,
    totalNet,
  };
};
