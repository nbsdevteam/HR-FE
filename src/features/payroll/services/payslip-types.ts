/**
 * Payslip domain types and settings construction.
 *
 * Split out of the former 886-line `payslip-engine.ts` so the shape of the
 * domain can be read without scrolling through the calculation logic.
 */

export interface RawAttendanceRecord {
  personId: string;
  name: string;
  department?: string;
  time: string; // "YYYY-MM-DD HH:MM:SS"
  attendanceStatus: "Check-in" | "Check-out" | "None";
  // Excuse/override fields (from DB)
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
}

export interface ProcessedAttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  dayOfWeek: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours: number;
  overtimeHours: number;
  isLate: boolean;
  lateMinutes: number;
  isEarly: boolean;
  status:
    | "complete"
    | "missing_checkout"
    | "missing_checkin"
    | "incomplete"
    | "absent"
    | "absent_due_to_late_threshold"
    | "leave"
    | "holiday"
    | "rest_day";
  autoCheckoutApplied?: boolean;
  autoCheckinApplied?: boolean;
  absenceReason?: "no_punches" | "late_threshold" | "checkout_without_checkin";
  excusedAbsence?: boolean;
  excusedLate?: boolean;
  excusedShortfall?: boolean;
  formattedCheckIn?: string;
  formattedCheckOut?: string;
  expectedStartTime?: string;
  expectedEndTime?: string;
  isScheduledWorkingDay: boolean;
  /** Backwards-compatible schedule flag used by imported-record processing. */
  isWorkingDay?: boolean;
  // Leave integration
  isLeaveDay?: boolean;
  leaveType?: string; // Backend leave-type label.
  isUnpaidLeave?: boolean;
}

export interface SalaryCalculationPerCurrency {
  currency: string;
  baseSalary: number;
  overtimePayment: number;
  lateDeduction: number;
  shortfallDeduction: number;
  absenceDeduction: number;
  loan: number;
  tip: number;
  penalty: number;
  adjustments: number;
  netSalary: number;
  totalWithOvertime: number;
  totalWithoutOvertime: number;
  totalAllowances: number;
  totalStatutoryDeductions: number;
  loanInstallment: number;
  allowanceBreakdown: Array<{ name: string; amount: number }>;
  deductionBreakdown: Array<{ name: string; amount: number }>;
  grossSalary: number;
}

export interface SalaryCalculation {
  employeeId: string;
  monthYear: string;
  salaryByCurrency: Record<string, SalaryCalculationPerCurrency>;
  daysWorked: number;
  scheduledWorkingDays: number;
  absenceDays: string[];
  totalHours: number;
  overtimeHours: number;
  lateDays: number;
  earlyDays: number;
  shortfallHours: number;
  calculatedAt: string;
}

