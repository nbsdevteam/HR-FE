import { AnimatePresence } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import { Toast } from "@/shared/components";
import type { DbEmployee, DbDepartment } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { usePositionsView } from "../hooks/usePositionsView";
import UnassignedEmployeesSidebar from "./UnassignedEmployeesSidebar";
import PositionsPanel from "./PositionsPanel";
import PositionAssignmentUndoToast from "./PositionAssignmentUndoToast";
import PositionFormModal from "./PositionFormModal";
import QuickEditDeptDesignationModal from "./QuickEditDeptDesignationModal";

const PositionsView = ({
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
  const {
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
    isDragActive,
    undoEntry,
    quickEditEmployee,
    quickEditSaving,
    posSearch,
    setPosSearch,
    clearPosSearch,
    filter,
    setFilter,
    filterCounts,
    groups,
    hasPositions,
    collapsedDepartments,
    toggleDepartment,
    expandDepartment,
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
  } = usePositionsView({ dbEmployees, dbDepartments, deptColors, refetch });

  if (posLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 shrink-0">
        <GripVertical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource(
              "hierarchy.drag_the_employee_card_from_the_left_menu_and_drop_it_on_the_des",
            )}
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            {arabicSource(
              "hierarchy.the_department_and_manager_will_be_assigned_automatically_based",
            )}
          </p>
        </div>
      </div>

      {/* Both panes scroll inside this row; the page itself never does. */}
      <div className="flex-1 min-h-0 flex gap-4">
        <UnassignedEmployeesSidebar
          totalCount={unassignedEmployees.length}
          empSearch={empSearch}
          onSearchChange={setEmpSearch}
          onClearSearch={clearEmpSearch}
          filteredUnassigned={filteredUnassigned}
          deptColors={deptColors}
          onDragStateChange={handleEmployeeDragStateChange}
        />

        <PositionsPanel
          groups={groups}
          hasPositions={hasPositions}
          collapsedDepartments={collapsedDepartments}
          posSearch={posSearch}
          onPosSearchChange={setPosSearch}
          onClearPosSearch={clearPosSearch}
          filter={filter}
          onFilterChange={setFilter}
          filterCounts={filterCounts}
          busy={saving || assigning}
          isDragActive={isDragActive}
          onToggleDepartment={toggleDepartment}
          onExpandDepartment={expandDepartment}
          onDrop={handleDrop}
          onAddPosition={openAddModal}
          onDeletePosition={handleDeletePosition}
          onEditPosition={openEditModal}
          onEditEmployee={openQuickEditEmployee}
        />
      </div>

      {/* Add/Edit Position Modal */}
      <AnimatePresence>
        {(showAddPositionModal || editingPosition) && (
          <PositionFormModal
            editingPosition={editingPosition}
            posForm={posForm}
            setPosForm={setPosForm}
            dbDepartments={dbDepartments}
            onClose={closeAddEditModal}
            onConfirm={editingPosition ? handleEditPosition : handleAddPosition}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Quick department/job-title edit for an assigned employee's row */}
      <AnimatePresence>
        {quickEditEmployee && (
          <QuickEditDeptDesignationModal
            employee={quickEditEmployee}
            dbDepartments={dbDepartments}
            positions={positions}
            saving={quickEditSaving}
            onClose={closeQuickEditEmployee}
            onSave={handleQuickEditSave}
          />
        )}
      </AnimatePresence>

      {/* An assignment owns the toast slot while it can still be undone. */}
      <AnimatePresence>
        {undoEntry ? (
          <PositionAssignmentUndoToast entry={undoEntry} onUndo={undoAssignment} />
        ) : (
          toast && (
            <Toast
              message={toast}
              position="bottom-center"
              toneClassName={
                toast.startsWith(arabicSource("common.error"))
                  ? "bg-toast-error border-toast-error-border"
                  : "bg-toast-success border-toast-success-border"
              }
              textClassName={
                toast.startsWith(arabicSource("common.error"))
                  ? "text-toast-error-fg font-medium"
                  : "text-toast-success-fg font-medium"
              }
              textSize={12}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default PositionsView;
