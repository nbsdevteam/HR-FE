/**
 * Payslip Engine — CSV/Excel parsing, attendance processing, salary calculation
 * Based on the 9-hour target model with shortfall/absence/overtime
 */

import * as XLSX from "xlsx";
import { formatCurrency as formatIntlCurrency, formatNumber } from "../i18n/format";
import { arabicSource } from "../i18n/source";

// ──────────────────────── Types ────────────────────────

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
export function buildSettingsFromShift(
  shift: { grace_minutes: number; late_to_absent_hours: number; target_hours_per_day: number },
  configGetter?: { getNumber: (key: string, fallback: number) => number; getBool: (key: string, fallback: boolean) => boolean; getValue: (key: string, fallback: string) => string }
): PayslipSettings {
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
}

/** Build PayslipSettings directly from configurations table (no shift record needed).
 *  Used when shift data is not available. */
export function buildSettingsFromConfig(
  configGetter: { getNumber: (key: string, fallback: number) => number; getBool: (key: string, fallback: boolean) => boolean; getValue: (key: string, fallback: string) => string }
): PayslipSettings {
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
}

// 1. Parsing

const COL_ALIASES: Record<string, string[]> = {
  personId: ["person id", "personid", "id", "person_id", "employee id", "emp id", arabicSource("common.job_number")],
  name: ["name", "employee name", arabicSource("common.name"), arabicSource("common.employee_name")],
  time: ["time", "datetime", "timestamp", "date/time", arabicSource("common.time"), arabicSource("messages.date_and_time")],
  attendanceStatus: ["attendance status", "status", arabicSource("common.status"), arabicSource("common.attendance_status")],
  department: ["department", "dept", arabicSource("common.section")],
};

function findColumn(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Parse a date-time string into "YYYY-MM-DD HH:MM:SS" */
function parseDateTime(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const spaceIdx = trimmed.indexOf(" ");
  let datePart = spaceIdx > 0 ? trimmed.substring(0, spaceIdx) : trimmed;
  let timePart = spaceIdx > 0 ? trimmed.substring(spaceIdx + 1).trim() : "00:00:00";

  // Normalize time
  if (!timePart.includes(":")) timePart = "00:00:00";
  const timeParts = timePart.split(":");
  const hh = (timeParts[0] || "00").padStart(2, "0");
  const mm = (timeParts[1] || "00").padStart(2, "0");
  const ss = (timeParts[2] || "00").padStart(2, "0");
  timePart = `${hh}:${mm}:${ss}`;

  // Parse date
  let year: number, month: number, day: number;

  if (datePart.includes("-")) {
    const parts = datePart.split("-");
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      // DD-MM-YY or DD-MM-YYYY
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
      year = parseInt(parts[2]);
      if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    }
  } else if (datePart.includes("/")) {
    const parts = datePart.split("/");
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    const c = parseInt(parts[2]);
    if (a > 12) {
      // D/M/YYYY
      day = a;
      month = b;
      year = c;
    } else {
      // M/D/YYYY
      month = a;
      day = b;
      year = c;
    }
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
  } else {
    return null;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const yStr = String(year);
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");
  return `${yStr}-${mStr}-${dStr} ${timePart}`;
}

/** Handle XLSX serial date numbers */
function excelSerialToDateTime(serial: number): string | null {
  if (serial < 1) return null;
  const utcDays = Math.floor(serial) - 25569;
  const utcMs = utcDays * 86400 * 1000;
  const fractional = serial - Math.floor(serial);
  const timeMs = Math.round(fractional * 86400 * 1000);
  const d = new Date(utcMs + timeMs);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

export function parseAttendanceFile(file: File): Promise<{
  records: RawAttendanceRecord[];
  errors: string[];
  totalRows: number;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          resolve({ records: [], errors: [arabicSource("messages.the_file_is_empty_or_contains_no_data")], totalRows: 0 });
          return;
        }

        const headers = json[0].map((h: any) => String(h || "").trim());
        const personIdCol = findColumn(headers, COL_ALIASES.personId);
        const nameCol = findColumn(headers, COL_ALIASES.name);
        const timeCol = findColumn(headers, COL_ALIASES.time);
        const statusCol = findColumn(headers, COL_ALIASES.attendanceStatus);
        const deptCol = findColumn(headers, COL_ALIASES.department);

        const missingCols: string[] = [];
        if (personIdCol === -1) missingCols.push("Person ID");
        if (timeCol === -1) missingCols.push("Time");
        if (statusCol === -1) missingCols.push("Attendance Status");

        if (missingCols.length > 0) {
          resolve({
            records: [],
            errors: [`${arabicSource("messages.missing_columns")} ${missingCols.join(", ")}${arabicSource("messages.existing_columns")} ${headers.join(", ")}`],
            totalRows: json.length - 1,
          });
          return;
        }

        const records: RawAttendanceRecord[] = [];
        const errors: string[] = [];

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const rawPersonId = String(row[personIdCol] || "").trim();
          const rawName = nameCol >= 0 ? String(row[nameCol] || "").trim() : rawPersonId;
          const rawTime = row[timeCol];
          const rawStatus = String(row[statusCol] || "").trim();
          const rawDept = deptCol >= 0 ? String(row[deptCol] || "").trim() : undefined;

          if (!rawPersonId) continue;

          // Parse time
          let parsedTime: string | null = null;
          if (typeof rawTime === "number") {
            parsedTime = excelSerialToDateTime(rawTime);
          } else {
            parsedTime = parseDateTime(String(rawTime || ""));
          }

          if (!parsedTime) {
            errors.push(`${arabicSource("messages.line")} ${i + 1}${arabicSource("messages.unable_to_parse_date")}${rawTime}"`);
            continue;
          }

          // Parse status
          let status: "Check-in" | "Check-out" | "None" = "None";
          const statusLower = rawStatus.toLowerCase();
          if (statusLower.includes("check-in") || statusLower.includes("checkin") || statusLower === "in" || statusLower === "c/in") {
            status = "Check-in";
          } else if (statusLower.includes("check-out") || statusLower.includes("checkout") || statusLower === "out" || statusLower === "c/out") {
            status = "Check-out";
          }

          records.push({
            personId: rawPersonId,
            name: rawName,
            department: rawDept,
            time: parsedTime,
            attendanceStatus: status,
          });
        }

        resolve({ records, errors, totalRows: json.length - 1 });
      } catch (err: any) {
        resolve({ records: [], errors: [`${arabicSource("messages.error_reading_file")} ${err.message}`], totalRows: 0 });
      }
    };
    reader.onerror = () => resolve({ records: [], errors: [arabicSource("messages.failed_to_read_file")], totalRows: 0 });
    reader.readAsArrayBuffer(file);
  });
}

