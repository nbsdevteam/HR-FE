import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { CreateProgramForm } from "../types";

type CreateProgramModalProps = {
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
}: CreateProgramModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-foreground">{arabicSource("training.new_training_program")}</h2>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("training.address")}</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onFieldChange({ title: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            placeholder={arabicSource("training.program_title")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("training.category")}</label>
            <select
              value={form.category}
              onChange={(e) => onFieldChange({ category: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            >
              {trainingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("training.weight")}</label>
            <input
              type="text"
              value={form.weight}
              onChange={(e) => onFieldChange({ weight: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
              placeholder={`${defaultWeight}%`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("common.coach")}</label>
            <input
              type="text"
              value={form.instructor}
              onChange={(e) => onFieldChange({ instructor: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
              placeholder={arabicSource("training.name_of_coach")}
            />
          </div>

          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("common.duration_hours")}</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => onFieldChange({ duration: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
              placeholder={arabicSource("training.20_hours")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("common.start_date")}</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => onFieldChange({ start_date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("training.end_date")}</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => onFieldChange({ end_date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("common.status")}</label>
          <select
            value={form.status}
            onChange={(e) => onFieldChange({ status: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
          >
            {trainingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("training.maximum_participants")}</label>
          <input
            type="number"
            value={form.max_participants}
            onChange={(e) => onFieldChange({ max_participants: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("training.targets_each_target_in_a_line")}</label>
          <textarea
            value={form.objectives}
            onChange={(e) => onFieldChange({ objectives: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60 resize-none"
            placeholder={arabicSource("training.the_first_goal_the_second_goal_the_third_goal")}
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border/20">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {arabicSource("training.save_the_program")}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {arabicSource("common.cancel")}
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

export default CreateProgramModal;
