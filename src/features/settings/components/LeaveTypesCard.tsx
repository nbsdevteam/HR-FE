import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Calendar, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { useLeaveTypeManagement } from "../hooks/useLeaveTypeManagement";
import { useLeaveTypePermissions } from "../hooks/useLeaveTypePermissions";
import LeaveTypeList from "./LeaveTypeList";
import NewLeaveTypeForm from "./NewLeaveTypeForm";
import EditLeaveTypeModal from "./EditLeaveTypeModal";
import SettingsSectionCard from "./SettingsSectionCard";

type TLeaveTypesCardProps = {
  showToast: (message: string) => void;
};

const LeaveTypesCard = ({ showToast }: TLeaveTypesCardProps) => {
  const {
    leaveTypes,
    loading: leaveTypesLoading,
    refetch: refetchLeaveTypes,
  } = useSettingsBootstrap();
  const { canManage } = useLeaveTypePermissions();
  const {
    showNewLeaveTypeForm,
    setShowNewLeaveTypeForm,
    newLeaveType,
    updateNewLeaveType,
    createLeaveType,
    toggleLeaveTypeActive,
    deleteLeaveTypeEntry,
    updateLeaveTypeDays,
    updateLeaveTypeResetPolicy,
    editingLeaveType,
    editLeaveType,
    openEditLeaveType,
    updateEditLeaveType,
    closeEditLeaveType,
    saveEditLeaveType,
    savingEditLeaveType,
  } = useLeaveTypeManagement(refetchLeaveTypes, showToast);

  const handleToggleNewLeaveTypeForm = useCallback((): void => {
    setShowNewLeaveTypeForm(!showNewLeaveTypeForm);
  }, [setShowNewLeaveTypeForm, showNewLeaveTypeForm]);

  const handleCancelNewLeaveTypeForm = useCallback((): void => {
    setShowNewLeaveTypeForm(false);
  }, [setShowNewLeaveTypeForm]);

  const actions = canManage && (
    <button
      onClick={handleToggleNewLeaveTypeForm}
      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs transition-colors cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      {arabicSource("settings.add_type")}
    </button>
  );

  return (
    <SettingsSectionCard
      icon={Calendar}
      title={arabicSource("settings.types_of_leave")}
      description={arabicSource("settings.managing_leave_types_and_policies")}
      actions={actions}
      delay={0.08}
    >
      {canManage && showNewLeaveTypeForm && (
        <NewLeaveTypeForm
          form={newLeaveType}
          onFieldChange={updateNewLeaveType}
          onSave={createLeaveType}
          onCancel={handleCancelNewLeaveTypeForm}
        />
      )}

      <LeaveTypeList
        leaveTypes={leaveTypes}
        loading={leaveTypesLoading}
        onToggleActive={toggleLeaveTypeActive}
        onEdit={openEditLeaveType}
        onDelete={deleteLeaveTypeEntry}
        onUpdateDays={updateLeaveTypeDays}
        onUpdateResetPolicy={updateLeaveTypeResetPolicy}
      />

      <AnimatePresence>
        {editingLeaveType && (
          <EditLeaveTypeModal
            leaveType={editingLeaveType}
            form={editLeaveType}
            saving={savingEditLeaveType}
            onFieldChange={updateEditLeaveType}
            onSave={saveEditLeaveType}
            onClose={closeEditLeaveType}
          />
        )}
      </AnimatePresence>
    </SettingsSectionCard>
  );
};

export default LeaveTypesCard;
