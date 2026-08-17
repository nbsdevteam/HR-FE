import { motion } from "motion/react";
import { Edit, Loader2, Save, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type EmployeeDetailHeaderProps = {
  isEditing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
};

const EmployeeDetailHeader = ({ isEditing, saving, onStartEdit, onSave, onCancelEdit, onClose }: EmployeeDetailHeaderProps) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("common.employee_details")}</h2>
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
            style={{ fontSize: 13 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? arabicSource("common.saving") : arabicSource("common.save")}
          </motion.button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            style={{ fontSize: 13 }}
          >
            {arabicSource("common.cancel")}
          </button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStartEdit}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
          style={{ fontSize: 13 }}
        >
          <Edit className="w-4 h-4" />
          {arabicSource("common.edit")}
        </motion.button>
      )}
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  </div>
);

export default EmployeeDetailHeader;
