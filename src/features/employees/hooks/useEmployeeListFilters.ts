import { useState, useMemo } from "react";
import type { Employee, EmployeeOption } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { empDisplayName } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { toEmployee } from "../utils/employeeMapper";
import type { EmployeeSortKey, EmployeeViewMode } from "../types";

export const useEmployeeListFilters = (dbEmployees: DbEmployee[]) => {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(arabicSource("common.all"));
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("list");
  const [sortBy, setSortBy] = useState<EmployeeSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const allEmployees = useMemo(() => dbEmployees.map(e => toEmployee(e, dbEmployees)), [dbEmployees]);

  const employeeOptions: EmployeeOption[] = useMemo(() =>
    dbEmployees.map(e => ({
      dbId: e.id,
      name: empDisplayName(e),
      position: e.position || e.department || "—",
    })), [dbEmployees]);

  const realDepts = useMemo(() => {
    const depts = new Set(allEmployees.map(e => e.department));
    return [arabicSource("common.all"), ...Array.from(depts)];
  }, [allEmployees]);

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

  const filtered: Employee[] = useMemo(() => {
    const list = allEmployees.filter(emp => {
      const matchSearch = emp.name.includes(search) || emp.position.includes(search) || emp.employeeNumber.includes(search);
      const matchDept = selectedDept === arabicSource("common.all") || emp.department === selectedDept;
      return matchSearch && matchDept;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "name") return dir * a.name.localeCompare(b.name, "ar");
      if (sortBy === "employeeNumber") return dir * a.employeeNumber.localeCompare(b.employeeNumber);
      if (sortBy === "deviceNo") return dir * (parseInt(a.employeeNumber || "0") - parseInt(b.employeeNumber || "0"));
      if (sortBy === "department") return dir * a.department.localeCompare(b.department, "ar");
      if (sortBy === "position") return dir * a.position.localeCompare(b.position, "ar");
      if (sortBy === "status") return dir * a.status.localeCompare(b.status, "ar");
      if (sortBy === "joinDate") return dir * (a.joinDate || "").localeCompare(b.joinDate || "");
      if (sortBy === "salary") return dir * (a.salary - b.salary);
      return 0;
    });
    return list;
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
    kanbanDepts,
    pendingEmployees,
    realDepts,
    search,
    selectedDept,
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
