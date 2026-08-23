import {
  DEFAULT_SETTINGS,
  type EmployeePayConfig,
  type MonthlyLedgerEntry,
  type PayslipSettings,
  type ProcessedAttendanceRecord,
  type SalaryCalculation,
  type SalaryCalculationPerCurrency,
} from "./payslip-types";
import { minutesToHours } from "./payslip-time";

/**
 * Stage 3 of the payslip pipeline: processed attendance → money.
 *
 * The former single ~197-line `calculateSalary` mixed month-level attendance
 * aggregation with per-currency arithmetic. Those are now two separate steps:
 * `summarizeAttendance` answers "what happened this month", and
 * `computeCurrencySalary` answers "what does that cost in this currency".
 */

/** EOS formula parameters — all configurable from DB (configurations table).
 *  Call with values from useConfigurations().getNumber() in UI layer.
 *  Defaults match Iraqi labor law but can be changed per organization. */
export interface EOSConfig {
  tier1Years: number;   // default 5 — first N years use tier1 rate
  tier1Rate: number;    // default 0.5 — half month per year
  tier2Rate: number;    // default 1.0 — full month per year after tier1
  minYears: number;     // default 1 — minimum service years to qualify
}

export const DEFAULT_EOS_CONFIG: EOSConfig = {
  tier1Years: 5,
  tier1Rate: 0.5,
  tier2Rate: 1.0,
  minYears: 1,
};

/** Calculate the end-of-service benefit.
 *  Formula is fully configurable through the EOSConfig parameter.
 *  Tier 1: first N years × tier1Rate × monthly salary
 *  Tier 2: remaining years × tier2Rate × monthly salary */
export const calculateEOS = (
  joinDate: string | null,
  monthlySalary: number,
  currency: string,
  eosConfig: EOSConfig = DEFAULT_EOS_CONFIG,
  asOfDate: string | Date = new Date(),
): { years: number; months: number; amount: number; currency: string } | null => {
  if (!joinDate) return null;
  const start = new Date(joinDate);
  const now = new Date(asOfDate);
  const diffMs = now.getTime() - start.getTime();
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years < eosConfig.minYears) return { years, months, amount: 0, currency };
  // Configurable tiered formula
  const tier1Amount = Math.min(years, eosConfig.tier1Years) * (monthlySalary * eosConfig.tier1Rate);
  const tier2Amount = Math.max(0, years - eosConfig.tier1Years) * (monthlySalary * eosConfig.tier2Rate);
  const amount = Math.round((tier1Amount + tier2Amount) * 100) / 100;
  return { years, months, amount, currency };
};

/** Month-level attendance totals, independent of any currency. */
type AttendanceSummary = {
  scheduledWorkingDays: number;
  nonExcusedAbsenceDays: string[];
  daysWorked: number;
  totalHours: number;
  overtimeHours: number;
  shortfallHours: number;
  chargeableLateHours: number;
  lateDays: number;
  earlyDays: number;
};

/**
 * Reduce a month of processed records into the totals the money math needs.
 * Walks the record list once per distinct question rather than re-deriving
 * per-currency inside the slot loop.
 */
