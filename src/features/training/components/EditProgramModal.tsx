import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbTrainingProgram } from "@/shared/hooks";

type EditProgramModalProps = {
  program: DbTrainingProgram;
  trainingStatuses: string[];
  onFieldChange: (patch: Partial<DbTrainingProgram>) => void;
  onSave: () => void;
  onClose: () => void;
};

const EditProgramModal = ({ program, trainingStatuses, onFieldChange, onSave, onClose }: EditProgramModalProps) => (
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
      className="bg-card border border-border/40 rounded-xl p-6 max-w-2xl w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-foreground">{arabicSource("training.modify_the_program")}</h2>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("common.coach")}</label>
          <input
            type="text"
            value={program.instructor || ""}
            onChange={(e) => onFieldChange({ instructor: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("common.duration_hours")}</label>
          <input
            type="text"
            value={program.duration || ""}
            onChange={(e) => onFieldChange({ duration: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("common.status")}</label>
            <select
              value={program.status}
              onChange={(e) => onFieldChange({ status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            >
              {trainingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("training.completion_rate")}</label>
            <input
              type="number"
              value={program.completion_rate}
              onChange={(e) => onFieldChange({ completion_rate: parseInt(e.target.value) || 0 })}
              min="0"
              max="100"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border/20">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {arabicSource("common.save_changes")}
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

export default EditProgramModal;
