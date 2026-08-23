import { Save } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import {
  InputField,
  ModalFooterActions,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@/shared/components";
import {
  fieldCls,
  TRAINING_FOOTER_CANCEL_CLASS,
  TRAINING_FOOTER_WRAPPER_CLASS,
} from "../styles";
import type { CreateProgramForm } from "../types";

type TCreateProgramModalProps = {
  form: CreateProgramForm;
  trainingCategories: string[];
  trainingStatuses: string[];
  defaultWeight: number;
  onFieldChange: (patch: Partial<CreateProgramForm>) => void;
  onSave: () => void;
  onClose: () => void;
};

const CreateProgramModal = ({
  form,
  trainingCategories,
  trainingStatuses,
  defaultWeight,
  onFieldChange,
  onSave,
  onClose,
}: TCreateProgramModalProps) => {
  const handleTitleChange = (value: string): void => {
    onFieldChange({ title: value });
  };

  const handleCategoryChange = (value: string): void => {
    onFieldChange({ category: value });
  };

  const handleWeightChange = (value: string): void => {
    onFieldChange({ weight: value });
  };

  const handleInstructorChange = (value: string): void => {
    onFieldChange({ instructor: value });
  };

  const handleDurationChange = (value: string): void => {
    onFieldChange({ duration: value });
  };

  const handleStartDateChange = (value: string): void => {
    onFieldChange({ start_date: value });
  };

  const handleEndDateChange = (value: string): void => {
    onFieldChange({ end_date: value });
  };

  const handleStatusChange = (value: string): void => {
    onFieldChange({ status: value });
  };

  const handleMaxParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ max_participants: e.target.value });
  };

  const handleObjectivesChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFieldChange({ objectives: e.target.value });
  };

  return (
  <ModalOverlay
    onClose={onClose}
    closeOnBackdropClick={false}
    overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    contentClassName="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    contentMotionProps={{
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    }}
  >
    <ModalHeader
      title={arabicSource("training.new_training_program")}
      onClose={onClose}
    />

    <div className="space-y-4">
      <InputField
        label={arabicSource("training.address")}
        value={form.title}
        onChange={handleTitleChange}
        className={fieldCls}
        placeholder={arabicSource("training.program_title")}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={arabicSource("training.category")}
          value={form.category}
          onChange={handleCategoryChange}
          options={trainingCategories}
          className={fieldCls}
        />

        <InputField
          label={arabicSource("training.weight")}
          value={form.weight}
          onChange={handleWeightChange}
          className={fieldCls}
          placeholder={`${defaultWeight}%`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={arabicSource("common.coach")}
          value={form.instructor}
          onChange={handleInstructorChange}
          className={fieldCls}
          placeholder={arabicSource("training.name_of_coach")}
        />

        <InputField
          label={arabicSource("common.duration_hours")}
          value={form.duration}
          onChange={handleDurationChange}
          className={fieldCls}
          placeholder={arabicSource("training.20_hours")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={arabicSource("common.start_date")}
          type="date"
          value={form.start_date}
          onChange={handleStartDateChange}
          className={fieldCls}
        />

        <InputField
          label={arabicSource("training.end_date")}
          type="date"
          value={form.end_date}
          onChange={handleEndDateChange}
          className={fieldCls}
        />
      </div>

      <Select
        label={arabicSource("common.status")}
        value={form.status}
        onChange={handleStatusChange}
        options={trainingStatuses}
        className={fieldCls}
      />

      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("training.maximum_participants")}
        </label>
        <input
          type="number"
          value={form.max_participants}
          onChange={handleMaxParticipantsChange}
          className={fieldCls}
          placeholder="30"
          min={1}
        />
      </div>

      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("training.targets_each_target_in_a_line")}
        </label>
        <textarea
          value={form.objectives}
          onChange={handleObjectivesChange}
          rows={4}
          className={`${fieldCls} resize-none`}
          placeholder={arabicSource(
            "training.the_first_goal_the_second_goal_the_third_goal",
          )}
        />
      </div>

      <ModalFooterActions
        onCancel={onClose}
        onConfirm={onSave}
        confirmLabel={arabicSource("training.save_the_program")}
        confirmIcon={Save}
        reverseOrder
        wrapperClassName={TRAINING_FOOTER_WRAPPER_CLASS}
        cancelClassName={TRAINING_FOOTER_CANCEL_CLASS}
      />
    </div>
  </ModalOverlay>
  );
};

export default CreateProgramModal;
