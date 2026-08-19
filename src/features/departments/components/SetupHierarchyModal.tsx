import { Briefcase, Crown } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import ModalHeader from "./ModalHeader";
import ModalFooterActions from "./ModalFooterActions";

type SetupHierarchyModalProps = {
  dbEmployees: DbEmployee[];
  saving: boolean;
  onClose: () => void;
  onSetup: () => void;
};

const SetupHierarchyModal = ({ dbEmployees, saving, onClose, onSetup }: SetupHierarchyModalProps) => {
  const rootEmployeeCount = dbEmployees.filter(e => !e.manager_id).length;

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { type: "spring", stiffness: 400, damping: 30 },
      }}
    >
        <ModalHeader
          icon={Crown}
          title={arabicSource("hierarchy.preparing_the_organizational_structure")}
          subtitle={arabicSource("hierarchy.create_a_structure_owner_ceo_coo")}
          onClose={onClose}
          headerClassName=""
          headerStyle={{ background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))" }}
          iconBadgeClassName=""
          iconBadgeStyle={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
          iconColorClassName="text-white"
        />

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

        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onSetup}
          confirmLabel={arabicSource("common.chassis_initialization")}
          confirmIcon={Crown}
          confirmClassName="text-black"
          confirmStyle={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
          disabled={saving}
          loading={saving}
          loadingLabel={arabicSource("hierarchy.initializing")}
        />
    </ModalOverlay>
  );
};

export default SetupHierarchyModal;
