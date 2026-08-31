import { useCallback } from "react";
import { Clock, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useDepartmentShiftAssignments } from "../hooks/useDepartmentShiftAssignments";
import { useShiftManagement } from "../hooks/useShiftManagement";
import NewShiftForm from "./NewShiftForm";
import ShiftAssignerSection from "./ShiftAssignerSection";
import ShiftDepartmentAssignments from "./ShiftDepartmentAssignments";
import ShiftList from "./ShiftList";
import SettingsSectionCard from "./SettingsSectionCard";

type TShiftsScheduleCardProps = {
  showToast: (message: string) => void;
};

const ShiftsScheduleCard = ({ showToast }: TShiftsScheduleCardProps) => {
  const {
    departments,
    shifts,
    loading,
    refetch: refetchShifts,
  } = useSettingsBootstrap();
  const deptLoading = loading;
  const shiftsLoading = loading;
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

  const actions = !showNewShiftForm && (
    <button
      onClick={handleShowNewShiftForm}
      className="flex items-center gap-2 px-4 py-2 bg-primary cursor-pointer hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>{arabicSource("settings.new_shift_added")}</span>
    </button>
  );

  return (
    <SettingsSectionCard
      icon={Clock}
      title={arabicSource("settings.time_and_shift_schedules")}
      description={arabicSource(
        "settings.managing_work_times_and_shifts_application_priority_employee_dep",
      )}
      actions={actions}
      delay={0}
    >
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
    </SettingsSectionCard>
  );
};

export default ShiftsScheduleCard;
