import { empDisplayName, resolveEmployeeShift, shiftToSchedule } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import {
  processAttendanceRecords,
  calculateSalary,
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

export type PayrollRow = {
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
};

// Builds one employee's payroll summary row for the selected month, or null if
// the employee id doesn't resolve (mirrors the original loop's `continue`).
export const buildPayrollRow = (
  empId: string,
  empMap: Record<string, DbEmployee>,
  dbDepartments: any[],
  dbShifts: any[],
  allEmployeeAllowances: any[],
  allowanceTypes: any[],
  allEmployeeDeductions: any[],
  deductionTypes: any[],
  allLoans: any[],
  monthAtt: any[],
  selectedMonth: string,
  holidayDates: Set<string>,
  leaveRequests: LeaveRequest[],
  leaveTypeInfos: any[],
  ledgers: any[],
): PayrollRow | null => {
  const emp = empMap[empId];
  if (!emp) return null;

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
  const empAtt = monthAtt.filter((r: any) => r.employee_id === empId);

  // Build both check-in and check-out records
  const rawRecsAll: RawAttendanceRecord[] = [];
  empAtt.forEach((a: any) => {
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
  const statusByDate = new Map(empAtt.map((a: any) => [a.date, a]));
  processed = processed.map((rec) => {
    const a: any = statusByDate.get(rec.date);
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
    (l: any) => l.employee_id === empId && l.month_year === selectedMonth
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

  return {
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
  };
};
