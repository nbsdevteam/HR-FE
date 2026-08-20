import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import { fieldCls } from "../styles";
import type { DbTrainingProgram } from "@/shared/hooks";
import TrainingModalFooterActions from "./TrainingModalFooterActions";
import TrainingModalHeader from "./TrainingModalHeader";
import TrainingSelectField from "./TrainingSelectField";

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
}: TEditProgramModalProps) => (
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
    <TrainingModalHeader
      title={arabicSource("training.modify_the_program")}
      onClose={onClose}
    />

    <div className="space-y-4">
      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("common.coach")}
        </label>
        <input
          type="text"
          value={program.instructor || ""}
          onChange={(e) => onFieldChange({ instructor: e.target.value })}
          className={fieldCls}
        />
      </div>

      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("common.duration_hours")}
        </label>
        <input
          type="text"
          value={program.duration || ""}
          onChange={(e) => onFieldChange({ duration: e.target.value })}
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TrainingSelectField
          label={arabicSource("common.status")}
          value={program.status}
          onChange={(value) => onFieldChange({ status: value })}
          options={trainingStatuses}
        />

        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("training.completion_rate")}
          </label>
          <input
            type="number"
            value={program.completion_rate}
            onChange={(e) =>
              onFieldChange({ completion_rate: parseInt(e.target.value) || 0 })
            }
            min="0"
            max="100"
            className={fieldCls}
          />
        </div>
      </div>

      <TrainingModalFooterActions
        onSave={onSave}
        onClose={onClose}
        saveLabel={arabicSource("common.save_changes")}
      />
    </div>
  </ModalOverlay>
);

export default EditProgramModal;
