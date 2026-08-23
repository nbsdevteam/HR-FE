import { Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { InputField, ModalFooterActions, ModalHeader, ModalOverlay, Select } from "@/shared/components";
import { fieldCls, TRAINING_FOOTER_CANCEL_CLASS, TRAINING_FOOTER_WRAPPER_CLASS } from "../styles";
import type { DbTrainingProgram } from "@/shared/hooks";

type TEditProgramModalProps = {
  program: DbTrainingProgram;
  trainingStatuses: string[];
  onFieldChange: (patch: Partial<DbTrainingProgram>) => void;
  onSave: () => void;
  onClose: () => void;
};

const EditProgramModal = ({
  program,
  trainingStatuses,
  onFieldChange,
  onSave,
  onClose,
}: TEditProgramModalProps) => {
  const handleInstructorChange = (value: string): void => {
    onFieldChange({ instructor: value });
  };

  const handleDurationChange = (value: string): void => {
    onFieldChange({ duration: value });
  };

  const handleStatusChange = (value: string): void => {
    onFieldChange({ status: value });
  };

  const handleCompletionRateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ completion_rate: parseInt(e.target.value) || 0 });
  };

  return (
  <ModalOverlay
    onClose={onClose}
    closeOnBackdropClick={false}
    overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    contentClassName="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full"
    contentMotionProps={{
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    }}
  >
    <ModalHeader
      title={arabicSource("training.modify_the_program")}
      onClose={onClose}
    />

    <div className="space-y-4">
      <InputField
        label={arabicSource("common.coach")}
        value={program.instructor || ""}
        onChange={handleInstructorChange}
        className={fieldCls}
      />

      <InputField
        label={arabicSource("common.duration_hours")}
        value={program.duration || ""}
        onChange={handleDurationChange}
        className={fieldCls}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={arabicSource("common.status")}
          value={program.status}
          onChange={handleStatusChange}
          options={trainingStatuses}
          className={fieldCls}
        />

        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("training.completion_rate")}
          </label>
          <input
            type="number"
            value={program.completion_rate}
            onChange={handleCompletionRateChange}
            min="0"
            max="100"
            className={fieldCls}
          />
        </div>
      </div>

      <ModalFooterActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmLabel={arabicSource("common.save_changes")}
        confirmIcon={Save}
        reverseOrder
        wrapperClassName={TRAINING_FOOTER_WRAPPER_CLASS}
        cancelClassName={TRAINING_FOOTER_CANCEL_CLASS}
      />
    </div>
  </ModalOverlay>
  );
};

export default EditProgramModal;
