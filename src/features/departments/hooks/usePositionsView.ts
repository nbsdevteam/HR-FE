import { useState, useEffect, useCallback, useMemo } from "react";
import { empDisplayName, usePositions } from "@/shared/hooks";
import type { DbEmployee, DbDepartment } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import type { QuickEditDeptDesignationPayload } from "../types";
import { buildPositionTree } from "../utils/hierarchyTree";
import { usePositionAssignment } from "./usePositionAssignment";
import { usePositionCrud } from "./usePositionCrud";
import { usePositionFilters } from "./usePositionFilters";

export { EMPTY_POSITION_FORM } from "../utils/positionFormDefaults";

export const usePositionsView = ({
  dbEmployees,
  dbDepartments,
  deptColors,
  refetch,
}: {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  deptColors: Record<string, string>;
  refetch: () => void;
}) => {
  const [empSearch, setEmpSearch] = useState("");
  const [draggingEmployeeId, setDraggingEmployeeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [quickEditEmployee, setQuickEditEmployee] = useState<DbEmployee | null>(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);

  const { positions, loading: posLoading, refetch: refetchPositions } = usePositions();

  const showToast = useCallback((message: string): void => setToast(message), []);

  const {
    effectiveEmployees,
    assigning,
    undoEntry,
    assignEmployee,
    undoAssignment,
  } = usePositionAssignment({
    dbEmployees,
    dbDepartments,
    positions,
    refetch,
    refetchPositions,
    onToast: showToast,
  });

  const {
    showAddPositionModal,
    editingPosition,
    saving,
    posForm,
    setPosForm,
    pendingDeletePosId,
    deletingPosition,
    handleAddPosition,
    handleEditPosition,
    requestDeletePosition,
    cancelDeletePosition,
    confirmDeletePosition,
    closeAddEditModal,
    openAddModal,
    openEditModal,
  } = usePositionCrud({ positions, dbDepartments, setToast });

  const updateEmployeeMutation = useOdooMutation(
    ({ id, payload }: { id: string; payload: QuickEditDeptDesignationPayload }) => odooData.updateEmployee(id, payload),
    ["employees", "positions"],
  );

  // Built once here instead of `.find()`-ing the department list inside every row.
  const departmentsById = useMemo(
    () => indexBy(dbDepartments, (department) => department.id),
    [dbDepartments],
  );

  const positionTree = useMemo(
    () => buildPositionTree(positions, effectiveEmployees),
    [positions, effectiveEmployees],
  );

  const filters = usePositionFilters({ positionTree, departmentsById, deptColors });

  // Unassigned employees (no position_id)
  const unassignedEmployees = useMemo(
    () => effectiveEmployees.filter((employee) => !employee.position_id),
    [effectiveEmployees],
  );

  const filteredUnassigned = useMemo(() => {
    const query = empSearch.trim().toLowerCase();
    if (!query) return unassignedEmployees;
    return unassignedEmployees.filter(
      (employee) =>
        empDisplayName(employee).toLowerCase().includes(query) ||
        (employee.department || "").toLowerCase().includes(query),
    );
  }, [unassignedEmployees, empSearch]);

  const clearEmpSearch = useCallback((): void => setEmpSearch(""), []);

  const handleEmployeeDragStateChange = useCallback((employeeId: string | null): void => {
    setDraggingEmployeeId(employeeId);
  }, []);

  const handleDrop = useCallback(
    (employeeId: string, positionId: string): void => {
      setDraggingEmployeeId(null);
      void assignEmployee(employeeId, positionId);
    },
    [assignEmployee],
  );

  const openQuickEditEmployee = useCallback((employee: DbEmployee): void => {
    setQuickEditEmployee(employee);
  }, []);

  const closeQuickEditEmployee = useCallback((): void => {
    setQuickEditEmployee(null);
  }, []);

  const handleQuickEditSave = useCallback(
    async (payload: QuickEditDeptDesignationPayload): Promise<void> => {
      if (!quickEditEmployee) return;
      setQuickEditSaving(true);
      try {
        await updateEmployeeMutation.mutateAsync({ id: quickEditEmployee.id, payload });
        setToast(arabicSource("hierarchy.employee_data_has_been_updated_successfully"));
        setQuickEditEmployee(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        setToast(`${arabicSource("common.error_2")} ${message}`);
      }
      setQuickEditSaving(false);
    },
    [quickEditEmployee, updateEmployeeMutation.mutateAsync],
  );

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return {
    empSearch,
    setEmpSearch,
    clearEmpSearch,
    showAddPositionModal,
    editingPosition,
    toast,
    saving,
    assigning,
    posForm,
    setPosForm,
    posLoading,
    positions,
    unassignedEmployees,
    filteredUnassigned,
    isDragActive: draggingEmployeeId !== null,
    undoEntry,
    quickEditEmployee,
    quickEditSaving,
    handleEmployeeDragStateChange,
    handleDrop,
    undoAssignment,
    handleAddPosition,
    handleEditPosition,
    pendingDeletePosId,
    deletingPosition,
    requestDeletePosition,
    cancelDeletePosition,
    confirmDeletePosition,
    closeAddEditModal,
    openAddModal,
    openEditModal,
    openQuickEditEmployee,
    closeQuickEditEmployee,
    handleQuickEditSave,
    ...filters,
  };
};
