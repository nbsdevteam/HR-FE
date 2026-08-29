import { useMemo } from "react";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";

export const useEmployeeLookups = (employees: DbEmployee[]) => {
  const empMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach(e => { m[e.id] = empDisplayName(e); });
    return m;
  }, [employees]);

  const empDeptMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach(e => { m[e.id] = e.department || ""; });
    return m;
  }, [employees]);

  return { empMap, empDeptMap };
};
