import { empDisplayName, empNumber, type DbEmployee } from "@/shared/hooks";

/**
 * Accessors that adapt a `DbEmployee` to the shared `TypeAhead` component.
 *
 * These live in `shared` because employee pickers appear in evaluation,
 * training, warnings and leave as well as in the employees feature itself —
 * importing them from `@/features/employees/utils` made five unrelated features
 * reach into another feature's internals.
 */

export const getEmployeeId = (e: DbEmployee): string => e.id;

export const getEmployeeDescription = (e: DbEmployee): string | null => {
  const text = [e.department, e.device_employee_no ? `#${e.device_employee_no}` : ""]
    .filter(Boolean)
    .join(" · ");
  return text || null;
};

export const getEmployeeSearchText = (e: DbEmployee): string => {
  return [
    empDisplayName(e),
    e.name,
    e.arabic_name,
    e.department,
    e.position,
    e.email,
    e.device_employee_no,
    e.person_id != null ? String(e.person_id) : "",
    e.person_id != null ? empNumber(e.person_id) : "",
    e.id,
  ]
    .filter(Boolean)
    .join(" ");
};
