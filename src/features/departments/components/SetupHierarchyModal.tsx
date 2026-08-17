import { motion } from "motion/react";
import { Briefcase, Crown, Loader2, X } from "lucide-react";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type SetupHierarchyModalProps = {
  dbEmployees: DbEmployee[];
  saving: boolean;
  onClose: () => void;
  onSetup: () => void;
};

const SetupHierarchyModal = ({ dbEmployees, saving, onClose, onSetup }: SetupHierarchyModalProps) => {
  const rootEmployeeCount = dbEmployees.filter(e => !e.manager_id).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.preparing_the_organizational_structure")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.create_a_structure_owner_ceo_coo")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-muted/20 border border-border/40 rounded-xl p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-yellow-400/60" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))" }}>
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400" style={{ fontSize: 13 }}>{arabicSource("common.owner")}</span>
              </div>
              <div className="w-px h-4 bg-border/60" />
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-px bg-border/60" />
                  <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                    <span className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("common.chief_executive_officer_ceo")}</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                    {rootEmployeeCount > 0
                      ? `← ${rootEmployeeCount} ${arabicSource("hierarchy.current_employee")}`
                      : arabicSource("common.no_subordinates")}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-px bg-border/60" />
                  <div className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10">
                    <span className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("common.chief_operating_officer_coo")}</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("common.no_subordinates")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("hierarchy.3_new_employees_will_be_created")}</p>
            <ul className="mt-2 space-y-1 text-muted-foreground" style={{ fontSize: 11 }}>
              <li className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-yellow-400" /> <strong className="text-yellow-400">{arabicSource("common.owner")}</strong> {arabicSource("hierarchy.top_of_the_pyramid_gold")}
              </li>
              <li className="flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">{arabicSource("common.chief_executive_officer_ceo")}</strong> {arabicSource("common.under_the_owner")}
              </li>
              <li className="flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-purple-400" /> <strong className="text-purple-400">{arabicSource("common.chief_operating_officer_coo")}</strong> {arabicSource("common.under_the_owner")}
              </li>
            </ul>
            {rootEmployeeCount > 0 && (
              <p className="mt-2 text-amber-500" style={{ fontSize: 11 }}>
                {arabicSource("hierarchy.will_be_transferred")} {rootEmployeeCount} {arabicSource("hierarchy.employee_currently_no_manager_under_ceo_you_can_move_them_later")}
              </p>
            )}
          </div>

          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource("hierarchy.you_can_modify_the_names_and_data_later_by_clicking_on_the_card")}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
          <button onClick={onSetup} disabled={saving}
            className="px-5 py-2 rounded-lg text-black disabled:opacity-50 transition-colors flex items-center gap-2" style={{ fontSize: 13, background: "linear-gradient(135deg, #FFD700, #FFA500)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            {saving ? arabicSource("hierarchy.initializing") : arabicSource("common.chassis_initialization")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SetupHierarchyModal;
