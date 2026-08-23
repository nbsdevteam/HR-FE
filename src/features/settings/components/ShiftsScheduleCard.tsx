import { useCallback } from "react";
import { motion } from "motion/react";
import { Clock, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useShifts, type DbDepartment } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useDepartmentShiftAssignments } from "../hooks/useDepartmentShiftAssignments";
import { useShiftManagement } from "../hooks/useShiftManagement";
import NewShiftForm from "./NewShiftForm";
import ShiftAssignerSection from "./ShiftAssignerSection";
import ShiftDepartmentAssignments from "./ShiftDepartmentAssignments";
import ShiftList from "./ShiftList";

type TShiftsScheduleCardProps = {
  departments: DbDepartment[];
  deptLoading: boolean;
  showToast: (message: string) => void;
};

const ShiftsScheduleCard = ({
  departments,
  deptLoading,
  showToast,
}: TShiftsScheduleCardProps) => {
  const {
    shifts,
    loading: shiftsLoading,
    refetch: refetchShifts,
  } = useShifts();
  const {
    expandedShift,
    toggleExpandedShift,
    editingShift,
    initEditShift,
    cancelEditShift,
    updateEditingShiftForm,
    updateEditingShiftDay,
    showNewShiftForm,
    setShowNewShiftForm,
    newShiftForm,
    updateNewShiftForm,
    updateNewShiftDay,
    saveShift,
    createShift,
    deleteShift,
    setAsDefault,
  } = useShiftManagement(refetchShifts, showToast);
  const {
    deptShiftAssignments,
    setDeptShift,
    savingDepts,
    saveDeptAssignments,
  } = useDepartmentShiftAssignments(departments, showToast);

  const handleShowNewShiftForm = (): void => {
    setShowNewShiftForm(true);
  };

  const handleCreateShift = useCallback((): void => {
    createShift(newShiftForm);
  }, [createShift, newShiftForm]);

  const handleCancelNewShift = useCallback((): void => {
    setShowNewShiftForm(false);
  }, [setShowNewShiftForm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className={`${cardCls} lg:col-span-2`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">
              {arabicSource("settings.time_and_shift_schedules")}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {arabicSource(
                "settings.managing_work_times_and_shifts_application_priority_employee_dep",
              )}
            </p>
          </div>
        </div>
        {!showNewShiftForm && (
          <button
            onClick={handleShowNewShiftForm}
            className="flex items-center gap-2 px-4 py-2 bg-primary cursor-pointer hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{arabicSource("settings.new_shift_added")}</span>
          </button>
        )}
      </div>

      {showNewShiftForm && (
        <NewShiftForm
          form={newShiftForm}
          onFieldChange={updateNewShiftForm}
          onDayChange={updateNewShiftDay}
          onSave={handleCreateShift}
          onCancel={handleCancelNewShift}
        />
      )}

      <div className="space-y-2 mb-4">
        <ShiftList
          shifts={shifts}
          loading={shiftsLoading}
          expandedShift={expandedShift}
          editingForm={editingShift}
          onToggleExpand={toggleExpandedShift}
          onInitEdit={initEditShift}
          onDelete={deleteShift}
          onSetDefault={setAsDefault}
          onCancelEdit={cancelEditShift}
          onSaveEdit={saveShift}
          onEditFieldChange={updateEditingShiftForm}
          onEditDayChange={updateEditingShiftDay}
        />
      </div>

      <ShiftDepartmentAssignments
        departments={departments}
        deptLoading={deptLoading}
        shifts={shifts}
        assignments={deptShiftAssignments}
        saving={savingDepts}
        onAssignmentChange={setDeptShift}
        onSave={saveDeptAssignments}
      />

      <ShiftAssignerSection />
    </motion.div>
  );
};

export default ShiftsScheduleCard;
