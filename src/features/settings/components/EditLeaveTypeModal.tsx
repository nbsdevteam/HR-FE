import { useState, useCallback, useEffect } from "react";
import { Edit2, Save } from "lucide-react";
import { Modal, ModalFooterActions, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { DbLeaveType } from "@/shared/hooks";
import type { NewLeaveTypeForm } from "../types";
import { useLeaveTypeFormValidation } from "../hooks/useLeaveTypeFormValidation";
import LeaveTypeFormFields from "./LeaveTypeFormFields";

type TEditLeaveTypeModalProps = {
  leaveType: DbLeaveType;
  form: NewLeaveTypeForm;
  saving: boolean;
  onFieldChange: (patch: Partial<NewLeaveTypeForm>) => void;
  onSave: () => void;
  onClose: () => void;
};

/**
 * A system type (Annual/Sick) is fully editable here — only its Delete and
 * archive actions are refused, both enforced (and toasted) elsewhere. The
 * badge is informational, not a restriction on this form.
 */
const EditLeaveTypeModal = ({
  leaveType,
  form,
  saving,
  onFieldChange,
  onSave,
  onClose,
}: TEditLeaveTypeModalProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { errors, isValid, hasAdvancedError } = useLeaveTypeFormValidation(form);
  const { primary } = useLocalizedName(leaveType.name_ar, leaveType.name_en);

  const handleToggleAdvanced = useCallback((): void => {
    setShowAdvanced((prev) => !prev);
  }, []);

  useEffect(() => {
    if (hasAdvancedError) setShowAdvanced(true);
  }, [hasAdvancedError]);

  const subtitle = (
    <span className="flex items-center gap-2" data-i18n-ignore>
      {primary}
      {leaveType.is_system && (
        <StatusBadge colorClassName="bg-primary/10 border-primary/30 text-primary" fontSize={10}>
          {arabicSource("settings.system_type_badge")}
        </StatusBadge>
      )}
    </span>
  );

  return (
    <Modal
      onClose={onClose}
      icon={Edit2}
      title={arabicSource("settings.edit_leave_type")}
      subtitle={subtitle}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onSave}
          confirmLabel={arabicSource("common.save")}
          confirmIcon={Save}
          disabled={!isValid || saving}
          cancelDisabled={saving}
          loading={saving}
        />
      }
    >
      <LeaveTypeFormFields
        form={form}
        errors={errors}
        onFieldChange={onFieldChange}
        showAdvanced={showAdvanced}
        onToggleAdvanced={handleToggleAdvanced}
        currentMonthlyAccrual={leaveType.monthly_accrual}
      />
    </Modal>
  );
};

export default EditLeaveTypeModal;
