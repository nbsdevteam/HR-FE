import { useCallback, useEffect, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  useEmployees, useShifts,
  useHierarchyData, usePublicHolidays, useConfigurations, useAllowanceTypes,
  useEmployeeAllowances, useDeductionTypes, useEmployeeDeductions, useLoans,
  useMonthlyRecords, useMonthlyLedgers, useAttendanceRecords, useLeaveRequests,
  useLeaveTypes,
} from "@/shared/hooks";
import { useAppSettings, formatMonthYear } from "@/app/providers";
import { localizedAlert } from "@/i18n/native";
import type { DbEmployee } from "@/shared/hooks";
import { type LeaveRequest } from "@/features/payroll";
import { buildPayrollRow, type PayrollRow } from "../utils/buildPayrollRow";
import { arabicSource } from "@/i18n/source";
import type { PayrollTabId } from "../types";

export const usePayrollPage = () => {
  const { employees, loading: empLoading } = useEmployees();
  const { settings: appSettings } = useAppSettings();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const { holidays: dbHolidays } = usePublicHolidays();
  useConfigurations();
  const { types: allowanceTypes } = useAllowanceTypes();
  const { allowances: allEmployeeAllowances } = useEmployeeAllowances();
  const { types: deductionTypes } = useDeductionTypes();
  const { deductions: allEmployeeDeductions } = useEmployeeDeductions();
  const { loans: allLoans } = useLoans();
  const displayMonth = (m: string) => formatMonthYear(m, appSettings.monthFormat);
  const [activeTab, setActiveTab] = useState<PayrollTabId>("overview");
  const { records: monthlyRecords, loading: mrLoading } = useMonthlyRecords();
  const { ledgers, loading: ledLoading, refetch: refetchLedgers } = useMonthlyLedgers();
  const { records: attRecords, loading: attLoading } = useAttendanceRecords();
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

    const rows: PayrollRow[] = [];

    for (const empId of empIds) {
      const row = buildPayrollRow(
        empId, empMap, dbDepartments, dbShifts,
        allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans,
        monthAtt, selectedMonth, holidayDates, leaveRequests, leaveTypeInfos, ledgers,
      );
      if (row) rows.push(row);
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [attRecords, monthlyRecords, selectedMonth, empMap, ledgers, leaveRequests, leaveTypeInfos, holidayDates, allEmployeeAllowances, allowanceTypes, allEmployeeDeductions, deductionTypes, allLoans, dbDepartments, dbShifts]);

  // Stats
  const { totalBasic, totalNet, totalDeductions, totalEmployees } = useMemo(() => {
    const basic = payrollData.reduce((s, r) => s + r.basicSalary, 0);
    const net = payrollData.reduce((s, r) => s + r.netSalary, 0);
    return {
      totalBasic: basic,
      totalNet: net,
      totalDeductions: basic - net,
      totalEmployees: payrollData.length,
    };
  }, [payrollData]);

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
