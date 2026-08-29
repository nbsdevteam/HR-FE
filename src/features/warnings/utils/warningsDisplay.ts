import { empDisplayName, type DbEmployee, type DbWarning } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import type { WarningWithEmployee } from "../types";
import { statusKeyToLabel, typeKeyToLabel } from "./warningKeyMapping";

export const enrichWarnings = (
  warnings: DbWarning[],
  employees: DbEmployee[],
  warningTypes: string[],
  warningStatuses: string[],
): WarningWithEmployee[] => {
  // One index instead of a per-row `.find()` — the join was O(rows x employees).
  const employeeById = indexBy(employees, (e) => e.id);
  return warnings.map((w) => {
    const emp = employeeById.get(w.employee_id);
    return {
      ...w,
      type: typeKeyToLabel(w.type, warningTypes),
      status: statusKeyToLabel(w.status, warningStatuses),
      employeeName: emp ? empDisplayName(emp) : w.employee_id,
      employeeDepartment: emp?.department || "—",
    };
  });
};

export const filterWarnings = (
  warnings: WarningWithEmployee[],
  searchQuery: string,
  filterType: string,
  filterStatus: string,
): WarningWithEmployee[] => warnings.filter((w) => {
  const matchesSearch = searchQuery === "" ||
    (w.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     w.reason?.toLowerCase().includes(searchQuery.toLowerCase()));
  const matchesType = filterType === "" || w.type === filterType;
  const matchesStatus = filterStatus === "" || w.status === filterStatus;
  return matchesSearch && matchesType && matchesStatus;
});

// Escalation indicator: count active warnings per employee
export const computeWarningsByEmployee = (
  warnings: WarningWithEmployee[],
  activeStatusLabel: string,
): Record<string, number> => (
  warnings
    .filter((w) => w.status === activeStatusLabel)
    .reduce<Record<string, number>>((acc, w) => {
      acc[w.employee_id] = (acc[w.employee_id] || 0) + 1;
      return acc;
    }, {})
);

export const severityColor = (typeSeverity: Record<string, number>, type: string): string => (
  typeSeverity[type] >= 3 ? "#DC2626" : typeSeverity[type] >= 2 ? "#D4AF37" : "#3B82F6"
);
