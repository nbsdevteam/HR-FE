import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { NewLeaveTypeForm as NewLeaveTypeFormState } from "../types";
import { useLeaveTypeFormValidation } from "../hooks/useLeaveTypeFormValidation";
import LeaveTypeFormFields from "./LeaveTypeFormFields";
import { CONTAINER_CLASS } from "../styles";
import { EXPAND_MOTION } from "../constants/settings";

type TNewLeaveTypeFormProps = {
  form: NewLeaveTypeFormState;
  onFieldChange: (patch: Partial<NewLeaveTypeFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Basic fields up front, everything else behind "Advanced options" (backend
 * hand-off "Leave Type Settings — Add Leave Type form refactor"). Bespoke
 * tree instead of the generic `NewTypeForm` — the conditional-field logic
 * here (accrual/carryover/encashment sub-fields) isn't something the flat
 * `TypeFormRowConfig` system can express.
 */
const NewLeaveTypeForm = ({
  form,
  onFieldChange,
  onSave,
  onCancel,
}: TNewLeaveTypeFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { errors, isValid, hasAdvancedError } = useLeaveTypeFormValidation(form);

  const handleToggleAdvanced = useCallback((): void => {
    setShowAdvanced((prev) => !prev);
  }, []);

  // A validation error on an Advanced-only field (encashment %, days-per-request
  // range) means Save is disabled for a reason the user can't see while the
  // section is collapsed — auto-expand so it's never a mystery.
  useEffect(() => {
    if (hasAdvancedError) setShowAdvanced(true);
  }, [hasAdvancedError]);

  return (
    <motion.div {...EXPAND_MOTION} className={CONTAINER_CLASS}>
      <LeaveTypeFormFields
        form={form}
        errors={errors}
        onFieldChange={onFieldChange}
        showAdvanced={showAdvanced}
        onToggleAdvanced={handleToggleAdvanced}
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          icon={Save}
          onClick={onSave}
          disabled={!isValid}
          className="cursor-pointer"
        >
          {arabicSource("common.save")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="cursor-pointer"
        >
          {arabicSource("common.cancel")}
        </Button>
      </div>
    </motion.div>
  );
};

export default NewLeaveTypeForm;
