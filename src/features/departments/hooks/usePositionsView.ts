import { useState, useEffect, useCallback, useMemo } from "react";
import { empDisplayName, usePositions } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import { indexBy } from "@/shared/utils/collections";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { PositionNode, QuickEditDeptDesignationPayload } from "../types";
import { buildPositionTree } from "../utils/hierarchyTree";
import type { PositionFormState } from "../components/PositionFormModal";
import { usePositionAssignment } from "./usePositionAssignment";
import { usePositionFilters } from "./usePositionFilters";

export const EMPTY_POSITION_FORM: PositionFormState = {
  title_ar: "",
  title_en: "",
  department_id: "",
  max_headcount: "1",
  description: "",
};

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
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);
  const [draggingEmployeeId, setDraggingEmployeeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [posForm, setPosForm] = useState<PositionFormState>(EMPTY_POSITION_FORM);
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

  // Add position
  const handleAddPosition = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setSaving(true);

    // Calculate level from parent
    let level = 0;
    if (addParentId) {
      const parent = positions.find((position: DbPosition) => position.id === addParentId);
      if (parent) level = parent.level + 1;
    }

    try {
      await odooData.createDesignation({
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        reports_to_job_id: addParentId,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
        level,
      });
      setToast(arabicSource("hierarchy.the_position_was_created_successfully"));
      setShowAddPositionModal(false);
      setPosForm(EMPTY_POSITION_FORM);
      await refetchPositions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    }
    setSaving(false);
  }, [posForm, addParentId, positions, refetchPositions]);

  // Edit position
  const handleEditPosition = useCallback(async () => {
    if (!editingPosition || !posForm.title_ar.trim()) return;
    setSaving(true);
    try {
      await odooData.updateDesignation(editingPosition.id, {
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
      });
      setToast(arabicSource("hierarchy.position_updated_successfully"));
      setEditingPosition(null);
      setPosForm(EMPTY_POSITION_FORM);
      await refetchPositions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    }
    setSaving(false);
  }, [editingPosition, posForm, refetchPositions]);

  // Delete position
  const handleDeletePosition = useCallback(
    async (posId: string) => {
      if (!localizedConfirm(arabicSource("hierarchy.do_you_want_to_delete_this_post"))) return;
      setSaving(true);
      try {
        await odooData.deleteDesignation(posId);
        setToast(arabicSource("hierarchy.position_deleted"));
        await refetchPositions();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        setToast(`${arabicSource("common.error_2")} ${message}`);
      }
      setSaving(false);
    },
    [refetchPositions],
  );

  const closeAddEditModal = useCallback(() => {
    setShowAddPositionModal(false);
    setEditingPosition(null);
  }, []);

  const openAddModal = useCallback((parentId: string | null) => {
    setAddParentId(parentId);
    setPosForm(EMPTY_POSITION_FORM);
    setShowAddPositionModal(true);
  }, []);

  const openEditModal = useCallback((pos: PositionNode) => {
    setEditingPosition(pos);
    setPosForm({
      title_ar: pos.title_ar,
      title_en: pos.title_en || "",
      department_id: pos.department_id || "",
      max_headcount: String(pos.max_headcount),
      description: pos.description || "",
    });
  }, []);

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
        await odooData.updateEmployee(quickEditEmployee.id, payload);
        setToast(arabicSource("hierarchy.employee_data_has_been_updated_successfully"));
        setQuickEditEmployee(null);
        refetch();
        refetchPositions();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "";
        setToast(`${arabicSource("common.error_2")} ${message}`);
      }
      setQuickEditSaving(false);
    },
    [quickEditEmployee, refetch, refetchPositions],
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
    handleDeletePosition,
    closeAddEditModal,
    openAddModal,
    openEditModal,
    openQuickEditEmployee,
    closeQuickEditEmployee,
    handleQuickEditSave,
    ...filters,
  };
};
