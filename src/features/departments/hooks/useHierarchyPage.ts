import { useState, useRef, useEffect } from "react";
import { useAddPositionForm } from "./useAddPositionForm";
import { useHierarchyCrud } from "./useHierarchyCrud";
import { useHierarchyExport } from "./useHierarchyExport";
import { useHierarchyModals } from "./useHierarchyModals";
import { useHierarchyPanZoom } from "./useHierarchyPanZoom";
import { useHierarchyTreeData } from "./useHierarchyTreeData";
import { useHierarchyView } from "./useHierarchyView";

const TOAST_TIMEOUT_MS = 3000;

/**
 * Composition root for the hierarchy page. Every concern lives in a focused
 * hook next to this one — this file only wires them together and exposes the
 * flat shape the page's components consume.
 */
export const useHierarchyPage = () => {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const treeData = useHierarchyTreeData();
  const panZoom = useHierarchyPanZoom();
  const view = useHierarchyView({
    orgTree: treeData.orgTree,
    allNodes: treeData.allNodes,
    containerRef: panZoom.containerRef,
  });
  const modals = useHierarchyModals();
  const positionForm = useAddPositionForm({
    refetchPositions: treeData.refetchPositions,
    setToast,
  });
  const {
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
  } = useHierarchyCrud(
    treeData.dbEmployees,
    treeData.dbDepartments,
    treeData.dbPositions,
    treeData.orgTree,
    treeData.refetch,
    setSaving,
    setToast,
    modals.setDeleteTarget,
    modals.setSelectedNode,
    modals.setEditTarget,
    modals.setShowSetupModal,
    modals.setShowCleanupModal,
  );
  const { chartContentRef, handlePrint, handleExportPNG } =
    useHierarchyExport();

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return {
    dbEmployees: treeData.dbEmployees,
    dbDepartments: treeData.dbDepartments,
    dbPositions: treeData.dbPositions,
    dbLoading: treeData.dbLoading,
    positionsLoading: treeData.positionsLoading,
    orgTree: treeData.orgTree,
    deptColors: treeData.deptColors,
    unlinkedEmps: treeData.unlinkedEmps,
    viewMode: view.viewMode,
    setViewMode: view.setViewMode,
    expandedMap: view.expandedMap,
    selectedNode: modals.selectedNode,
    zoom: panZoom.zoom,
    searchQuery: view.searchQuery,
    showSearchResults: view.showSearchResults,
    containerRef: panZoom.containerRef,
    chartContentRef,
    searchInputRef,
    deleteTarget: modals.deleteTarget,
    editTarget: modals.editTarget,
    showUnlinked: modals.showUnlinked,
    saving,
    showSetupModal: modals.showSetupModal,
    showCleanupModal: modals.showCleanupModal,
    showAddDepartmentModal: modals.showAddDepartmentModal,
    showAddPositionModal: positionForm.showAddPositionModal,
    positionSaving: positionForm.positionSaving,
    posForm: positionForm.posForm,
    setPosForm: positionForm.setPosForm,
    toast,
    isDragging: panZoom.isDragging,
    panEnabled: panZoom.panEnabled,
    allNodes: treeData.allNodes,
    departments: treeData.departments,
    searchResults: view.searchResults,
    searchMatchIds: view.searchMatchIds,
    highlightedIds: view.highlightedIds,
    departmentStats: treeData.departmentStats,
    toggleExpand: view.toggleExpand,
    expandAll: view.expandAll,
    collapseAll: view.collapseAll,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
    openAddDepartmentModal: modals.openAddDepartmentModal,
    openAddPositionModal: positionForm.openAddPositionModal,
    closeAddPositionModal: positionForm.closeAddPositionModal,
    handleAddPositionSubmit: positionForm.handleAddPositionSubmit,
    handleMouseDown: panZoom.handleMouseDown,
    handleMouseMove: panZoom.handleMouseMove,
    handleMouseUp: panZoom.handleMouseUp,
    handleSearchSelect: view.handleSearchSelect,
    clearSearch: view.clearSearch,
    handlePrint,
    handleExportPNG,
    handleSearchChange: view.handleSearchChange,
    handleSearchFocus: view.handleSearchFocus,
    handleShowUnlinked: modals.handleShowUnlinked,
    handleCloseSearchResults: view.handleCloseSearchResults,
    handleTogglePan: panZoom.handleTogglePan,
    handleZoomOut: panZoom.handleZoomOut,
    handleZoomIn: panZoom.handleZoomIn,
    handleResetZoom: panZoom.handleResetZoom,
    handleSelectNode: modals.handleSelectNode,
    handleCloseSelectedNode: modals.handleCloseSelectedNode,
    handleCloseDeleteModal: modals.handleCloseDeleteModal,
    handleCloseEditModal: modals.handleCloseEditModal,
    handleCloseUnlinkedPanel: modals.handleCloseUnlinkedPanel,
    handleCloseSetupModal: modals.handleCloseSetupModal,
    handleCloseCleanupModal: modals.handleCloseCleanupModal,
    handleCloseAddDepartmentModal: modals.handleCloseAddDepartmentModal,
    handleDetailDelete: modals.handleDetailDelete,
    handleDetailEdit: modals.handleDetailEdit,
    refetchHierarchyAndPositions: treeData.refetchHierarchyAndPositions,
  };
};
