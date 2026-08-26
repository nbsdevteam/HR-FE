import { useState, useMemo, useCallback, useEffect } from "react";
import type { Employee } from "@/features/employees";
import { useEmployees, usePositions } from "@/shared/hooks";
import type { DbDepartment } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { useEmployeeAddForm } from "./useEmployeeAddForm";
import { useEmployeeDeleteFlow } from "./useEmployeeDeleteFlow";
import { useEmployeeListFilters } from "./useEmployeeListFilters";

export const useEmployeesPage = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dbDepartmentOptions, setDbDepartmentOptions] = useState<DbDepartment[]>([]);

  const { employees: dbEmployees, loading: dbLoading, refetch } = useEmployees();
  const { positions: designations } = usePositions();

  const listFilters = useEmployeeListFilters(dbEmployees, dbDepartmentOptions);
  const addFormState = useEmployeeAddForm(dbEmployees, designations, refetch);
  const deleteFlow = useEmployeeDeleteFlow(dbEmployees, refetch);

  const selectedEmployeeOptions = useMemo(
    () => selectedEmployee ? listFilters.employeeOptions.filter(e => e.dbId !== selectedEmployee.dbId) : listFilters.employeeOptions,
    [listFilters.employeeOptions, selectedEmployee],
  );

  const handleDetailClose = useCallback(() => setSelectedEmployee(null), []);

  const handleDetailSave = useCallback(() => {
    refetch();
    setSelectedEmployee(null);
  }, [refetch]);

  useEffect(() => {
    odooData.fetchDepartments().then(setDbDepartmentOptions).catch(() => {});
  }, []);

  return {
    ...addFormState,
    ...deleteFlow,
    ...listFilters,
    dbDepartmentOptions,
    dbEmployees,
    dbLoading,
    employeeOptions: selectedEmployeeOptions,
    handleDetailClose,
    handleDetailSave,
    selectedEmployee,
    setSelectedEmployee,
  };
};
