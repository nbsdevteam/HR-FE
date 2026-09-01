import { useState, useRef, useCallback, useEffect } from "react";
import { useAddPositionForm } from "./useAddPositionForm";
import { useHierarchyCrud } from "./useHierarchyCrud";
import { useHierarchyExport } from "./useHierarchyExport";
import { useHierarchyModals } from "./useHierarchyModals";
import { useHierarchyPanZoom } from "./useHierarchyPanZoom";
import { useHierarchyTreeData } from "./useHierarchyTreeData";
import { useHierarchyView } from "./useHierarchyView";
import { useStructureView } from "./useStructureView";

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
  const view = useHierarchyView();
  const structureView = useStructureView({ containerRef: panZoom.containerRef });
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

  const handleChangeManagerConfirm = useCallback(
    async (empDbId: string, managerDbId: string) => {
      await handleLinkEmployee(empDbId, managerDbId);
      modals.setChangeManagerTarget(null);
    },
    [handleLinkEmployee, modals.setChangeManagerTarget],
  );

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
    zoom: panZoom.zoom,
    containerRef: panZoom.containerRef,
    chartContentRef,
    searchInputRef,
    deleteTarget: modals.deleteTarget,
    editTarget: modals.editTarget,
    changeManagerTarget: modals.changeManagerTarget,
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
    selectedNode: modals.selectedNode,
    // Structure (level-wise graph) view state — the tab's chart content.
    structureTree: structureView.structureTree,
    structureLoading: structureView.structureLoading,
    structureError: structureView.structureError,
    searchQuery: structureView.structureSearchQuery,
    showSearchResults: structureView.structureShowSearchResults,
    searchResults: structureView.structureSearchResults,
    structureMatchedIds: structureView.structureMatchedIds,
    structureDepartmentOptions: structureView.structureDepartmentOptions,
    structureJobTitleOptions: structureView.structureJobTitleOptions,
    departmentFilter: structureView.structureDepartmentFilter,
    jobTitleFilter: structureView.structureJobTitleFilter,
    hasActiveFilter: structureView.structureHasActiveFilter,
    setDepartmentFilter: structureView.setStructureDepartmentFilter,
    setJobTitleFilter: structureView.setStructureJobTitleFilter,
    clearFilters: structureView.clearStructureFilters,
    selectedStructureItem: structureView.selectedStructureItem,
    handleSelectStructurePosition: structureView.handleSelectStructurePosition,
    handleSelectStructureEmployee: structureView.handleSelectStructureEmployee,
    handleCloseStructureDetail: structureView.handleCloseStructureDetail,
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
    handleSearchSelect: structureView.handleStructureSearchSelect,
    clearSearch: structureView.clearStructureSearch,
    handlePrint,
    handleExportPNG,
    handleSearchChange: structureView.handleStructureSearchChange,
    handleSearchFocus: structureView.handleStructureSearchFocus,
    handleShowUnlinked: modals.handleShowUnlinked,
    handleCloseSearchResults: structureView.handleCloseStructureSearchResults,
    handleTogglePan: panZoom.handleTogglePan,
    handleZoomOut: panZoom.handleZoomOut,
    handleZoomIn: panZoom.handleZoomIn,
    handleResetZoom: panZoom.handleResetZoom,
    handleCloseSelectedNode: modals.handleCloseSelectedNode,
    handleCloseDeleteModal: modals.handleCloseDeleteModal,
    handleCloseEditModal: modals.handleCloseEditModal,
    handleCloseUnlinkedPanel: modals.handleCloseUnlinkedPanel,
    handleCloseSetupModal: modals.handleCloseSetupModal,
    handleCloseCleanupModal: modals.handleCloseCleanupModal,
    handleCloseAddDepartmentModal: modals.handleCloseAddDepartmentModal,
    handleCloseChangeManagerModal: modals.handleCloseChangeManagerModal,
    handleDetailDelete: modals.handleDetailDelete,
    handleDetailEdit: modals.handleDetailEdit,
    handleDetailChangeManager: modals.handleDetailChangeManager,
    handleChangeManagerConfirm,
    refetchHierarchyAndPositions: treeData.refetchHierarchyAndPositions,
  };
};
