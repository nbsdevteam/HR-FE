import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";
import type { DbEmployee, DbDepartment } from "./core";

export interface DbShift {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  grace_minutes: number;
  late_to_absent_hours: number;
  target_hours_per_day: number;
  sunday_is_working: boolean;
  sunday_start: string;
  sunday_end: string;
  monday_is_working: boolean;
  monday_start: string;
  monday_end: string;
  tuesday_is_working: boolean;
  tuesday_start: string;
  tuesday_end: string;
  wednesday_is_working: boolean;
  wednesday_start: string;
  wednesday_end: string;
  thursday_is_working: boolean;
  thursday_start: string;
  thursday_end: string;
  friday_is_working: boolean;
  friday_start: string;
  friday_end: string;
  saturday_is_working: boolean;
  saturday_start: string;
  saturday_end: string;
  created_at: string;
  updated_at: string;
}

// ── Mock shifts for local testing ──
const _mockShifts: DbShift[] = [
  {
    id: "mock-shift-morning", name: arabicSource("messages.morning_shift"), description: arabicSource("messages.morning_official_working_hours"), is_default: true,
    grace_minutes: 10, late_to_absent_hours: 3, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "08:00:00", sunday_end: "16:00:00",
    monday_is_working: true, monday_start: "08:00:00", monday_end: "16:00:00",
    tuesday_is_working: true, tuesday_start: "08:00:00", tuesday_end: "16:00:00",
    wednesday_is_working: true, wednesday_start: "08:00:00", wednesday_end: "16:00:00",
    thursday_is_working: true, thursday_start: "08:00:00", thursday_end: "16:00:00",
    friday_is_working: false, friday_start: "08:00:00", friday_end: "16:00:00",
    saturday_is_working: false, saturday_start: "08:00:00", saturday_end: "16:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-evening", name: arabicSource("messages.evening_shift"), description: arabicSource("messages.evening_shift_2"), is_default: false,
    grace_minutes: 5, late_to_absent_hours: 2, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "16:00:00", sunday_end: "00:00:00",
    monday_is_working: true, monday_start: "16:00:00", monday_end: "00:00:00",
    tuesday_is_working: true, tuesday_start: "16:00:00", tuesday_end: "00:00:00",
    wednesday_is_working: true, wednesday_start: "16:00:00", wednesday_end: "00:00:00",
    thursday_is_working: true, thursday_start: "16:00:00", thursday_end: "00:00:00",
    friday_is_working: false, friday_start: "16:00:00", friday_end: "00:00:00",
    saturday_is_working: false, saturday_start: "16:00:00", saturday_end: "00:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-night", name: arabicSource("messages.night_shift"), description: arabicSource("messages.night_shift_2"), is_default: false,
    grace_minutes: 5, late_to_absent_hours: 2, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "00:00:00", sunday_end: "08:00:00",
    monday_is_working: true, monday_start: "00:00:00", monday_end: "08:00:00",
    tuesday_is_working: true, tuesday_start: "00:00:00", tuesday_end: "08:00:00",
    wednesday_is_working: true, wednesday_start: "00:00:00", wednesday_end: "08:00:00",
    thursday_is_working: true, thursday_start: "00:00:00", thursday_end: "08:00:00",
    friday_is_working: false, friday_start: "00:00:00", friday_end: "08:00:00",
    saturday_is_working: true, saturday_start: "00:00:00", saturday_end: "08:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-flexible", name: arabicSource("messages.flexible_working_hours"), description: arabicSource("messages.flexible_working_hours_6_hours_a_day"), is_default: false,
    grace_minutes: 30, late_to_absent_hours: 4, target_hours_per_day: 6,
    sunday_is_working: true, sunday_start: "09:00:00", sunday_end: "15:00:00",
    monday_is_working: true, monday_start: "09:00:00", monday_end: "15:00:00",
    tuesday_is_working: true, tuesday_start: "09:00:00", tuesday_end: "15:00:00",
    wednesday_is_working: true, wednesday_start: "09:00:00", wednesday_end: "15:00:00",
    thursday_is_working: true, thursday_start: "09:00:00", thursday_end: "15:00:00",
    friday_is_working: false, friday_start: "09:00:00", friday_end: "15:00:00",
    saturday_is_working: false, saturday_start: "09:00:00", saturday_end: "15:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

export const useShifts = () => {
  const { data: shifts, loading, refetch } = useAsyncList(async () => {
    try {
      const data = await odooData.fetchShifts();
      return data.length > 0 ? data : _mockShifts;
    } catch (e) {
      console.error(e);
      return _mockShifts;
    }
  });
  return { shifts, loading, refetch };
}

/** Convert DbShift to EmployeeSchedule format */
export const shiftToSchedule = (shift: DbShift): Record<string, { isWorkingDay: boolean; startTime: string; endTime: string }> => {
  return {
    sunday: { isWorkingDay: shift.sunday_is_working, startTime: shift.sunday_start, endTime: shift.sunday_end },
    monday: { isWorkingDay: shift.monday_is_working, startTime: shift.monday_start, endTime: shift.monday_end },
    tuesday: { isWorkingDay: shift.tuesday_is_working, startTime: shift.tuesday_start, endTime: shift.tuesday_end },
    wednesday: { isWorkingDay: shift.wednesday_is_working, startTime: shift.wednesday_start, endTime: shift.wednesday_end },
    thursday: { isWorkingDay: shift.thursday_is_working, startTime: shift.thursday_start, endTime: shift.thursday_end },
    friday: { isWorkingDay: shift.friday_is_working, startTime: shift.friday_start, endTime: shift.friday_end },
    saturday: { isWorkingDay: shift.saturday_is_working, startTime: shift.saturday_start, endTime: shift.saturday_end },
  };
}

/** Resolve the effective shift for an employee: employee override > department default > system default */
export const resolveEmployeeShift = (
  employee: DbEmployee,
  departments: DbDepartment[],
  shifts: DbShift[]
): DbShift | null => {
  // 1. Employee-level override
  if (employee.shift_id) {
    const s = shifts.find(sh => sh.id === employee.shift_id);
    if (s) return s;
  }
  // 2. Department default
  const dept = departments.find(d => d.name === employee.department);
  if (dept?.default_shift_id) {
    const s = shifts.find(sh => sh.id === dept.default_shift_id);
    if (s) return s;
  }
  // 3. System default (is_default = true)
  const def = shifts.find(sh => sh.is_default);
  return def || null;
}
