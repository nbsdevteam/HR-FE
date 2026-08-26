import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbDepartment, DbEmployee, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { findParentOf } from "../utils/hierarchyTree";
import { useHierarchySetupActions } from "./useHierarchySetupActions";

// ── CRUD handlers — now with Supabase ──
export const useHierarchyCrud = (
  dbEmployees: DbEmployee[],
  dbDepartments: DbDepartment[],
  dbPositions: DbPosition[],
  orgTree: OrgNode,
  refetch: () => Promise<void>,
  setSaving: Dispatch<SetStateAction<boolean>>,
  setToast: Dispatch<SetStateAction<string | null>>,
  setDeleteTarget: Dispatch<SetStateAction<OrgNode | null>>,
  setSelectedNode: Dispatch<SetStateAction<OrgNode | null>>,
  setEditTarget: Dispatch<SetStateAction<OrgNode | null>>,
  setShowSetupModal: Dispatch<SetStateAction<boolean>>,
  setShowCleanupModal: Dispatch<SetStateAction<boolean>>,
) => {
  const { handleSetupHierarchy, handleCleanupDuplicates } = useHierarchySetupActions(
    dbEmployees, dbDepartments, refetch, setSaving, setToast, setShowSetupModal, setShowCleanupModal,
  );

  const handleDeleteEmployee = useCallback(async (node: OrgNode, reparent: boolean) => {
    if (node.dbId === "__root__") return;
    setSaving(true);

    // Find parent's dbId
    const parent = findParentOf(orgTree, node.id);
    const parentDbId = parent && parent.dbId !== "__root__" ? parent.dbId : null;

    if (reparent && node.children.length > 0) {
      // Move children's manager_id to this node's parent
      await Promise.all(node.children.map(c => odooData.updateEmployee(c.dbId, { manager_id: parentDbId })));
    } else if (!reparent && node.children.length > 0) {
      // Remove manager_id from all children (they become unlinked)
      await Promise.all(node.children.map(c => odooData.updateEmployee(c.dbId, { manager_id: null })));
    }

    // Remove this employee's manager_id (unlink from hierarchy)
    await odooData.updateEmployee(node.dbId, { manager_id: null });

    setDeleteTarget(null);
    setSelectedNode(null);
    setToast(arabicSource("hierarchy.the_employee_was_dismissed_from_the_organizational_structure"));
    await refetch();
    setSaving(false);
  }, [orgTree, refetch]);

  const handleEditEmployee = useCallback(async (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => {
    if (dbId === "__root__") return;
    setSaving(true);
    const odooUpdates: Record<string, string | null> = {};
    if (updates.name !== undefined) {
      odooUpdates.name = updates.name;
      odooUpdates.arabic_name = updates.name;
    }
    if (updates.position !== undefined) {
      const pos = dbPositions.find(p => p.title_ar === updates.position);
      odooUpdates.position_id = pos?.id || null;
    }
    if (updates.department !== undefined) {
      const dept = dbDepartments.find(d => d.name === updates.department);
      odooUpdates.department_id = dept?.id || null;
    }
    if (updates.manager_id !== undefined) odooUpdates.manager_id = updates.manager_id;
    try {
      await odooData.updateEmployee(dbId, odooUpdates);
      setToast(arabicSource("hierarchy.employee_data_has_been_updated_successfully"));
      setEditTarget(null);
      setSelectedNode(null);
      await refetch();
    } catch (err: unknown) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : ""}`);
    }
    setSaving(false);
  }, [refetch, dbDepartments, dbPositions]);

  const handleLinkEmployee = useCallback(async (empDbId: string, managerDbId: string) => {
    setSaving(true);
    try {
      await odooData.updateEmployee(empDbId, { manager_id: managerDbId });
      setToast(arabicSource("hierarchy.the_employee_has_been_successfully_linked_to_his_manager"));
      await refetch();
    } catch (err: unknown) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : ""}`);
    }
    setSaving(false);
  }, [refetch]);

  const handleAddDepartment = useCallback(async (name: string, color: string) => {
    setSaving(true);
    try {
      const existing = dbDepartments.find(d => d.name === name);
      if (existing) {
        await odooData.updateDepartment(existing.id, { color });
      } else {
        await odooData.createDepartment({ name, color });
      }
      setToast(arabicSource("hierarchy.the_department_was_added_successfully"));
      await refetch();
    } catch (err: unknown) {
      setToast(`${arabicSource("common.error_2")} ${err instanceof Error ? err.message : ""}`);
    }
    setSaving(false);
  }, [dbDepartments, refetch]);

  return {
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
  };
};
