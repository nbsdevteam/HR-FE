import { motion } from "motion/react";
import { Check } from "lucide-react";
import { arabicSource } from "@/i18n/source";

const formInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

type NewAttachment = { name: string; type: string };

type EmployeeAddAttachmentFormProps = {
  newAttachment: NewAttachment;
  onChange: (patch: Partial<NewAttachment>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const EmployeeAddAttachmentForm = ({ newAttachment, onChange, onConfirm, onCancel }: EmployeeAddAttachmentFormProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="overflow-hidden"
  >
    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
      <p className="text-primary" style={{ fontSize: 13 }}>{arabicSource("shared.add_a_new_attachment")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.document_name")}</label>
          <input
            value={newAttachment.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={arabicSource("shared.example_graduation_certificate")}
            className={formInputClass}
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.file_type")}</label>
          <select
            value={newAttachment.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className={formInputClass}
            style={{ fontSize: 13 }}
          >
            <option value="PDF">PDF</option>
            <option value={arabicSource("common.image")}>{arabicSource("common.image")}</option>
            <option value="Word">Word</option>
            <option value="Excel">Excel</option>
            <option value={arabicSource("common.other")}>{arabicSource("shared.i_see")}</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onConfirm}
          disabled={!newAttachment.name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: 12 }}
        >
          <Check className="w-3.5 h-3.5" />
          {arabicSource("common.confirm")}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          {arabicSource("common.cancel")}
        </button>
      </div>
    </div>
  </motion.div>
);

export default EmployeeAddAttachmentForm;
