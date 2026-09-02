import type { PayrollDayStatus, PayrollEmployeeDetailResponse } from "@/shared/api/payrollTypes";
import type { ProcessedAttendanceRecord, SalaryCalculation } from "../services/payslip-types";

/**
 * Adapts the server-computed `PayrollEmployeeDetailResponse` (backend §6) into
 * the view-model shape `PayrollDetailPanel` and its children already render
 * (`SalaryCalculation` / `ProcessedAttendanceRecord[]`, formerly produced by
 * the client-side `calculateSalary()`). Keeps ~10 downstream components
 * unchanged while the data source moves server-side.
 *
 * The new API has no per-punch check-in/check-out times, only day-level
 * `worked_hours` — `checkInTime`/`formattedCheckIn`/`formattedCheckOut` stay
 * `undefined` here, and `CalendarDayCell` renders off `status` instead.
 */

const dayStatusToRecordStatus = (status: PayrollDayStatus): ProcessedAttendanceRecord["status"] => {
  if (status === "holiday") return "holiday";
  if (status === "leave_paid" || status === "leave_unpaid") return "leave";
  if (status === "absent" || status === "absent_excused") return "absent";
  return "complete";
};

const dayOfWeekName = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

export const mapPayrollDetailToRecords = (
  detail: PayrollEmployeeDetailResponse,
): ProcessedAttendanceRecord[] =>
  detail.attendance.days.map((day) => ({
    id: `${detail.employee.id}-${day.date}`,
    employeeId: String(detail.employee.id),
    date: day.date,
    dayOfWeek: dayOfWeekName(day.date),
    workingHours: day.worked_hours,
    overtimeHours: day.overtime_hours,
    isLate: day.status === "late",
    lateMinutes: day.late_minutes,
    isEarly: false,
    status: dayStatusToRecordStatus(day.status),
    excusedAbsence: day.status === "absent_excused",
    excusedLate: false,
    excusedShortfall: false,
    isScheduledWorkingDay: true,
    isLeaveDay: day.status === "leave_paid" || day.status === "leave_unpaid",
    leaveType: day.leave_type_name || undefined,
    isUnpaidLeave: day.status === "leave_unpaid",
  }));

export const mapPayrollDetailToCalc = (detail: PayrollEmployeeDetailResponse): SalaryCalculation => {
  const c = detail.calculation;
  const currency = c.currency;

  return {
    employeeId: String(detail.employee.id),
    monthYear: detail.month,
    salaryByCurrency: {
      [currency]: {
        currency,
        baseSalary: c.basic_salary,
        overtimePayment: c.overtime_payment,
        lateDeduction: c.late_deduction,
        shortfallDeduction: c.shortfall_deduction,
        absenceDeduction: c.absence_deduction,
        loan: c.ledger_loan,
        tip: c.ledger_tip,
        penalty: c.ledger_penalty,
        adjustments: c.adjustments,
        netSalary: c.net_salary,
        totalWithOvertime: c.total_with_overtime,
        totalWithoutOvertime: c.total_without_overtime,
        totalAllowances: c.total_allowances,
        totalStatutoryDeductions: c.total_statutory_deductions,
        loanInstallment: c.loan_installment,
        allowanceBreakdown: detail.allowances.map((a) => ({ name: a.name_ar || a.name, amount: a.amount })),
        deductionBreakdown: detail.deductions.map((d) => ({ name: d.name_ar || d.name, amount: d.amount })),
        grossSalary: c.gross_salary,
      },
    },
    daysWorked: detail.attendance.days_worked,
    scheduledWorkingDays: detail.attendance.scheduled_working_days,
    absenceDays: detail.attendance.absence_dates,
    totalHours: detail.attendance.total_hours,
    overtimeHours: detail.attendance.overtime_hours,
    lateDays: detail.attendance.late_days,
    earlyDays: detail.attendance.early_days,
    shortfallHours: detail.attendance.shortfall_hours,
    calculatedAt: c.generated_at || new Date().toISOString(),
  };
};
