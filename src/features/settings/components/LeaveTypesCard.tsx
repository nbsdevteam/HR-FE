import { useCallback } from "react";
import { motion } from "motion/react";
import { Calendar, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLeaveTypes } from "@/shared/hooks";
import { cardCls } from "../styles";
import { useLeaveTypeManagement } from "../hooks/useLeaveTypeManagement";
import LeaveTypeList from "./LeaveTypeList";
import NewLeaveTypeForm from "./NewLeaveTypeForm";

type TLeaveTypesCardProps = {
  showToast: (message: string) => void;
};

const LeaveTypesCard = ({ showToast }: TLeaveTypesCardProps) => {
  const {
    types: leaveTypes,
    loading: leaveTypesLoading,
    refetch: refetchLeaveTypes,
  } = useLeaveTypes();
  const {
    showNewLeaveTypeForm,
    setShowNewLeaveTypeForm,
    newLeaveType,
    updateNewLeaveType,
    createLeaveType,
    toggleLeaveTypeActive,
    deleteLeaveTypeEntry,
  } = useLeaveTypeManagement(refetchLeaveTypes, showToast);

  const handleToggleNewLeaveTypeForm = (): void => {
    setShowNewLeaveTypeForm(!showNewLeaveTypeForm);
  };

  const handleCancelNewLeaveTypeForm = useCallback((): void => {
    setShowNewLeaveTypeForm(false);
  }, [setShowNewLeaveTypeForm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={cardCls}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">
              {arabicSource("settings.types_of_leave")}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {arabicSource("settings.managing_leave_types_and_policies")}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleNewLeaveTypeForm}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {arabicSource("settings.add_type")}
        </button>
      </div>

      {showNewLeaveTypeForm && (
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
        onDelete={deleteLeaveTypeEntry}
      />
    </motion.div>
  );
};

export default LeaveTypesCard;
