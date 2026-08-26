import { lazy, Suspense, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useDepartmentMetadata } from "@/shared/hooks";
import HierarchyHeader from "../components/HierarchyHeader";
import HierarchyModals from "../components/HierarchyModals";
import HierarchyToast from "../components/HierarchyToast";
import HierarchyTreeSection from "../components/HierarchyTreeSection";
import HierarchyViewModeToggle from "../components/HierarchyViewModeToggle";
import SearchCountToast from "../components/SearchCountToast";
import { useHierarchyPage } from "../hooks/useHierarchyPage";

const PositionsView = lazy(() => import("../components/PositionsView"));

const HierarchyChart = () => {
  const [, setSearchParams] = useSearchParams();
  const { metadata } = useDepartmentMetadata();
  const {
    dbEmployees,
    dbDepartments,
    dbPositions,
    dbLoading,
    positionsLoading,
    orgTree,
    deptColors,
    unlinkedEmps,
    viewMode,
    setViewMode,
    expandedMap,
    selectedNode,
    zoom,
    searchQuery,
    showSearchResults,
    containerRef,
    chartContentRef,
    searchInputRef,
    showAddModal,
    addModalManagerId,
    deleteTarget,
    editTarget,
    showUnlinked,
    saving,
    showSetupModal,
    showCleanupModal,
    showAddDepartmentModal,
    showAddPositionModal,
    positionSaving,
    posForm,
    setPosForm,
    toast,
    isDragging,
    panEnabled,
    allNodes,
    departments,
    searchResults,
    searchMatchIds,
    highlightedIds,
    departmentStats,
    toggleExpand,
    expandAll,
    collapseAll,
    handleAddEmployee,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
    openAddModal,
    openAddDepartmentModal,
    openAddPositionModal,
    closeAddPositionModal,
    handleAddPositionSubmit,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSearchSelect,
    clearSearch,
    handlePrint,
    handleExportPNG,
    handleSearchChange,
    handleSearchFocus,
    handleShowUnlinked,
    handleCloseSearchResults,
    handleTogglePan,
    handleZoomOut,
    handleZoomIn,
    handleResetZoom,
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
    refetchHierarchyAndPositions,
  } = useHierarchyPage();

  const handleOpenManagement = useCallback((): void => {
    setSearchParams({ tab: "manage" });
  }, [setSearchParams]);

  if (dbLoading || positionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">
          {arabicSource("hierarchy.loading_the_organizational_chart")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HierarchyHeader
        unlinkedCount={unlinkedEmps.length}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        showSearchResults={showSearchResults}
        searchResults={searchResults}
        canManage={metadata?.canManage}
        onOpenManagement={handleOpenManagement}
        onShowUnlinked={handleShowUnlinked}
        onAddEmployee={openAddModal}
        onAddDepartment={openAddDepartmentModal}
        onAddPosition={openAddPositionModal}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        onSearchSelect={handleSearchSelect}
        onCloseSearchResults={handleCloseSearchResults}
        onClearSearch={clearSearch}
        onPrint={handlePrint}
        onExportPNG={handleExportPNG}
      />
      <HierarchyViewModeToggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {viewMode === "positions" ? (
        <Suspense fallback={null}>
          <PositionsView
            dbEmployees={dbEmployees}
            dbDepartments={dbDepartments}
            deptColors={deptColors}
            refetch={refetchHierarchyAndPositions}
          />
        </Suspense>
      ) : (
        <HierarchyTreeSection
          dbEmployees={dbEmployees}
          dbPositions={dbPositions}
          departmentStats={departmentStats}
          deptColors={deptColors}
          saving={saving}
          panEnabled={panEnabled}
          isDragging={isDragging}
          zoom={zoom}
          orgTree={orgTree}
          expandedMap={expandedMap}
          selectedNodeId={selectedNode?.id ?? null}
          highlightedIds={highlightedIds}
          searchMatchIds={searchMatchIds}
          containerRef={containerRef}
          chartContentRef={chartContentRef}
          onTogglePan={handleTogglePan}
          onZoomOut={handleZoomOut}
          onZoomIn={handleZoomIn}
          onResetZoom={handleResetZoom}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onToggleExpand={toggleExpand}
          onSelectNode={handleSelectNode}
        />
      )}

      <SearchCountToast
        searchQuery={searchQuery}
        matchCount={searchMatchIds.size}
        onClearSearch={clearSearch}
      />
      <HierarchyToast message={toast} />
      <HierarchyModals
        dbEmployees={dbEmployees}
        dbDepartments={dbDepartments}
        orgTree={orgTree}
        allNodes={allNodes}
        departments={departments}
        deptColors={deptColors}
        unlinkedEmps={unlinkedEmps}
        saving={saving}
        selectedNode={selectedNode}
        showAddModal={showAddModal}
        addModalManagerId={addModalManagerId}
        deleteTarget={deleteTarget}
        editTarget={editTarget}
        showUnlinked={showUnlinked}
        showSetupModal={showSetupModal}
        showCleanupModal={showCleanupModal}
        showAddDepartmentModal={showAddDepartmentModal}
        showAddPositionModal={showAddPositionModal}
        posForm={posForm}
        setPosForm={setPosForm}
        positionSaving={positionSaving}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onEditEmployee={handleEditEmployee}
        onLinkEmployee={handleLinkEmployee}
        onAddDepartment={handleAddDepartment}
        onSetupHierarchy={handleSetupHierarchy}
        onCleanupDuplicates={handleCleanupDuplicates}
        onCloseSelectedNode={handleCloseSelectedNode}
        onCloseAddModal={handleCloseAddModal}
        onCloseDeleteModal={handleCloseDeleteModal}
        onCloseEditModal={handleCloseEditModal}
        onCloseUnlinkedPanel={handleCloseUnlinkedPanel}
        onCloseSetupModal={handleCloseSetupModal}
        onCloseCleanupModal={handleCloseCleanupModal}
        onCloseAddDepartmentModal={handleCloseAddDepartmentModal}
        onAddPosition={handleAddPositionSubmit}
        onCloseAddPositionModal={closeAddPositionModal}
        onDetailAddChild={handleDetailAddChild}
        onDetailDelete={handleDetailDelete}
        onDetailEdit={handleDetailEdit}
      />
    </div>
  );
};

export default HierarchyChart;
