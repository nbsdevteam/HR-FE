import type { Employee } from "../types";
import type { EmployeeSortKey } from "../types";

/**
 * Comparator for the employee table's sortable columns.
 *
 * Extracted so the kanban board (which sorts the whole locally held roster) and
 * the list table (which sorts the one page the server returned) order rows by
 * exactly the same rules instead of keeping two copies in step by hand.
 */
export const compareEmployees = (
  a: Employee,
  b: Employee,
  sortBy: EmployeeSortKey,
  sortDir: "asc" | "desc",
): number => {
  const dir = sortDir === "asc" ? 1 : -1;
  if (sortBy === "name") return dir * a.name.localeCompare(b.name, "ar");
  if (sortBy === "employeeNumber") return dir * a.employeeNumber.localeCompare(b.employeeNumber);
  if (sortBy === "deviceNo") return dir * (parseInt(a.employeeNumber || "0") - parseInt(b.employeeNumber || "0"));
  if (sortBy === "department") return dir * a.department.localeCompare(b.department, "ar");
  if (sortBy === "position") return dir * a.position.localeCompare(b.position, "ar");
  if (sortBy === "status") return dir * a.status.localeCompare(b.status, "ar");
  if (sortBy === "joinDate") return dir * (a.joinDate || "").localeCompare(b.joinDate || "");
  if (sortBy === "salary") return dir * (a.salary - b.salary);
  return 0;
};

export const sortEmployees = (
  employees: Employee[],
  sortBy: EmployeeSortKey,
  sortDir: "asc" | "desc",
): Employee[] => [...employees].sort((a, b) => compareEmployees(a, b, sortBy, sortDir));
