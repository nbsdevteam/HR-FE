import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Modal, ModalFooterActions } from "@/shared/components";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import ChecklistItem from "./ChecklistItem";

type CleanupDuplicatesModalProps = {
  dbEmployees: DbEmployee[];
  saving: boolean;
  onClose: () => void;
  onCleanup: () => void;
};

const CleanupDuplicatesModal = ({ dbEmployees, saving, onClose, onCleanup }: CleanupDuplicatesModalProps) => {
  // One pass over the employee list instead of three separate `.filter()` scans.
  const { ownerCount, ceoCount, cooCount } = useMemo(() => {
    const ownerLabel = arabicSource("common.owner");
    const seniorLabel = arabicSource("common.senior_management");
    let owners = 0;
    let ceos = 0;
    let coos = 0;
    for (const employee of dbEmployees) {
      if (employee.department === ownerLabel || employee.position === ownerLabel) owners += 1;
      if (employee.department !== seniorLabel) continue;
      if (employee.position === "CEO") ceos += 1;
      else if (employee.position === "COO") coos += 1;
    }
    return { ownerCount: owners, ceoCount: ceos, cooCount: coos };
  }, [dbEmployees]);

  return (
    <Modal
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { type: "spring", stiffness: 400, damping: 30 },
      }}
      icon={Trash2}
      title={arabicSource("common.clean_up_duplicates")}
      subtitle={arabicSource("hierarchy.delete_duplicate_entries_owner_ceo_coo")}
      headerClassName="bg-red-500/10"
      iconBadgeClassName="bg-red-500/20"
      iconColorClassName="text-red-400"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onCleanup}
          confirmLabel={arabicSource("common.clean_up_duplicates")}
          confirmIcon={Trash2}
          confirmClassName="bg-red-500/90 hover:bg-red-500 text-white"
          disabled={saving}
          loading={saving}
          loadingLabel={arabicSource("hierarchy.cleaning_in_progress")}
        />
      }
    >
          <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-2">
            <p className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("hierarchy.the_system_will")}</p>
            <div className="space-y-1.5">
              <ChecklistItem dotColorClassName="bg-red-400">
                {arabicSource("hierarchy.delete_duplicate_entries_for_owner_ceo_and_coo")}
              </ChecklistItem>
              <ChecklistItem dotColorClassName="bg-green-400">
                {arabicSource("hierarchy.keep_the_older_version_of_each_position")}
              </ChecklistItem>
              <ChecklistItem dotColorClassName="bg-blue-400">
                {arabicSource("hierarchy.automatically_reconnect_all_affected_employees")}
              </ChecklistItem>
              <ChecklistItem dotColorClassName="bg-yellow-400">
                {arabicSource("hierarchy.ensure_one_correct_structure_owner_ceo_coo")}
              </ChecklistItem>
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
    </Modal>
  );
};

export default CleanupDuplicatesModal;
