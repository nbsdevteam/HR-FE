import { motion } from "motion/react";
import { Loader2, Trash2, X } from "lucide-react";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type CleanupDuplicatesModalProps = {
  dbEmployees: DbEmployee[];
  saving: boolean;
  onClose: () => void;
  onCleanup: () => void;
};

export const CleanupDuplicatesModal = ({ dbEmployees, saving, onClose, onCleanup }: CleanupDuplicatesModalProps) => {
  const ownerCount = dbEmployees.filter(e => e.department === arabicSource("common.owner") || e.position === arabicSource("common.owner")).length;
  const ceoCount = dbEmployees.filter(e => e.position === "CEO" && e.department === arabicSource("common.senior_management")).length;
  const cooCount = dbEmployees.filter(e => e.position === "COO" && e.department === arabicSource("common.senior_management")).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between bg-red-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("common.clean_up_duplicates")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.delete_duplicate_entries_owner_ceo_coo")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-2">
            <p className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("hierarchy.the_system_will")}</p>
            <div className="space-y-1.5">
              <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {arabicSource("hierarchy.delete_duplicate_entries_for_owner_ceo_and_coo")}
              </p>
              <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {arabicSource("hierarchy.keep_the_older_version_of_each_position")}
              </p>
              <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {arabicSource("hierarchy.automatically_reconnect_all_affected_employees")}
              </p>
              <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                {arabicSource("hierarchy.ensure_one_correct_structure_owner_ceo_coo")}
              </p>
            </div>
          </div>

          <div className="bg-muted/10 border border-border/30 rounded-xl p-3">
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {arabicSource("hierarchy.current_iterations")} <span className="text-red-400">{ownerCount}</span> {arabicSource("hierarchy.malik")}{" "}
              <span className="text-red-400">{ceoCount}</span> CEO،{" "}
              <span className="text-red-400">{cooCount}</span> COO
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400" style={{ fontSize: 12 }}>{arabicSource("hierarchy.warning_this_action_cannot_be_undone_duplicate_entries_will_be_p")}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
          <button onClick={onCleanup} disabled={saving}
            className="px-5 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {saving ? arabicSource("hierarchy.cleaning_in_progress") : arabicSource("common.clean_up_duplicates")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
