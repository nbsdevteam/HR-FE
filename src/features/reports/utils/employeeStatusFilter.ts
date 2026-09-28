import { isActiveEmployeeStatus } from "@/i18n/status";
import type { EmployeeStatusFilter } from "../types";

/** Whether an employee's HR status falls inside the picker's status filter. */
export const matchesEmployeeStatusFilter = (
  status: string | null,
  filter: EmployeeStatusFilter,
): boolean => {
  if (filter === "all") return true;
  return isActiveEmployeeStatus(status) === (filter === "active");
};
