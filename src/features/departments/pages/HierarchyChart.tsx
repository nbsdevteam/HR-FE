import { lazy, Suspense, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useDepartmentMetadata } from "@/shared/hooks";
import HierarchyHeader from "../components/HierarchyHeader";
import HierarchyModals from "../components/HierarchyModals";
import HierarchyToast from "../components/HierarchyToast";
import HierarchyViewModeToggle from "../components/HierarchyViewModeToggle";
import SearchCountToast from "../components/SearchCountToast";
import { useHierarchyPage } from "../hooks/useHierarchyPage";

const PositionsView = lazy(() => import("../components/PositionsView"));
const HierarchyStructureSection = lazy(() => import("../components/HierarchyStructureSection"));

const HierarchyChart = () => {
  const [, setSearchParams] = useSearchParams();
  const { metadata } = useDepartmentMetadata();
  const {
    dbEmployees,
    dbDepartments,
    dbLoading,
    positionsLoading,
    orgTree,
    deptColors,
    unlinkedEmps,
    viewMode,
    setViewMode,
    selectedNode,
    zoom,
    searchQuery,
    showSearchResults,
    containerRef,
    chartContentRef,
    searchInputRef,
    deleteTarget,
    editTarget,
    changeManagerTarget,
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
    structureTree,
    structureLoading,
    structureError,
    structureMatchedIds,
    structureDepartmentOptions,
    structureJobTitleOptions,
    departmentFilter,
    jobTitleFilter,
    hasActiveFilter,
    setDepartmentFilter,
    setJobTitleFilter,
    clearFilters,
    selectedStructureItem,
    handleSelectStructurePosition,
    handleSelectStructureEmployee,
    handleCloseStructureDetail,
    handleDeleteEmployee,
    handleEditEmployee,
    handleLinkEmployee,
    handleChangeManagerConfirm,
    handleAddDepartment,
    handleSetupHierarchy,
    handleCleanupDuplicates,
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
    handleCloseSelectedNode,
    handleCloseDeleteModal,
    handleCloseEditModal,
    handleCloseUnlinkedPanel,
    handleCloseSetupModal,
    handleCloseCleanupModal,
    handleCloseAddDepartmentModal,
    handleCloseChangeManagerModal,
    handleDetailDelete,
    handleDetailEdit,
    handleDetailChangeManager,
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

  const isPositionsView = viewMode === "positions";

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
      {isPositionsView ? (
        <Suspense fallback={null}>
          <PositionsView
            dbEmployees={dbEmployees}
            dbDepartments={dbDepartments}
            deptColors={deptColors}
            refetch={refetchHierarchyAndPositions}
          />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <HierarchyStructureSection
            tree={structureTree}
            loading={structureLoading}
            error={structureError}
            panEnabled={panEnabled}
            isDragging={isDragging}
            zoom={zoom}
            containerRef={containerRef}
            chartContentRef={chartContentRef}
            departmentOptions={structureDepartmentOptions}
            jobTitleOptions={structureJobTitleOptions}
            departmentFilter={departmentFilter}
            jobTitleFilter={jobTitleFilter}
            hasActiveFilter={hasActiveFilter}
            matchedIds={structureMatchedIds}
            selectedItem={selectedStructureItem}
            onDepartmentFilterChange={setDepartmentFilter}
            onJobTitleFilterChange={setJobTitleFilter}
            onClearFilters={clearFilters}
            onTogglePan={handleTogglePan}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            onResetZoom={handleResetZoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onSelectPosition={handleSelectStructurePosition}
            onSelectEmployee={handleSelectStructureEmployee}
            onCloseDetail={handleCloseStructureDetail}
          />
        </Suspense>
      )}

      <SearchCountToast
        searchQuery={searchQuery}
        matchCount={structureMatchedIds.size}
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
        deleteTarget={deleteTarget}
        editTarget={editTarget}
        changeManagerTarget={changeManagerTarget}
        showUnlinked={showUnlinked}
        showSetupModal={showSetupModal}
        showCleanupModal={showCleanupModal}
        showAddDepartmentModal={showAddDepartmentModal}
        showAddPositionModal={showAddPositionModal}
        posForm={posForm}
        setPosForm={setPosForm}
        positionSaving={positionSaving}
        onDeleteEmployee={handleDeleteEmployee}
        onEditEmployee={handleEditEmployee}
        onLinkEmployee={handleLinkEmployee}
        onChangeManagerConfirm={handleChangeManagerConfirm}
        onAddDepartment={handleAddDepartment}
        onSetupHierarchy={handleSetupHierarchy}
        onCleanupDuplicates={handleCleanupDuplicates}
        onCloseSelectedNode={handleCloseSelectedNode}
        onCloseDeleteModal={handleCloseDeleteModal}
        onCloseEditModal={handleCloseEditModal}
        onCloseUnlinkedPanel={handleCloseUnlinkedPanel}
        onCloseSetupModal={handleCloseSetupModal}
        onCloseCleanupModal={handleCloseCleanupModal}
        onCloseAddDepartmentModal={handleCloseAddDepartmentModal}
        onCloseChangeManagerModal={handleCloseChangeManagerModal}
        onAddPosition={handleAddPositionSubmit}
        onCloseAddPositionModal={closeAddPositionModal}
        onDetailDelete={handleDetailDelete}
        onDetailEdit={handleDetailEdit}
        onDetailChangeManager={handleDetailChangeManager}
      />
    </div>
  );
};

export default HierarchyChart;
