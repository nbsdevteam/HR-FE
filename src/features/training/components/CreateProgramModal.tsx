import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import { fieldCls } from "../styles";
import type { CreateProgramForm } from "../types";
import TrainingModalFooterActions from "./TrainingModalFooterActions";
import TrainingModalHeader from "./TrainingModalHeader";
import TrainingSelectField from "./TrainingSelectField";

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
}: TCreateProgramModalProps) => (
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
    <TrainingModalHeader
      title={arabicSource("training.new_training_program")}
      onClose={onClose}
    />

    <div className="space-y-4">
      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("training.address")}
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onFieldChange({ title: e.target.value })}
          className={fieldCls}
          placeholder={arabicSource("training.program_title")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TrainingSelectField
          label={arabicSource("training.category")}
          value={form.category}
          onChange={(value) => onFieldChange({ category: value })}
          options={trainingCategories}
        />

        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("training.weight")}
          </label>
          <input
            type="text"
            value={form.weight}
            onChange={(e) => onFieldChange({ weight: e.target.value })}
            className={fieldCls}
            placeholder={`${defaultWeight}%`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("common.coach")}
          </label>
          <input
            type="text"
            value={form.instructor}
            onChange={(e) => onFieldChange({ instructor: e.target.value })}
            className={fieldCls}
            placeholder={arabicSource("training.name_of_coach")}
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("common.duration_hours")}
          </label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => onFieldChange({ duration: e.target.value })}
            className={fieldCls}
            placeholder={arabicSource("training.20_hours")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("common.start_date")}
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => onFieldChange({ start_date: e.target.value })}
            className={fieldCls}
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("training.end_date")}
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => onFieldChange({ end_date: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      <TrainingSelectField
        label={arabicSource("common.status")}
        value={form.status}
        onChange={(value) => onFieldChange({ status: value })}
        options={trainingStatuses}
      />

      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("training.maximum_participants")}
        </label>
        <input
          type="number"
          value={form.max_participants}
          onChange={(e) => onFieldChange({ max_participants: e.target.value })}
          className={fieldCls}
          placeholder="30"
        />
      </div>

      <div>
        <label className="block text-sm text-foreground mb-2">
          {arabicSource("training.targets_each_target_in_a_line")}
        </label>
        <textarea
          value={form.objectives}
          onChange={(e) => onFieldChange({ objectives: e.target.value })}
          rows={4}
          className={`${fieldCls} resize-none`}
          placeholder={arabicSource(
            "training.the_first_goal_the_second_goal_the_third_goal",
          )}
        />
      </div>

      <TrainingModalFooterActions
        onSave={onSave}
        onClose={onClose}
        saveLabel={arabicSource("training.save_the_program")}
      />
    </div>
  </ModalOverlay>
);

export default CreateProgramModal;
