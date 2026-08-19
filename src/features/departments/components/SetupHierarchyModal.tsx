import { Briefcase, Crown } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import ModalHeader from "./ModalHeader";
import ModalFooterActions from "./ModalFooterActions";
import OrgPreviewNode from "./OrgPreviewNode";
import IconBulletListItem from "./IconBulletListItem";

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
                <OrgPreviewNode
                  title={arabicSource("common.chief_executive_officer_ceo")}
                  subtitle={rootEmployeeCount > 0
                    ? `← ${rootEmployeeCount} ${arabicSource("hierarchy.current_employee")}`
                    : arabicSource("common.no_subordinates")}
                />
                <OrgPreviewNode
                  title={arabicSource("common.chief_operating_officer_coo")}
                  subtitle={arabicSource("common.no_subordinates")}
                />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-foreground" style={{ fontSize: 12 }}>{arabicSource("hierarchy.3_new_employees_will_be_created")}</p>
            <ul className="mt-2 space-y-1 text-muted-foreground" style={{ fontSize: 11 }}>
              <IconBulletListItem icon={Crown} colorClassName="text-yellow-400" label={arabicSource("common.owner")}>
                {arabicSource("hierarchy.top_of_the_pyramid_gold")}
              </IconBulletListItem>
              <IconBulletListItem icon={Briefcase} colorClassName="text-purple-400" label={arabicSource("common.chief_executive_officer_ceo")}>
                {arabicSource("common.under_the_owner")}
              </IconBulletListItem>
              <IconBulletListItem icon={Briefcase} colorClassName="text-purple-400" label={arabicSource("common.chief_operating_officer_coo")}>
                {arabicSource("common.under_the_owner")}
              </IconBulletListItem>
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
