import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

export interface DbAttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  day_of_week: string;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours: number;
  overtime_hours: number;
  is_late: boolean;
  late_minutes: number;
  is_early: boolean;
  status: string; // "complete", "missing_checkout", etc.
  created_at: string;
  auto_checkout_applied: boolean;
  // Biometric device fields
  source?: "device" | "manual" | null;
  verify_mode?: string | null;
  device_employee_no?: string | null;
  device_id?: string | null;
  // Excuse/override fields
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
  excuse_note?: string | null;
  excused_by?: string | null;
  excused_at?: string | null;
}

export interface DbMonthlyRecord {
  id: string;
  employee_id: string;
  month_year: string;
  imported_at: string;
  salary_calculation: {
    lateDays: number;
    earlyDays: number;
    monthYear: string;
    netSalary: number;
    [key: string]: any;
  };
}

export interface DbMonthlyLedger {
  id: string;
  employee_id: string;
  month_year: string;
  grace_consumed_minutes: number;
  chargeable_late_minutes: number;
  absence_days: string[] | null;
  loan_by_currency: Record<string, number>;
  tip_by_currency: Record<string, number>;
  penalty_by_currency: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceRecordsFilter = {
  date?: string;
  date_from?: string;
  date_to?: string;
  employeeId?: string;
};

export const useAttendanceRecords = (dateOrFilter?: string | AttendanceRecordsFilter) => {
  const filter: AttendanceRecordsFilter =
    typeof dateOrFilter === "string" || dateOrFilter === undefined
      ? { date: dateOrFilter }
      : dateOrFilter;

  const { data: records, loading, refetch } = useCachedList(
    "attendance",
    () => odooData.fetchAttendance({
      date: filter.date,
      date_from: filter.date_from,
      date_to: filter.date_to,
      employee_id: filter.employeeId,
    }),
    "Failed to load attendance",
    [filter.date, filter.date_from, filter.date_to, filter.employeeId],
  );

  return { records, loading, refetch };
}

export const useMonthlyRecords = (monthYear?: string) => {
  const { data: records, loading, refetch } = useCachedList(
    "monthlyRecords",
    () => odooData.fetchMonthlyRecords(monthYear),
    "Failed to load monthly records",
    [monthYear],
  );
  return { records, loading, refetch };
}

export const useMonthlyLedgers = (monthYear?: string) => {
  const { data: ledgers, loading, refetch } = useCachedList(
    "monthlyLedgers",
    () => odooData.fetchMonthlyLedgers(monthYear),
    "Failed to load monthly ledgers",
    [monthYear],
  );
  return { ledgers, loading, refetch };
}

/** Map attendance status from DB to Arabic display */
export const mapAttendanceStatus = (status: string, isLate: boolean): string | string | string | string => {
  if (status === "complete" && isLate) return arabicSource("common.late");
  if (status === "complete" || status === "missing_checkout" || status === "checked_in" || status === "missing_checkin" || status === "auto_checkout") return arabicSource("common.present");
  if (status === "absent") return arabicSource("common.absent");
  if (status === "leave") return arabicSource("common.leave");
  return arabicSource("common.present");
}

/** Format time string (HH:MM:SS) to 12-hour format (h:MM AM/PM) */
export const formatTime = (t: string | null): string => {
  if (!t) return "—";
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const suffix = h < 12 ? arabicSource("common.p") : arabicSource("common.m");
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

/** Format working hours number to H:MM */
export const formatWorkHours = (h: number): string => {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}:${String(mins).padStart(2, "0")}`;
}