export interface EmployeeSchedule {
  [dayOfWeek: string]: {
    isWorkingDay: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface EmployeePayConfig {
  id: string;
  personId: string;
  name: string;
  department?: string;
  salarySlots: Array<{
    currency: string;
    amount: number;
    overtimeRate: number;
  }>;
  overtimeEnabled: boolean;
  schedule: EmployeeSchedule;
  allowances?: Array<{ name: string; amount: number; currency: string }>;
  deductions?: Array<{ name: string; amount: number; percentage: number; calcMethod: string; percentageOf: string; currency: string }>;
  activeLoanInstallment?: number;
  activeLoanCurrency?: string;
  joinDate?: string;
  contractType?: string;
}

export interface MonthlyLedgerEntry {
  absenceDays: string[];
  loanByCurrency: Record<string, number>;
  tipByCurrency: Record<string, number>;
  penaltyByCurrency: Record<string, number>;
}

export interface PayslipSettings {
  targetWorkingHoursPerDay: number;
  dailyAbsenceBasis: "30_days" | "calendar_workdays" | "fixed_days_per_month";
  fixedDaysPerMonth: number;
  shiftGraceMinutes: number;
  lateToAbsentHours: number;
  earlyLeaveThresholdMinutes: number;
  noonCutoffMinutes: number;
  autoCheckoutEnabled: boolean;
}

/** Shape of the configuration getters supplied by the UI layer. */
type ConfigGetter = {
  getNumber: (key: string, fallback: number) => number;
  getBool: (key: string, fallback: boolean) => boolean;
  getValue: (key: string, fallback: string) => string;
};

/** Default settings — used ONLY as fallback when DB configurations are unavailable.
 *  In production, these are overridden by values from the `configurations` table
 *  via buildSettingsFromShift() or buildSettingsFromConfig(). */
export const DEFAULT_SETTINGS: PayslipSettings = {
  targetWorkingHoursPerDay: 9,
  dailyAbsenceBasis: "30_days",
  fixedDaysPerMonth: 26,
  shiftGraceMinutes: 10,
  lateToAbsentHours: 3,
  earlyLeaveThresholdMinutes: 10,
  noonCutoffMinutes: 720,
  autoCheckoutEnabled: true,
};

export const DEFAULT_SCHEDULE: EmployeeSchedule = {
  sunday: { isWorkingDay: true, startTime: "07:00", endTime: "16:00" },
  monday: { isWorkingDay: true, startTime: "07:00", endTime: "16:00" },
  tuesday: { isWorkingDay: true, startTime: "07:00", endTime: "16:00" },
  wednesday: { isWorkingDay: true, startTime: "07:00", endTime: "16:00" },
  thursday: { isWorkingDay: true, startTime: "07:00", endTime: "16:00" },
  friday: { isWorkingDay: false, startTime: "07:00", endTime: "16:00" },
  saturday: { isWorkingDay: false, startTime: "07:00", endTime: "16:00" },
};

/** Build PayslipSettings from a DbShift record (database-driven config).
 *  Optionally accepts a configGetter to pull remaining values from the configurations table. */
export const buildSettingsFromShift = (
  shift: { grace_minutes: number; late_to_absent_hours: number; target_hours_per_day: number },
  configGetter?: ConfigGetter
): PayslipSettings => {
  const getNum = configGetter?.getNumber ?? ((_k: string, fb: number) => fb);
  const getBool = configGetter?.getBool ?? ((_k: string, fb: boolean) => fb);
  const getVal = configGetter?.getValue ?? ((_k: string, fb: string) => fb);
  return {
    targetWorkingHoursPerDay: shift.target_hours_per_day || getNum('attendance.target_hours_per_day', DEFAULT_SETTINGS.targetWorkingHoursPerDay),
    dailyAbsenceBasis: (getVal('attendance.absence_basis', DEFAULT_SETTINGS.dailyAbsenceBasis) as PayslipSettings['dailyAbsenceBasis']),
    fixedDaysPerMonth: getNum('attendance.fixed_days_per_month', DEFAULT_SETTINGS.fixedDaysPerMonth),
    shiftGraceMinutes: shift.grace_minutes ?? getNum('attendance.grace_minutes', DEFAULT_SETTINGS.shiftGraceMinutes),
    lateToAbsentHours: shift.late_to_absent_hours ?? getNum('attendance.late_to_absent_hours', DEFAULT_SETTINGS.lateToAbsentHours),
    earlyLeaveThresholdMinutes: getNum('attendance.early_leave_threshold', DEFAULT_SETTINGS.earlyLeaveThresholdMinutes),
    noonCutoffMinutes: getNum('attendance.noon_cutoff_minutes', DEFAULT_SETTINGS.noonCutoffMinutes),
    autoCheckoutEnabled: getBool('attendance.auto_checkout_enabled', DEFAULT_SETTINGS.autoCheckoutEnabled),
  };
};

/** Build PayslipSettings directly from configurations table (no shift record needed).
 *  Used when shift data is not available. */
export const buildSettingsFromConfig = (configGetter: ConfigGetter): PayslipSettings => {
  return {
    targetWorkingHoursPerDay: configGetter.getNumber('attendance.target_hours_per_day', DEFAULT_SETTINGS.targetWorkingHoursPerDay),
    dailyAbsenceBasis: configGetter.getValue('attendance.absence_basis', DEFAULT_SETTINGS.dailyAbsenceBasis) as PayslipSettings['dailyAbsenceBasis'],
    fixedDaysPerMonth: configGetter.getNumber('attendance.fixed_days_per_month', DEFAULT_SETTINGS.fixedDaysPerMonth),
    shiftGraceMinutes: configGetter.getNumber('attendance.grace_minutes', DEFAULT_SETTINGS.shiftGraceMinutes),
    lateToAbsentHours: configGetter.getNumber('attendance.late_to_absent_hours', DEFAULT_SETTINGS.lateToAbsentHours),
    earlyLeaveThresholdMinutes: configGetter.getNumber('attendance.early_leave_threshold', DEFAULT_SETTINGS.earlyLeaveThresholdMinutes),
    noonCutoffMinutes: configGetter.getNumber('attendance.noon_cutoff_minutes', DEFAULT_SETTINGS.noonCutoffMinutes),
    autoCheckoutEnabled: configGetter.getBool('attendance.auto_checkout_enabled', DEFAULT_SETTINGS.autoCheckoutEnabled),
  };
};
