import { useState, useMemo } from "react";
import type { Employee, EmployeeOption } from "@/features/employees";
import type { DbDepartment, DbEmployee } from "@/shared/hooks";
import { empDisplayName } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { toEmployees } from "../utils/employeeMapper";
import { sortEmployees } from "../utils/employeeSort";
import type { EmployeeSortKey, EmployeeViewMode } from "../types";

export const useEmployeeListFilters = (dbEmployees: DbEmployee[], dbDepartments: DbDepartment[]) => {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(arabicSource("common.all"));
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("list");
  const [sortBy, setSortBy] = useState<EmployeeSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  /** Shows archived (soft-deleted) employees alongside active ones — backend §3.4. */
  const [includeArchived, setIncludeArchived] = useState(false);

  const allEmployees = useMemo(() => toEmployees(dbEmployees), [dbEmployees]);

  const employeeOptions: EmployeeOption[] = useMemo(() =>
    dbEmployees.map(e => ({
      dbId: e.id,
      name: empDisplayName(e),
      position: e.position || e.department || "—",
    })), [dbEmployees]);

  /**
   * Union of the canonical backend department list and whatever department
   * names appear on employees, so a department with no active employees
   * still gets a column instead of silently disappearing. Sorted so column
   * position is deterministic rather than depending on employee fetch order.
   */
  const realDepts = useMemo(() => {
    const depts = new Set([
      ...dbDepartments.map(d => d.name),
      ...allEmployees.map(e => e.department),
    ]);
    const sorted = Array.from(depts).sort((a, b) => a.localeCompare(b, "ar"));
    return [arabicSource("common.all"), ...sorted];
  }, [allEmployees, dbDepartments]);

  /**
   * The department filter is chosen by name (the kanban board groups by name,
   * and `realDepts` carries names that only ever appear on an employee row),
   * but the paginated list endpoint filters by `department_id`. Employee rows
   * carry both, so they close the gap for any name the department list itself
   * doesn't cover.
   */
  const departmentIdByName = useMemo(() => {
    const byName = new Map<string, string>();
    for (const e of dbEmployees) {
      if (e.department && e.department_id && !byName.has(e.department)) byName.set(e.department, e.department_id);
    }
    for (const d of dbDepartments) byName.set(d.name, d.id);
    return byName;
  }, [dbEmployees, dbDepartments]);

  const selectedDeptId = useMemo(
    () => selectedDept === arabicSource("common.all") ? null : departmentIdByName.get(selectedDept) ?? null,
    [selectedDept, departmentIdByName],
  );

  const deviceSyncedSet = useMemo(() => {
    const set = new Set<number>();
    dbEmployees.forEach(e => {
      if (e.device_employee_no) set.add(e.person_id);
    });
    return set;
  }, [dbEmployees]);

  const pendingEmployees = useMemo(() => {
    return new Set(dbEmployees.filter(e => e.status === arabicSource("common.pending")).map(e => e.person_id));
  }, [dbEmployees]);

  /**
   * Client-side filter over the full locally held roster. The list table is
   * server-paginated and does not use this — the kanban board does, because it
   * has to group every employee into a column at once. Trimmed + lowercased on
   * both sides so it matches the server search's case-insensitive behavior.
   */
  const filtered: Employee[] = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = allEmployees.filter(emp => {
      const matchSearch =
        emp.name.toLowerCase().includes(normalizedSearch) ||
        emp.position.toLowerCase().includes(normalizedSearch) ||
        emp.employeeNumber.toLowerCase().includes(normalizedSearch);
      const matchDept = selectedDept === arabicSource("common.all") || emp.department === selectedDept;
      return matchSearch && matchDept;
    });
    return sortEmployees(list, sortBy, sortDir);
  }, [allEmployees, search, selectedDept, sortBy, sortDir]);

  const kanbanDepts = useMemo(
    () => realDepts.filter(dept => dept !== arabicSource("common.all")),
    [realDepts],
  );

  return {
    allEmployees,
    deviceSyncedSet,
    employeeOptions,
    filtered,
    includeArchived,
    kanbanDepts,
    pendingEmployees,
    realDepts,
    search,
    selectedDept,
    selectedDeptId,
    setIncludeArchived,
    setSearch,
    setSelectedDept,
    setSortBy,
    setSortDir,
    setViewMode,
    sortBy,
    sortDir,
    viewMode,
  };
};
