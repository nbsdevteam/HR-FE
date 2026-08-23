import { AnimatePresence } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import Toast from "@/shared/components/Toast";
import type { DbEmployee, DbDepartment } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { usePositionsView } from "../hooks/usePositionsView";
import UnassignedEmployeesSidebar from "./UnassignedEmployeesSidebar";
import PositionTreePanel from "./PositionTreePanel";
import PositionFormModal from "./PositionFormModal";

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
    showAddPositionModal,
    editingPosition,
    expandedPositions,
    toast,
    saving,
    posForm,
    setPosForm,
    posLoading,
    positionTree,
    unassignedEmployees,
    filteredUnassigned,
    togglePositionExpand,
    handleDrop,
    handleAddPosition,
    handleEditPosition,
    handleDeletePosition,
    closeAddEditModal,
    openAddModal,
    openEditModal,
  } = usePositionsView({ dbEmployees, dbDepartments, refetch });

  if (posLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">
          {arabicSource("common.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
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

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        <UnassignedEmployeesSidebar
          totalCount={unassignedEmployees.length}
          empSearch={empSearch}
          onSearchChange={setEmpSearch}
          filteredUnassigned={filteredUnassigned}
          deptColors={deptColors}
        />

        <PositionTreePanel
          positionTree={positionTree}
          dbDepartments={dbDepartments}
          deptColors={deptColors}
          saving={saving}
          onDrop={handleDrop}
          onAddPosition={openAddModal}
          onDeletePosition={handleDeletePosition}
          onEditPosition={openEditModal}
          expandedPositions={expandedPositions}
          togglePositionExpand={togglePositionExpand}
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
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            position="bottom-center"
            toneClassName={
              toast.startsWith(arabicSource("common.error"))
                ? "bg-card border-red-500/40"
                : "bg-card border-green-500/40"
            }
            textClassName="text-foreground"
            textSize={12}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PositionsView;
