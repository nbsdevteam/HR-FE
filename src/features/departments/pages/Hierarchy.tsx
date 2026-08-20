import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Loader2, UserCheck } from "lucide-react";
import Toast from "@/shared/components/Toast";
import { arabicSource } from "@/i18n/source";
import AddEmployeeModal from "../components/AddEmployeeModal";
import CleanupDuplicatesModal from "../components/CleanupDuplicatesModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditEmployeeModal from "../components/EditEmployeeModal";
import DetailPanel from "../components/DetailPanel";
import HierarchyHeader from "../components/HierarchyHeader";
import HierarchyTreeSection from "../components/HierarchyTreeSection";
import HierarchyViewModeToggle from "../components/HierarchyViewModeToggle";
import SearchCountToast from "../components/SearchCountToast";
import SetupHierarchyModal from "../components/SetupHierarchyModal";
import UnlinkedPanel from "../components/UnlinkedPanel";
import PositionsView from "../components/PositionsView";
import { useHierarchyPage } from "../hooks/useHierarchyPage";

const Hierarchy = () => {
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
    handleShowSetupModal,
    handleShowCleanupModal,
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
    handleDetailAddChild,
    handleDetailDelete,
    handleDetailEdit,
    refetchHierarchyAndPositions,
  } = useHierarchyPage();

  if (dbLoading || positionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("hierarchy.loading_the_organizational_chart")}</span>
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
        onShowUnlinked={handleShowUnlinked}
        onShowSetup={handleShowSetupModal}
        onShowCleanup={handleShowCleanupModal}
        onAddEmployee={openAddModal}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        onSearchSelect={handleSearchSelect}
        onCloseSearchResults={handleCloseSearchResults}
        onClearSearch={clearSearch}
        onPrint={handlePrint}
        onExportPNG={handleExportPNG}
      />

      <HierarchyViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === "positions" ? (
        <PositionsView
          dbEmployees={dbEmployees}
          dbDepartments={dbDepartments}
          deptColors={deptColors}
          refetch={refetchHierarchyAndPositions}
        />
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

      <SearchCountToast searchQuery={searchQuery} matchCount={searchMatchIds.size} onClearSearch={clearSearch} />
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            icon={toast.startsWith(arabicSource("common.error")) ? AlertTriangle : UserCheck}
            position="bottom-center"
            toneClassName={toast.startsWith(arabicSource("common.error")) ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}
            iconBoxClassName={toast.startsWith(arabicSource("common.error")) ? "bg-red-500/20" : "bg-green-500/20"}
            iconClassName={toast.startsWith(arabicSource("common.error")) ? "w-3 h-3 text-red-400" : "w-3 h-3 text-green-400"}
            textClassName="text-foreground"
            textSize={12}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNode && !deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleCloseSelectedNode}>
            <div onClick={e => e.stopPropagation()}>
              <DetailPanel
                node={selectedNode}
                orgTree={orgTree}
                onClose={handleCloseSelectedNode}
                onAddChild={handleDetailAddChild}
                onDelete={handleDetailDelete}
                onEdit={handleDetailEdit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddEmployeeModal
            allNodes={allNodes}
            departments={departments}
            departmentColors={deptColors}
            preselectedManagerId={addModalManagerId}
            onAdd={handleAddEmployee}
            onClose={handleCloseAddModal}
            onAddDepartment={handleAddDepartment}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            node={deleteTarget}
            orgTree={orgTree}
            onDelete={handleDeleteEmployee}
            onClose={handleCloseDeleteModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editTarget && (
          <EditEmployeeModal
            node={editTarget}
            allNodes={allNodes}
            departments={departments}
            onSave={handleEditEmployee}
            onClose={handleCloseEditModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnlinked && unlinkedEmps.length > 0 && (
          <UnlinkedPanel
            employees={unlinkedEmps}
            allNodes={allNodes}
            onLink={handleLinkEmployee}
            onClose={handleCloseUnlinkedPanel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSetupModal && (
          <SetupHierarchyModal
            dbEmployees={dbEmployees}
            saving={saving}
            onClose={handleCloseSetupModal}
            onSetup={handleSetupHierarchy}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCleanupModal && (
          <CleanupDuplicatesModal
            dbEmployees={dbEmployees}
            saving={saving}
            onClose={handleCloseCleanupModal}
            onCleanup={handleCleanupDuplicates}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hierarchy;
