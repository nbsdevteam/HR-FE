import { useState, useCallback } from "react";
import type { OrgNode } from "../types";

/**
 * Every "which dialog is open" flag on the hierarchy page, plus the open/close
 * handlers built from them. Extracted from `useHierarchyPage` so the eight
 * visibility flags and their handlers live in one cohesive place.
 */
export const useHierarchyModals = () => {
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalManagerId, setAddModalManagerId] = useState<number | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<OrgNode | null>(null);
  const [editTarget, setEditTarget] = useState<OrgNode | null>(null);
  const [showUnlinked, setShowUnlinked] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);

  const openAddModal = useCallback((managerId?: number) => {
    setAddModalManagerId(managerId ?? null);
    setShowAddModal(true);
  }, []);

  const openAddDepartmentModal = useCallback(() => {
    setShowAddDepartmentModal(true);
  }, []);

  const handleShowUnlinked = useCallback(() => setShowUnlinked(true), []);

  const handleSelectNode = useCallback(
    (node: OrgNode) => setSelectedNode(node),
    [],
  );

  const handleCloseSelectedNode = useCallback(() => setSelectedNode(null), []);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddModalManagerId(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => setDeleteTarget(null), []);

  const handleCloseEditModal = useCallback(() => setEditTarget(null), []);

  const handleCloseUnlinkedPanel = useCallback(
    () => setShowUnlinked(false),
    [],
  );

  const handleCloseSetupModal = useCallback(() => setShowSetupModal(false), []);

  const handleCloseCleanupModal = useCallback(
    () => setShowCleanupModal(false),
    [],
  );

  const handleCloseAddDepartmentModal = useCallback(
    () => setShowAddDepartmentModal(false),
    [],
  );

  const handleDetailAddChild = useCallback(
    (id: number) => {
      setSelectedNode(null);
      openAddModal(id);
    },
    [openAddModal],
  );

  const handleDetailDelete = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setDeleteTarget(node);
  }, []);

  const handleDetailEdit = useCallback((node: OrgNode) => {
    setSelectedNode(null);
    setEditTarget(node);
  }, []);

  return {
    selectedNode,
    setSelectedNode,
    showAddModal,
    addModalManagerId,
    deleteTarget,
    setDeleteTarget,
    editTarget,
    setEditTarget,
    showUnlinked,
    showSetupModal,
    setShowSetupModal,
    showCleanupModal,
    setShowCleanupModal,
    showAddDepartmentModal,
    openAddModal,
    openAddDepartmentModal,
    handleShowUnlinked,
    handleSelectNode,
    handleCloseSelectedNode,
    handleCloseAddModal,
    handleCloseDeleteModal,
    handleCloseEditModal,
    handleCloseUnlinkedPanel,
    handleCloseSetupModal,
    handleCloseCleanupModal,
    handleCloseAddDepartmentModal,
    handleDetailAddChild,
    handleDetailDelete,
    handleDetailEdit,
  };
};
