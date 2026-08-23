import { empDisplayName, empNumber, type DbEmployee } from "@/shared/hooks";

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
