import { Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button, InputField, ModalHeader, ModalOverlay, Select } from "@/shared/components";
import { fieldCls } from "../styles";
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
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title={arabicSource("training.modify_the_program")}
        onClose={onClose}
        className="flex items-center justify-between mb-5"
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

        <div className="flex gap-3 pt-3">
          <Button
            onClick={onSave}
            icon={Save}
            className="flex-1 h-11 shadow-lg shadow-primary/20"
          >
            {arabicSource("common.save_changes")}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11"
          >
            {arabicSource("common.cancel")}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default EditProgramModal;
