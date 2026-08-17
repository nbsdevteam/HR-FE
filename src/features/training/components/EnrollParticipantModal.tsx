import { motion } from "motion/react";
import { Save, X } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { arabicSource } from "@/i18n/source";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import type { EnrollParticipantForm } from "../types";

type EnrollParticipantModalProps = {
  form: EnrollParticipantForm;
  employees: DbEmployee[];
  participantStatuses: string[];
  excludeIds: string[];
  onFieldChange: (patch: Partial<EnrollParticipantForm>) => void;
  onSave: () => void;
  onClose: () => void;
};

const EnrollParticipantModal = ({
  form,
  employees,
  participantStatuses,
  excludeIds,
  onFieldChange,
  onSave,
  onClose,
}: EnrollParticipantModalProps) => (
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
      className="bg-card border border-border/40 rounded-xl p-6 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-foreground">{arabicSource("training.register_a_new_employee")}</h2>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("common.employee_3")}</label>
          <EmployeeSelect
            employees={employees}
            labels={Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)]))}
            value={form.employee_id}
            onChange={(id) => onFieldChange({ employee_id: String(id) })}
            placeholder={arabicSource("training.select_employee")}
            excludeIds={excludeIds}
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2">{arabicSource("training.join_status")}</label>
          <select
            value={form.completion_status}
            onChange={(e) => onFieldChange({ completion_status: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
          >
            {participantStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {form.completion_status === arabicSource("common.complete") && (
          <div>
            <label className="block text-sm text-foreground mb-2">{arabicSource("training.grade")}</label>
            <input
              type="number"
              value={form.score}
              onChange={(e) => onFieldChange({ score: e.target.value })}
              min="0"
              max="100"
              className="w-full px-4 py-2 rounded-lg bg-secondary border border-border/40 text-foreground focus:outline-none focus:border-primary/60"
              placeholder="85"
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border/20">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {arabicSource("training.register")}
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

export default EnrollParticipantModal;