const summarizeAttendance = (
  employee: EmployeePayConfig,
  records: ProcessedAttendanceRecord[],
  monthYear: string,
  ledger: MonthlyLedgerEntry,
  settings: PayslipSettings,
  holidays?: Set<string>
): AttendanceSummary => {
  let scheduledWorkingDays = records.filter((r) => r.isScheduledWorkingDay).length;

  // Exclude holidays that fall on working days
  if (holidays) {
    holidays.forEach((hDate) => {
      const hDow = new Date(hDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const hSchedule = employee.schedule[hDow];
      if (hSchedule?.isWorkingDay && hDate.startsWith(monthYear)) {
        scheduledWorkingDays = Math.max(0, scheduledWorkingDays - 1);
      }
    });
  }

  // Absence days (non-excused)
  const absenceDays = records
    .filter(
      (r) =>
        (r.status === "absent" || r.status === "absent_due_to_late_threshold" ||
          (r.status === "leave" && r.isUnpaidLeave)) &&
        !r.excusedAbsence
    )
    .map((r) => r.date);

  // Add ledger absence days (that aren't already in records).
  // Ledger ones are already non-excused.
  const nonExcusedAbsenceDays = [...new Set([...absenceDays, ...(ledger.absenceDays || [])])];

  // Days worked — paid leaves count as "worked" (no deduction), unpaid leaves do not
  const daysWorked = records.filter(
    (r) =>
      r.isScheduledWorkingDay &&
      r.status !== "absent" &&
      r.status !== "absent_due_to_late_threshold" &&
      !(r.status === "leave" && r.isUnpaidLeave)
  ).length;

  // Total hours & overtime
  const totalHours = records.reduce((s, r) => s + r.workingHours, 0);
  const overtimeHours = employee.overtimeEnabled
    ? records.reduce((s, r) => s + r.overtimeHours, 0)
    : 0;

  // Shortfall hours — subtract late hours so they aren't double-counted
  // (late arrival already reduces workingHours; we charge it via lateDeduction instead)
  let shortfallHours = 0;
  let totalChargeableLateMinutes = 0;
  for (const rec of records) {
    if (rec.isLate && !rec.excusedLate && rec.lateMinutes > 0) {
      totalChargeableLateMinutes += rec.lateMinutes;
    }
    if (!rec.isScheduledWorkingDay) continue;
    if (rec.status === "absent" || rec.status === "absent_due_to_late_threshold") continue;
    if (rec.status === "leave") continue; // Leave days don't count for shortfall (paid or unpaid)
    if (rec.excusedShortfall) continue;
    const deficit = settings.targetWorkingHoursPerDay - rec.workingHours;
    if (deficit > 0) {
      // Remove late-attributed portion so only genuine shortfall remains
      const lateHours = (rec.isLate && !rec.excusedLate) ? minutesToHours(rec.lateMinutes) : 0;
      shortfallHours += Math.max(0, deficit - lateHours);
    }
  }

  return {
    scheduledWorkingDays,
    nonExcusedAbsenceDays,
    daysWorked,
    totalHours,
    overtimeHours,
    shortfallHours: Math.round(shortfallHours * 100) / 100,
    chargeableLateHours: Math.round((totalChargeableLateMinutes / 60) * 100) / 100,
    lateDays: records.filter((r) => r.isLate && !r.excusedLate).length,
    earlyDays: records.filter((r) => r.isEarly).length,
  };
};

/** How many days one month's salary is divided across, per the configured basis. */
const resolveAbsenceDivisor = (settings: PayslipSettings, scheduledWorkingDays: number): number => {
  let divisor: number;
  if (settings.dailyAbsenceBasis === "30_days") {
    divisor = 30;
  } else if (settings.dailyAbsenceBasis === "fixed_days_per_month") {
    divisor = settings.fixedDaysPerMonth;
  } else {
    divisor = scheduledWorkingDays || 26;
  }
  // Guard: ensure divisors are never zero
  return divisor > 0 ? divisor : 26;
};

/** Money math for one salary slot (one currency) of one employee. */
const computeCurrencySalary = (
  slot: EmployeePayConfig["salarySlots"][number],
  employee: EmployeePayConfig,
  summary: AttendanceSummary,
  ledger: MonthlyLedgerEntry,
  absenceDivisor: number,
  safeTargetHours: number
): SalaryCalculationPerCurrency => {
  const baseSalary = slot.amount || 0;
  const hourlyRate = baseSalary / (absenceDivisor * safeTargetHours);
  const dailyRate = baseSalary / absenceDivisor;

  const overtimePayment = employee.overtimeEnabled
    ? summary.overtimeHours * (slot.overtimeRate || 0)
    : 0;

  const lateDeduction = summary.chargeableLateHours * hourlyRate;
  const shortfallDeduction = summary.shortfallHours * hourlyRate;
  const absenceDeduction = dailyRate * summary.nonExcusedAbsenceDays.length;

  const loan = ledger.loanByCurrency?.[slot.currency] || 0;
  const tip = ledger.tipByCurrency?.[slot.currency] || 0;
  const penalty = ledger.penaltyByCurrency?.[slot.currency] || 0;

  // Phase 2: Allowances
  let totalAllowances = 0;
  const allowanceBreakdown: Array<{ name: string; amount: number }> = [];
  for (const a of employee.allowances || []) {
    if (a.currency !== slot.currency) continue;
    totalAllowances += a.amount;
    allowanceBreakdown.push({ name: a.name, amount: a.amount });
  }

  // Phase 2: Statutory deductions (on gross = base + allowances + overtime)
  const grossSalary = baseSalary + totalAllowances + overtimePayment;
  let totalStatutoryDeductions = 0;
  const deductionBreakdown: Array<{ name: string; amount: number }> = [];
  for (const d of employee.deductions || []) {
    if (d.currency !== slot.currency) continue;
    let dedAmount = 0;
    if (d.calcMethod === "percentage") {
      const base = d.percentageOf === "base_salary" ? baseSalary : d.percentageOf === "gross_salary" ? grossSalary : baseSalary;
      dedAmount = Math.round(base * (d.percentage / 100) * 100) / 100;
    } else {
      dedAmount = d.amount;
    }
    totalStatutoryDeductions += dedAmount;
    deductionBreakdown.push({ name: d.name, amount: dedAmount });
  }

  // Phase 2: Loan installment
  const loanInstallment = (employee.activeLoanInstallment != null && employee.activeLoanInstallment > 0 && employee.activeLoanCurrency === slot.currency) ? employee.activeLoanInstallment : 0;

  const totalWithOvertime = grossSalary - lateDeduction - shortfallDeduction - absenceDeduction - penalty - loan - loanInstallment - totalStatutoryDeductions + tip;
  const totalWithoutOvertime = (baseSalary + totalAllowances) - lateDeduction - shortfallDeduction - absenceDeduction - penalty - loan - loanInstallment - totalStatutoryDeductions + tip;
  // Guard: ensure net salary is never negative
  const netSalary = Math.max(0, totalWithOvertime);

  return {
    currency: slot.currency,
    baseSalary,
    overtimePayment: Math.round(overtimePayment),
    lateDeduction: Math.round(lateDeduction),
    shortfallDeduction: Math.round(shortfallDeduction),
    absenceDeduction: Math.round(absenceDeduction),
    loan,
    tip,
    penalty,
    adjustments: tip - loan - penalty,
    netSalary: Math.round(netSalary),
    totalWithOvertime: Math.round(totalWithOvertime),
    totalWithoutOvertime: Math.round(totalWithoutOvertime),
    totalAllowances: Math.round(totalAllowances),
    totalStatutoryDeductions: Math.round(totalStatutoryDeductions),
    loanInstallment: Math.round(loanInstallment),
    allowanceBreakdown,
    deductionBreakdown,
    grossSalary: Math.round(grossSalary),
  };
};

export const calculateSalary = (
  employee: EmployeePayConfig,
  records: ProcessedAttendanceRecord[],
  monthYear: string,
  ledger: MonthlyLedgerEntry,
  settings: PayslipSettings = DEFAULT_SETTINGS,
  holidays?: Set<string>
): SalaryCalculation => {
  const summary = summarizeAttendance(employee, records, monthYear, ledger, settings, holidays);
  const absenceDivisor = resolveAbsenceDivisor(settings, summary.scheduledWorkingDays);
  const safeTargetHours = settings.targetWorkingHoursPerDay > 0 ? settings.targetWorkingHoursPerDay : 8;

  const salaryByCurrency: Record<string, SalaryCalculationPerCurrency> = {};
  for (const slot of (employee.salarySlots || [])) {
    salaryByCurrency[slot.currency] = computeCurrencySalary(
      slot,
      employee,
      summary,
      ledger,
      absenceDivisor,
      safeTargetHours
    );
  }

  return {
    employeeId: employee.id,
    monthYear,
    salaryByCurrency,
    daysWorked: summary.daysWorked,
    scheduledWorkingDays: summary.scheduledWorkingDays,
    absenceDays: summary.nonExcusedAbsenceDays,
    totalHours: Math.round(summary.totalHours * 100) / 100,
    overtimeHours: Math.round(summary.overtimeHours * 100) / 100,
    lateDays: summary.lateDays,
    earlyDays: summary.earlyDays,
    shortfallHours: summary.shortfallHours,
    calculatedAt: new Date().toISOString(),
  };
};
