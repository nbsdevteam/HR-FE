import type { DbShift, DbEmployeeShiftAssignment } from "../../hooks";
import { sid, num, bool, empty, hhmmFromFloatOrLabel, isActive } from "./mapHelpers";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export const mapShift = (r: any): DbShift => {
  const start = hhmmFromFloatOrLabel(r.start_time, r.start_time_label || r.sunday_start);
  const end = hhmmFromFloatOrLabel(r.end_time, r.end_time_label || r.sunday_end);

  const dayFields: Record<string, boolean | string> = {};
  for (const day of DAYS) {
    dayFields[`${day}_is_working`] = bool(r[`${day}_is_working`] ?? r[`${day}_working`]);
    dayFields[`${day}_start`] = r[`${day}_start`] || start;
    dayFields[`${day}_end`] = r[`${day}_end`] || end;
  }

  return {
    id: sid(r.id),
    name: r.name_ar || r.name || "",
    description: r.description || null,
    is_default: bool(r.is_default),
    grace_minutes: num(r.grace_minutes ?? r.grace_period_minutes),
    late_to_absent_hours: num(r.late_to_absent_hours, 3),
    target_hours_per_day: num(r.target_hours_per_day ?? r.working_hours, 8),
    ...dayFields,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  } as DbShift;
}

export const mapShiftAssignment = (r: any): DbEmployeeShiftAssignment => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    shift_id: sid(r.shift_id),
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    is_active: isActive(r),
    notes: r.notes || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