// ──────────────────────── 2. Processing ────────────────────────

function timeToMinutes(t: string): number {
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minutesToHours(m: number): number {
  return Math.round((m / 60) * 100) / 100;
}

function formatTimeStr(t: string): string {
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const suffix = h < 12 ? arabicSource("common.p") : arabicSource("common.m");
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const dayNamesAr: Record<string, string> = {
  sunday: arabicSource("common.sunday_2"),
  monday: arabicSource("common.monday"),
  tuesday: arabicSource("common.tuesday"),
  wednesday: arabicSource("common.wednesday"),
  thursday: arabicSource("common.thursday"),
  friday: arabicSource("common.friday"),
  saturday: arabicSource("common.saturday"),
};

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return DAYS_OF_WEEK[d.getUTCDay()];
}

/** Get all dates in a month as YYYY-MM-DD */
function getMonthDates(monthYear: string): string[] {
  const [y, m] = monthYear.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

export function processAttendanceRecords(
  rawRecords: RawAttendanceRecord[],
  employeeConfig: EmployeePayConfig,
  monthYear: string,
  settings: PayslipSettings = DEFAULT_SETTINGS,
  holidays?: Set<string>
): ProcessedAttendanceRecord[] {
  const monthDates = getMonthDates(monthYear);
  const schedule = employeeConfig.schedule;

  // Group by date
  const byDate: Record<string, RawAttendanceRecord[]> = {};
  for (const rec of rawRecords) {
    if (rec.personId !== employeeConfig.personId) continue;
    const dateStr = rec.time.substring(0, 10);
    if (!dateStr.startsWith(monthYear)) continue;
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(rec);
  }

  const processed: ProcessedAttendanceRecord[] = [];

  for (const date of monthDates) {
    const dayName = getDayOfWeek(date);
    const daySchedule = schedule[dayName];
    const isScheduled = daySchedule?.isWorkingDay ?? false;

    if (!isScheduled) continue; // Skip non-working days

    // Skip public holidays — treat as non-working day
    if (holidays?.has(date)) {
      const dayOfWeekAr = dayNamesAr[dayName] || dayName;
      processed.push({
        id: `${employeeConfig.id}-${date}`,
        employeeId: employeeConfig.id,
        date,
        dayOfWeek: dayOfWeekAr,
        isScheduledWorkingDay: false,
        isWorkingDay: false,
        status: "holiday",
        checkInTime: undefined,
        checkOutTime: undefined,
        workingHours: 0,
        overtimeHours: 0,
        isLate: false,
        lateMinutes: 0,
        isEarly: false,
        autoCheckoutApplied: false,
        autoCheckinApplied: false,
        excusedAbsence: false,
        excusedLate: false,
        excusedShortfall: false,
      });
      continue;
    }

    const dayRecords = byDate[date] || [];
    const checkIns = dayRecords.filter((r) => r.attendanceStatus === "Check-in");
    const checkOuts = dayRecords.filter((r) => r.attendanceStatus === "Check-out");
    const noneRecords = dayRecords.filter((r) => r.attendanceStatus === "None");

    let checkInTime: string | undefined;
    let checkOutTime: string | undefined;
    let status: ProcessedAttendanceRecord["status"] = "complete";
    let absenceReason: ProcessedAttendanceRecord["absenceReason"];
    let autoCheckinApplied = false;
    let autoCheckoutApplied = false;

    if (checkIns.length === 0 && checkOuts.length === 0) {
      // No punches
      status = "absent";
      absenceReason = "no_punches";
    } else if (checkIns.length > 0 && checkOuts.length > 0) {
      // Normal: first check-in, last check-out
      checkInTime = checkIns[0].time.substring(11, 19);
      checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
    } else if (checkIns.length > 0 && checkOuts.length === 0) {
      if (checkIns.length >= 2) {
        // Two check-ins, no check-out → earliest as in, latest as out
        checkInTime = checkIns[0].time.substring(11, 19);
        checkOutTime = checkIns[checkIns.length - 1].time.substring(11, 19);
        autoCheckoutApplied = true;
      } else {
        // Single check-in
        const inTime = checkIns[0].time.substring(11, 19);
        const inMinutes = timeToMinutes(inTime);
        if (inMinutes >= (settings.noonCutoffMinutes ?? 720)) {
          // After noon cutoff (configurable) — treat as check-out only
          checkOutTime = inTime;
          status = "missing_checkin";
          absenceReason = "checkout_without_checkin";
          autoCheckinApplied = true;
        } else {
          checkInTime = inTime;
          status = "missing_checkout";
          autoCheckoutApplied = true;
        }
      }
    } else if (checkOuts.length > 0 && checkIns.length === 0) {
      if (checkOuts.length >= 2) {
        // Two check-outs → earliest as in, latest as out
        checkInTime = checkOuts[0].time.substring(11, 19);
        checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
        autoCheckinApplied = true;
      } else {
        // Single check-out
        checkOutTime = checkOuts[0].time.substring(11, 19);
        status = "missing_checkin";
        absenceReason = "checkout_without_checkin";
      }
    }

    // If it was marked by "None" records, force absent
    if (noneRecords.length > 0 && checkIns.length === 0 && checkOuts.length === 0) {
      status = "absent";
      absenceReason = "no_punches";
    }

    // Calculate working hours
    let workingHours = 0;
    let overtimeHours = 0;
    let isLate = false;
    let lateMinutes = 0;
    let isEarly = false;

    if (checkInTime && checkOutTime && status !== "absent") {
      const inMin = timeToMinutes(checkInTime);
      const outMin = timeToMinutes(checkOutTime);
      const totalMin = outMin > inMin ? outMin - inMin : outMin + 1440 - inMin;
      workingHours = minutesToHours(totalMin);

      // Overtime: only time after scheduled end
      if (daySchedule?.endTime) {
        const endMin = timeToMinutes(daySchedule.endTime);
        if (outMin > endMin) {
          overtimeHours = minutesToHours(outMin - endMin);
        }
      }

      // Late check
      if (daySchedule?.startTime) {
        const expectedStart = timeToMinutes(daySchedule.startTime);
        const graceEnd = expectedStart + settings.shiftGraceMinutes;
        if (inMin > graceEnd) {
          isLate = true;
          lateMinutes = inMin - graceEnd; // Only charge minutes beyond grace period
        }
      }

      // Late-to-absent threshold
      if (isLate && lateMinutes >= settings.lateToAbsentHours * 60) {
        status = "absent_due_to_late_threshold";
        absenceReason = "late_threshold";
      }

      // Early leave — threshold is configurable via settings (from configurations table)
      if (daySchedule?.endTime) {
        const endMin = timeToMinutes(daySchedule.endTime);
        const earlyLeaveThreshold = settings.earlyLeaveThresholdMinutes ?? 10;
        if (outMin < endMin - earlyLeaveThreshold) {
          isEarly = true;
        }
      }
    } else if (checkInTime && !checkOutTime && status === "missing_checkout") {
      // Only check-in, assume worked until scheduled end
      if (daySchedule?.endTime) {
        const inMin = timeToMinutes(checkInTime);
        const endMin = timeToMinutes(daySchedule.endTime);
        workingHours = minutesToHours(endMin - inMin);
        checkOutTime = daySchedule.endTime + ":00";
        autoCheckoutApplied = true;
      }
    }

    const rec: ProcessedAttendanceRecord = {
      id: `${employeeConfig.id}-${date}`,
      employeeId: employeeConfig.id,
      date,
      dayOfWeek: dayName,
      checkInTime,
      checkOutTime,
      workingHours: Math.max(0, workingHours),
      overtimeHours: Math.max(0, overtimeHours),
      isLate,
      lateMinutes,
      isEarly,
      status,
      autoCheckoutApplied,
      autoCheckinApplied,
      absenceReason,
      excusedAbsence: dayRecords.some(r => r.excused_absence) || false,
      excusedLate: dayRecords.some(r => r.excused_late) || false,
      excusedShortfall: dayRecords.some(r => r.excused_shortfall) || false,
      formattedCheckIn: checkInTime ? formatTimeStr(checkInTime) : undefined,
      formattedCheckOut: checkOutTime ? formatTimeStr(checkOutTime) : undefined,
      expectedStartTime: daySchedule?.startTime,
      expectedEndTime: daySchedule?.endTime,
      isScheduledWorkingDay: isScheduled,
    };
    processed.push(rec);
  }

  return processed;
}

// ──────────────────────── 3. Salary Calculation ────────────────────────

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
export function calculateEOS(
  joinDate: string | null,
  monthlySalary: number,
  currency: string,
  eosConfig: EOSConfig = DEFAULT_EOS_CONFIG,
  asOfDate: string | Date = new Date(),
): { years: number; months: number; amount: number; currency: string } | null {
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
}

export function calculateSalary(
  employee: EmployeePayConfig,
  records: ProcessedAttendanceRecord[],
  monthYear: string,
  ledger: MonthlyLedgerEntry,
  settings: PayslipSettings = DEFAULT_SETTINGS,
  holidays?: Set<string>
): SalaryCalculation {
  const scheduledDays = records.filter((r) => r.isScheduledWorkingDay);
  let scheduledWorkingDays = scheduledDays.length;

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

  // Add ledger absence days (that aren't already in records)
  const allAbsenceDays = [...new Set([...absenceDays, ...(ledger.absenceDays || [])])];
  const nonExcusedAbsenceDays = allAbsenceDays; // Ledger ones are already non-excused

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
  for (const rec of records) {
    if (!rec.isScheduledWorkingDay) continue;
    if (rec.status === "absent" || rec.status === "absent_due_to_late_threshold") continue;
    if (rec.status === "leave") continue; // Leave days don't count for shortfall (paid or unpaid)
    if (rec.excusedShortfall) continue;
    const deficit = settings.targetWorkingHoursPerDay - rec.workingHours;
    if (deficit > 0) {
      // Remove late-attributed portion so only genuine shortfall remains
      const lateHours = (rec.isLate && !rec.excusedLate) ? minutesToHours(rec.lateMinutes) : 0;
      const pureShortfall = Math.max(0, deficit - lateHours);
      shortfallHours += pureShortfall;
    }
  }
  shortfallHours = Math.round(shortfallHours * 100) / 100;

  // Late & early counts
  const lateDays = records.filter((r) => r.isLate && !r.excusedLate).length;
  const earlyDays = records.filter((r) => r.isEarly).length;

  // Total chargeable late minutes (excludes grace period & excused lates)
  let totalChargeableLateMinutes = 0;
  for (const rec of records) {
    if (rec.isLate && !rec.excusedLate && rec.lateMinutes > 0) {
      totalChargeableLateMinutes += rec.lateMinutes;
    }
  }
  const chargeableLateHours = Math.round((totalChargeableLateMinutes / 60) * 100) / 100;

  // Absence divisor
  let absenceDivisor: number;
  if (settings.dailyAbsenceBasis === "30_days") {
    absenceDivisor = 30;
  } else if (settings.dailyAbsenceBasis === "fixed_days_per_month") {
    absenceDivisor = settings.fixedDaysPerMonth;
  } else {
    absenceDivisor = scheduledWorkingDays || 26;
  }

  // Guard: ensure divisors are never zero
  if (absenceDivisor <= 0) absenceDivisor = 26;
  const safeTargetHours = settings.targetWorkingHoursPerDay > 0 ? settings.targetWorkingHoursPerDay : 8;

  // Per-currency calculation
  const salaryByCurrency: Record<string, SalaryCalculationPerCurrency> = {};

  for (const slot of (employee.salarySlots || [])) {
    const baseSalary = slot.amount || 0;
    const hourlyRate = baseSalary / (absenceDivisor * safeTargetHours);
    const dailyRate = baseSalary / absenceDivisor;

    const overtimePayment = employee.overtimeEnabled
      ? overtimeHours * (slot.overtimeRate || 0)
      : 0;

    const lateDeduction = chargeableLateHours * hourlyRate;
    const shortfallDeduction = shortfallHours * hourlyRate;
    const absenceDeduction = dailyRate * nonExcusedAbsenceDays.length;

    const loan = ledger.loanByCurrency?.[slot.currency] || 0;
    const tip = ledger.tipByCurrency?.[slot.currency] || 0;
    const penalty = ledger.penaltyByCurrency?.[slot.currency] || 0;

    // Phase 2: Allowances
    let totalAllowances = 0;
    const allowanceBreakdown: Array<{ name: string; amount: number }> = [];
    if (employee.allowances) {
      for (const a of employee.allowances) {
        if (a.currency === slot.currency) {
          totalAllowances += a.amount;
          allowanceBreakdown.push({ name: a.name, amount: a.amount });
        }
      }
    }

    // Phase 2: Statutory deductions (on gross = base + allowances + overtime)
    const grossSalary = baseSalary + totalAllowances + overtimePayment;
    let totalStatutoryDeductions = 0;
    const deductionBreakdown: Array<{ name: string; amount: number }> = [];
    if (employee.deductions) {
      for (const d of employee.deductions) {
        if (d.currency === slot.currency) {
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
      }
    }

    // Phase 2: Loan installment
    const loanInstallment = (employee.activeLoanInstallment != null && employee.activeLoanInstallment > 0 && employee.activeLoanCurrency === slot.currency) ? employee.activeLoanInstallment : 0;

    const totalWithOvertime = grossSalary - lateDeduction - shortfallDeduction - absenceDeduction - penalty - loan - loanInstallment - totalStatutoryDeductions + tip;
    const totalWithoutOvertime = (baseSalary + totalAllowances) - lateDeduction - shortfallDeduction - absenceDeduction - penalty - loan - loanInstallment - totalStatutoryDeductions + tip;
    // Guard: ensure net salary is never negative
    const netSalary = Math.max(0, totalWithOvertime);

    salaryByCurrency[slot.currency] = {
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
  }

  return {
    employeeId: employee.id,
    monthYear,
    salaryByCurrency,
    daysWorked,
    scheduledWorkingDays,
    absenceDays: nonExcusedAbsenceDays,
    totalHours: Math.round(totalHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    lateDays,
    earlyDays,
    shortfallHours,
    calculatedAt: new Date().toISOString(),
  };
}

// ──────────────────────── Helpers ────────────────────────

export function formatCurrency(val: number, currency: string): string {
  if (/^[A-Z]{3}$/.test(currency)) {
    return formatIntlCurrency(val, currency);
  }
  return `${formatNumber(val)} ${currency}`;
}

export function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} ${arabicSource("common.min")}`;
  if (m === 0) return `${h} ${arabicSource("common.hours")}`;
  return `${h} ${arabicSource("common.hours")} ${m} ${arabicSource("common.min")}`;
}

export function getShortfallRecords(
  records: ProcessedAttendanceRecord[],
  targetHours: number
): ProcessedAttendanceRecord[] {
  return records.filter(
    (r) =>
      r.isScheduledWorkingDay &&
      r.status !== "absent" &&
      r.status !== "absent_due_to_late_threshold" &&
      r.status !== "leave" &&
      r.workingHours < targetHours
  );
}

export function getAbsenceRecords(
  records: ProcessedAttendanceRecord[]
): ProcessedAttendanceRecord[] {
  return records.filter(
    (r) => r.status === "absent" || r.status === "absent_due_to_late_threshold" ||
           (r.status === "leave" && r.isUnpaidLeave)
  );
}

export function getLeaveRecords(
  records: ProcessedAttendanceRecord[]
): ProcessedAttendanceRecord[] {
  return records.filter((r) => r.status === "leave");
}

// ──────────────────────── Leave Integration ────────────────────────

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id?: string | null;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day?: boolean;
  half_day_period?: string | null;
  status: string;
}

/** Configurable leave type info for payslip engine — passed from DB leave_types table */
export interface LeaveTypeInfo {
  code: string;
  name_ar: string;
  is_paid: boolean;
}

export interface LeaveDateEntry {
  leaveType: string;
  isUnpaid: boolean;
  isHalfDay: boolean;
  halfDayPeriod?: string | null;
}

/** Build a map of dates → leave info for an employee's approved leaves in a given month.
 *  Now supports configurable leave types (is_paid) and half-day leaves. */
export function buildLeaveDateMap(
  leaves: LeaveRequest[],
  employeeId: string,
  monthYear: string,
  leaveTypeInfos?: LeaveTypeInfo[]
): Record<string, LeaveDateEntry> {
  const map: Record<string, LeaveDateEntry> = {};
  const [y, m] = monthYear.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0); // last day of month

  for (const lv of leaves) {
    if (lv.employee_id !== employeeId) continue;
    if (lv.status !== arabicSource("common.accepted")) continue;

    // Determine if unpaid: first check leave_types table, fallback to hardcoded name
    let isUnpaid = lv.leave_type === arabicSource("common.without_salary");
    if (leaveTypeInfos) {
      const typeInfo = leaveTypeInfos.find(t => t.name_ar === lv.leave_type || t.code === lv.leave_type);
      if (typeInfo) isUnpaid = !typeInfo.is_paid;
    }

    const start = new Date(lv.start_date + "T00:00:00Z");
    const end = new Date(lv.end_date + "T00:00:00Z");

    // Iterate each day in the leave range that falls within the month
    const cursor = new Date(Math.max(start.getTime(), monthStart.getTime()));
    const rangeEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));

    while (cursor <= rangeEnd) {
      const dateStr = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      map[dateStr] = {
        leaveType: lv.leave_type,
        isUnpaid,
        isHalfDay: lv.is_half_day || false,
        halfDayPeriod: lv.half_day_period,
      };
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return map;
}

/** Apply approved leave data to processed attendance records.
 *  Supports both old format (Record<string, string>) and new format (Record<string, LeaveDateEntry>).
 *  - Paid leave: mark as "leave", excusedAbsence=true, no deduction.
 *  - Unpaid leave: mark as "leave" + isUnpaidLeave=true, excusedAbsence=false → WILL be deducted.
 *  - Half-day leave: mark partial leave, half the working hours count.
 */
export function applyLeaveToRecords(
  records: ProcessedAttendanceRecord[],
  leaveDateMap: Record<string, string | LeaveDateEntry>
): ProcessedAttendanceRecord[] {
  return records.map((rec) => {
    const entry = leaveDateMap[rec.date];
    if (!entry) return rec;

    // Support both old (string) and new (LeaveDateEntry) formats
    let leaveType: string;
    let isUnpaid: boolean;
    let isHalfDay: boolean;

    if (typeof entry === "string") {
      leaveType = entry;
      isUnpaid = entry === arabicSource("common.without_salary");
      isHalfDay = false;
    } else {
      leaveType = entry.leaveType;
      isUnpaid = entry.isUnpaid;
      isHalfDay = entry.isHalfDay;
    }

    // If the employee was actually present (has check-in), leave doesn't override
    if (rec.status === "complete" && rec.checkInTime && rec.checkOutTime) {
      return {
        ...rec,
        isLeaveDay: true,
        leaveType,
        isUnpaidLeave: isUnpaid,
      };
    }

    // For absent days or missing punch days — mark as leave
    return {
      ...rec,
      status: "leave" as const,
      isLeaveDay: true,
      leaveType,
      isUnpaidLeave: isUnpaid,
      excusedAbsence: !isUnpaid,
      excusedShortfall: !isUnpaid,
      workingHours: isHalfDay ? (rec.workingHours || 0) : 0,
      overtimeHours: 0,
      isLate: false,
      lateMinutes: 0,
      isEarly: false,
    };
  });
}
