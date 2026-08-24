import { hrCall } from "./client";
import { mapShift, mapShiftAssignment } from "./mappers";
import type { DbShift, DbEmployeeShiftAssignment } from "../hooks";
import { eid } from "./httpHelpers";
import { crudFactory, fetchList } from "./crud";

const shifts = crudFactory("/api/hr/shifts");

export const fetchShifts = (): Promise<DbShift[]> =>
  fetchList("/api/hr/shifts/list", mapShift, { limit: 200 });

export const fetchShiftAssignments = (): Promise<DbEmployeeShiftAssignment[]> =>
  fetchList("/api/hr/shift_assignments/list", mapShiftAssignment, { active_only: true, limit: 500 });

export const createShift = shifts.create;
export const updateShift = shifts.update;
export const deleteShift = shifts.remove;

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
