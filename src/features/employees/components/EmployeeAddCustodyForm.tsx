import { motion } from "motion/react";
import { Check } from "lucide-react";
import { arabicSource } from "@/i18n/source";

const formInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string };

type EmployeeAddCustodyFormProps = {
  newCustody: NewCustody;
  onChange: (patch: Partial<NewCustody>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const EmployeeAddCustodyForm = ({ newCustody, onChange, onConfirm, onCancel }: EmployeeAddCustodyFormProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="overflow-hidden"
  >
    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
      <p className="text-primary" style={{ fontSize: 13 }}>{arabicSource("shared.add_a_new_liability")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.purpose_name")}</label>
          <input
            value={newCustody.item}
            onChange={(e) => onChange({ item: e.target.value })}
            placeholder={arabicSource("shared.example_portable_calculator")}
            className={formInputClass}
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("common.description")}</label>
          <input
            value={newCustody.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={arabicSource("shared.example_dell_latitude_5540")}
            className={formInputClass}
            style={{ fontSize: 13 }}
          />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("shared.date_of_receipt")}</label>
          <input
            type="date"
            value={newCustody.dateReceived}
            onChange={(e) => onChange({ dateReceived: e.target.value })}
            className={formInputClass}
            style={{ fontSize: 13 }}
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{arabicSource("common.serial_number")}</label>
          <input
            value={newCustody.serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value })}
            placeholder={arabicSource("shared.optional")}
            className={formInputClass}
            style={{ fontSize: 13 }}
            dir="ltr"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onConfirm}
          disabled={!newCustody.item.trim()}
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

export default EmployeeAddCustodyForm;
