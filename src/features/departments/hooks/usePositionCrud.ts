import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment, DbPosition } from "@/shared/hooks";
import type { PositionNode } from "../types";
import type { PositionFormState } from "../components/PositionFormModal";
import { departmentManagerValue, directManagerPatch } from "../utils/directManager";
import { EMPTY_POSITION_FORM } from "../utils/positionFormDefaults";

type Options = {
  positions: DbPosition[];
  dbDepartments: DbDepartment[];
  setToast: Dispatch<SetStateAction<string | null>>;
};

/**
 * Create/edit/delete for a single position, split out of `usePositionsView`
 * so that hook stays under the file-size limit. Drag-to-assign and the
 * employee quick-edit live in their own sibling hooks the same way.
 */
export const usePositionCrud = ({ positions, dbDepartments, setToast }: Options) => {
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [posForm, setPosForm] = useState<PositionFormState>(EMPTY_POSITION_FORM);
  const [pendingDeletePosId, setPendingDeletePosId] = useState<string | null>(null);
  const [deletingPosition, setDeletingPosition] = useState(false);

  const createDesignationMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createDesignation(payload),
    "positions",
  );
  const updateDesignationMutation = useOdooMutation(
    ({ id, payload }: { id: string; payload: Record<string, unknown> }) => odooData.updateDesignation(id, payload),
    "positions",
  );
  const deleteDesignationMutation = useOdooMutation(
    (id: string) => odooData.deleteDesignation(id),
    "positions",
  );

  const handleAddPosition = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setSaving(true);

    let level = 0;
    if (addParentId) {
      const parent = positions.find((position: DbPosition) => position.id === addParentId);
      if (parent) level = parent.level + 1;
    }

    try {
      await createDesignationMutation.mutateAsync({
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        reports_to_job_id: addParentId,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
        level,
        ...directManagerPatch(dbDepartments, posForm.department_id, posForm.manager_id),
      });
      setToast(arabicSource("hierarchy.the_position_was_created_successfully"));
      setShowAddPositionModal(false);
      setPosForm(EMPTY_POSITION_FORM);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    }
    setSaving(false);
  }, [posForm, addParentId, positions, dbDepartments, createDesignationMutation.mutateAsync, setToast]);

  const handleEditPosition = useCallback(async () => {
    if (!editingPosition || !posForm.title_ar.trim()) return;
    setSaving(true);
    try {
      await updateDesignationMutation.mutateAsync({
        id: editingPosition.id,
        payload: {
          title_ar: posForm.title_ar.trim(),
          name: posForm.title_en.trim() || posForm.title_ar.trim(),
          department_id: posForm.department_id || null,
          max_headcount: parseInt(posForm.max_headcount) || 1,
          description: posForm.description.trim() || null,
          ...directManagerPatch(dbDepartments, posForm.department_id, posForm.manager_id),
        },
      });
      setToast(arabicSource("hierarchy.position_updated_successfully"));
      setEditingPosition(null);
      setPosForm(EMPTY_POSITION_FORM);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    }
    setSaving(false);
  }, [editingPosition, posForm, dbDepartments, updateDesignationMutation.mutateAsync, setToast]);

  const requestDeletePosition = useCallback((posId: string) => {
    setPendingDeletePosId(posId);
  }, []);

  const cancelDeletePosition = useCallback(() => {
    setPendingDeletePosId(null);
  }, []);

  const confirmDeletePosition = useCallback(async () => {
    if (!pendingDeletePosId) return;
    setDeletingPosition(true);
    try {
      await deleteDesignationMutation.mutateAsync(pendingDeletePosId);
      setToast(arabicSource("hierarchy.position_deleted"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setToast(`${arabicSource("common.error_2")} ${message}`);
    } finally {
      setDeletingPosition(false);
      setPendingDeletePosId(null);
    }
  }, [deleteDesignationMutation.mutateAsync, pendingDeletePosId, setToast]);

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
      // The department list is the same source the change/submit path
      // compares against, so the field opens on exactly the value a
      // no-op save would leave in place.
      manager_id:
        departmentManagerValue(dbDepartments, pos.department_id) ||
        pos.department_manager_id ||
        "",
      max_headcount: String(pos.max_headcount),
      description: pos.description || "",
    });
  }, [dbDepartments]);

  return {
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
  };
};
