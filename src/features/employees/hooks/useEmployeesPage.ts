import { useState, useMemo, useCallback, useEffect } from "react";
import type { Employee } from "@/features/employees";
import { useEmployees, usePositions } from "@/shared/hooks";
import type { DbDepartment } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { useEmployeeAddForm } from "./useEmployeeAddForm";
import { useEmployeeDeleteFlow } from "./useEmployeeDeleteFlow";
import { useEmployeeListFilters } from "./useEmployeeListFilters";

/** Detail-only fields the lean `/employees/list` endpoint never echoes back, so a
 * post-save refetch would otherwise redisplay them as blank even though the save
 * itself succeeded. Kept in memory and reapplied when an employee is reselected.
 * `address`/`work_location` are no longer in this gap — the backend now returns
 * them on `/employees/list` too. */
type LeanListGapFields = Pick<
  Employee,
  "nationalId" | "emergencyContact" | "emergencyPhone" | "bloodType" | "endDate"
>;

const pickLeanListGapFields = (employee: Employee): LeanListGapFields => ({
  nationalId: employee.nationalId,
  emergencyContact: employee.emergencyContact,
  emergencyPhone: employee.emergencyPhone,
  bloodType: employee.bloodType,
  endDate: employee.endDate,
});

export const useEmployeesPage = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailStartsInEditMode, setDetailStartsInEditMode] = useState(false);
  const [dbDepartmentOptions, setDbDepartmentOptions] = useState<DbDepartment[]>([]);
  const [recentEdits, setRecentEdits] = useState<Record<string, LeanListGapFields>>({});

  const { employees: dbEmployees, loading: dbLoading, refetch } = useEmployees();
  const { positions: designations } = usePositions();

  const listFilters = useEmployeeListFilters(dbEmployees, dbDepartmentOptions);
  const addFormState = useEmployeeAddForm(dbEmployees, designations, refetch);
  const deleteFlow = useEmployeeDeleteFlow(dbEmployees, refetch);

  const selectedEmployeeOptions = useMemo(
    () => selectedEmployee ? listFilters.employeeOptions.filter(e => e.dbId !== selectedEmployee.dbId) : listFilters.employeeOptions,
    [listFilters.employeeOptions, selectedEmployee],
  );

  const handleDetailClose = useCallback(() => {
    setSelectedEmployee(null);
    setDetailStartsInEditMode(false);
  }, []);

  const handleSelectEmployee = useCallback((employee: Employee) => {
    const override = recentEdits[employee.dbId];
    setDetailStartsInEditMode(false);
    setSelectedEmployee(override ? { ...employee, ...override } : employee);
  }, [recentEdits]);

  const handleEditEmployee = useCallback((employee: Employee) => {
    const override = recentEdits[employee.dbId];
    setDetailStartsInEditMode(true);
    setSelectedEmployee(override ? { ...employee, ...override } : employee);
  }, [recentEdits]);

  const handleDetailSave = useCallback((saved?: Employee) => {
    if (saved) {
      setRecentEdits(prev => ({ ...prev, [saved.dbId]: pickLeanListGapFields(saved) }));
    }
    refetch();
    setSelectedEmployee(null);
    setDetailStartsInEditMode(false);
  }, [refetch]);

  useEffect(() => {
    odooData.fetchDepartments().then(setDbDepartmentOptions).catch((e: unknown) => {
      console.error("Failed to load departments", e);
    });
  }, []);

  return {
    ...addFormState,
    ...deleteFlow,
    ...listFilters,
    dbDepartmentOptions,
    dbEmployees,
    dbLoading,
    designations,
    detailStartsInEditMode,
    employeeOptions: selectedEmployeeOptions,
    handleDetailClose,
    handleDetailSave,
    handleEditEmployee,
    handleSelectEmployee,
    selectedEmployee,
    setSelectedEmployee,
  };
};
