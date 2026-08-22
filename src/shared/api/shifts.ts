import { hrCall } from "./client";
import { mapShift, mapShiftAssignment } from "./mappers";
import type { DbShift, DbEmployeeShiftAssignment } from "../hooks";
import { items, eid } from "./httpHelpers";

export const fetchShifts = async (): Promise<DbShift[]> => {
  const rows = await items<any>("/api/hr/shifts/list", { limit: 200 });
  return rows.map(mapShift);
}

export const fetchShiftAssignments = async (): Promise<DbEmployeeShiftAssignment[]> => {
  const rows = await items<any>("/api/hr/shift_assignments/list", { active_only: true, limit: 500 });
  return rows.map(mapShiftAssignment);
}

export const createShift = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/shifts/create", payload);
}

export const updateShift = async (shiftId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/update`, payload);
}

export const deleteShift = async (shiftId: string | number) => {
  return hrCall(`/api/hr/shifts/${eid(shiftId)}/delete`, {});
}

export const createShiftAssignment = async (payload: {
  employee_id: string | number;
  shift_id: string | number;
  start_date?: string;
  end_date?: string | null;
  set_employee_default?: boolean;
}) => {
  return hrCall("/api/hr/shift_assignments/create", {
    employee_id: eid(payload.employee_id),
    shift_id: eid(payload.shift_id),
    start_date: payload.start_date || new Date().toISOString().slice(0, 10),
    end_date: payload.end_date || false,
    set_employee_default: payload.set_employee_default !== false,
  });
}
