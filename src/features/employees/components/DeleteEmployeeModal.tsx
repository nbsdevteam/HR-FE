import { motion } from "motion/react";
import { Loader2, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget } from "../types";

type DeleteEmployeeModalProps = {
  deleteConfirm: DeleteEmployeeTarget;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
};

export const DeleteEmployeeModal = ({ deleteConfirm, deleting, onDelete, onClose }: DeleteEmployeeModalProps) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => !deleting && onClose()}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-destructive/10">
          <Trash2 className="w-5 h-5 text-destructive" />
        </div>
        <h3 className="text-foreground font-semibold" style={{ fontSize: 16 }}>{arabicSource("employees.confirm_deletion")}</h3>
      </div>
      <p className="text-muted-foreground mb-6" style={{ fontSize: 14 }}>
        {arabicSource("employees.are_you_sure_you_want_to_delete_the_employee")} <span className="text-foreground font-medium">{deleteConfirm.name}</span>{arabicSource("employees.all_his_data_will_be_deleted_from_the_system_and_he_will_be_remo")}
      </p>
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={deleting}
          className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.cancel")}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer flex items-center gap-2"
          style={{ fontSize: 13 }}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {deleting ? arabicSource("employees.deleting") : arabicSource("employees.delete_employee")}
        </button>
      </div>
    </motion.div>
  </motion.div>
);
