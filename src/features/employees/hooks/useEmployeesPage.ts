import { useState, useMemo, useCallback, useEffect } from "react";
import type { Employee } from "@/features/employees";
import { useDepartments, useEmployees, usePositions } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { toEmployees } from "../utils/employeeMapper";
import { sortEmployees } from "../utils/employeeSort";
import { useEmployeeAddForm } from "./useEmployeeAddForm";
import { useEmployeeDeleteFlow } from "./useEmployeeDeleteFlow";
import { useEmployeeListFilters } from "./useEmployeeListFilters";
import { useEmployeeStatusActions } from "./useEmployeeStatusActions";
import { useEmployeesPaged } from "./useEmployeesPaged";

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
  const [recentEdits, setRecentEdits] = useState<Record<string, LeanListGapFields>>({});
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const { employees: dbEmployees, loading: dbLoading, refetch } = useEmployees();
  const { departments: dbDepartmentOptions } = useDepartments();
  const { positions: designations } = usePositions();

  const listFilters = useEmployeeListFilters(dbEmployees, dbDepartmentOptions);
  const paged = useEmployeesPaged({
    search: listFilters.search,
    departmentId: listFilters.selectedDeptId,
    includeArchived: listFilters.includeArchived,
    // The kanban board groups the whole roster into columns, so it keeps using
    // the full-roster fetch; paging it would hide employees behind a pager the
    // board has nowhere to put.
    enabled: listFilters.viewMode === "list",
  });

  // A create/update/delete has to invalidate both reads: the cached full roster
  // that feeds the stats and dropdowns, and the current page of the table.
  const refetchAll = useCallback(() => {
    refetch();
    paged.refetchPage();
  }, [refetch, paged.refetchPage]);

  const addFormState = useEmployeeAddForm(dbEmployees, designations, refetchAll);
  const deleteFlow = useEmployeeDeleteFlow(dbEmployees, refetchAll, currentEmployeeId);
  const statusActions = useEmployeeStatusActions(refetchAll);

  /** The server-returned page, ordered by the table's active sort column. */
  const pagedEmployees = useMemo(
    () => sortEmployees(toEmployees(paged.pageEmployees), listFilters.sortBy, listFilters.sortDir),
    [paged.pageEmployees, listFilters.sortBy, listFilters.sortDir],
  );

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
    refetchAll();
    setSelectedEmployee(null);
    setDetailStartsInEditMode(false);
  }, [refetchAll]);

  // Used to withhold the delete/suspend row actions for the signed-in user's
  // own employee record (backend §3.2, `employee_self_delete`).
  useEffect(() => {
    odooData.fetchCurrentEmployee().then(me => setCurrentEmployeeId(me.id)).catch((e: unknown) => {
      console.error("Failed to load current employee", e);
    });
  }, []);

  return {
    ...addFormState,
    ...deleteFlow,
    ...listFilters,
    ...paged,
    ...statusActions,
    pagedEmployees,
    currentEmployeeId,
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
