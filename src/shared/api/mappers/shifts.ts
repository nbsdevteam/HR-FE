import type { DbShift, DbEmployeeShiftAssignment } from "../../hooks";
import { sid, num, bool, empty, hhmmFromFloatOrLabel } from "./mapHelpers";

export const mapShift = (r: any): DbShift => {
  const start = hhmmFromFloatOrLabel(r.start_time, r.start_time_label || r.sunday_start);
  const end = hhmmFromFloatOrLabel(r.end_time, r.end_time_label || r.sunday_end);
  return {
    id: sid(r.id),
    name: r.name_ar || r.name || "",
    description: r.description || null,
    is_default: bool(r.is_default),
    grace_minutes: num(r.grace_minutes ?? r.grace_period_minutes),
    late_to_absent_hours: num(r.late_to_absent_hours, 3),
    target_hours_per_day: num(r.target_hours_per_day ?? r.working_hours, 8),
    sunday_is_working: bool(r.sunday_is_working ?? r.sunday_working),
    sunday_start: r.sunday_start || start,
    sunday_end: r.sunday_end || end,
    monday_is_working: bool(r.monday_is_working ?? r.monday_working),
    monday_start: r.monday_start || start,
    monday_end: r.monday_end || end,
    tuesday_is_working: bool(r.tuesday_is_working ?? r.tuesday_working),
    tuesday_start: r.tuesday_start || start,
    tuesday_end: r.tuesday_end || end,
    wednesday_is_working: bool(r.wednesday_is_working ?? r.wednesday_working),
    wednesday_start: r.wednesday_start || start,
    wednesday_end: r.wednesday_end || end,
    thursday_is_working: bool(r.thursday_is_working ?? r.thursday_working),
    thursday_start: r.thursday_start || start,
    thursday_end: r.thursday_end || end,
    friday_is_working: bool(r.friday_is_working ?? r.friday_working),
    friday_start: r.friday_start || start,
    friday_end: r.friday_end || end,
    saturday_is_working: bool(r.saturday_is_working ?? r.saturday_working),
    saturday_start: r.saturday_start || start,
    saturday_end: r.saturday_end || end,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapShiftAssignment = (r: any): DbEmployeeShiftAssignment => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    shift_id: sid(r.shift_id),
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    is_active: r.active !== false && r.is_active !== false,
    notes: r.notes || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
