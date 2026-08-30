import { useState, useMemo, useCallback } from "react";
import { ArrowLeftRight, UserCog, Users } from "lucide-react";
import { Modal, ModalFooterActions, TypeAhead } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { findParentOf, getDescendantIds } from "../utils/hierarchyTree";
import FieldLabel from "./FieldLabel";

const getManagerId = (n: OrgNode): string => String(n.id);
const getManagerLabel = (n: OrgNode): string => `${n.name} — ${n.position} (${n.department})`;

type ChangeManagerModalProps = {
  node: OrgNode;
  orgTree: OrgNode;
  allNodes: OrgNode[];
  saving: boolean;
  onConfirm: (empDbId: string, managerDbId: string) => Promise<void>;
  onClose: () => void;
};

/**
 * Focused select-employee -> view-current -> pick-new -> confirm flow,
 * separate from `EditEmployeeModal` (which edits name/position/department
 * too). Writes through the same `handleLinkEmployee` call `UnlinkedPanel`
 * already uses — changing an existing manager is the identical write.
 */
const ChangeManagerModal = ({ node, orgTree, allNodes, saving, onConfirm, onClose }: ChangeManagerModalProps) => {
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [managerId, setManagerId] = useState<number | null>(null);

  const parentNode = useMemo(() => findParentOf(orgTree, node.id), [orgTree, node.id]);
  const currentManager = parentNode && parentNode.dbId !== "__root__" ? parentNode : null;

  // Same cycle/self prevention as EditEmployeeModal's manager picker — never
  // offer the employee itself or any of its own descendants.
  const candidateManagers = useMemo(() => {
    const descendantIds = getDescendantIds(node);
    return allNodes.filter(
      (candidate) =>
        candidate.id !== node.id &&
        !descendantIds.has(candidate.id) &&
        candidate.dbId !== "__root__",
    );
  }, [allNodes, node]);

  const nodesById = useMemo(() => {
    const map = new Map<number, OrgNode>();
    allNodes.forEach((candidate) => map.set(candidate.id, candidate));
    return map;
  }, [allNodes]);

  const newManager = managerId !== null ? nodesById.get(managerId) : undefined;
  const canContinue = Boolean(newManager) && managerId !== currentManager?.id;
  const isPickStep = step === "pick";

  const handleManagerChange = useCallback((value: string): void => {
    setManagerId(value ? Number(value) : null);
  }, []);

  const handleContinue = useCallback((): void => {
    setStep("confirm");
  }, []);

  const handleBack = useCallback((): void => {
    setStep("pick");
  }, []);

  const handleConfirm = useCallback((): void => {
    if (!newManager) return;
    void onConfirm(node.dbId, newManager.dbId);
  }, [newManager, node.dbId, onConfirm]);

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
      icon={UserCog}
      title={arabicSource("hierarchy.change_manager_action")}
      subtitle={isPickStep ? arabicSource("hierarchy.change_manager_subtitle") : undefined}
      headerClassName="bg-purple-500/10"
      iconBadgeClassName="bg-purple-500/20"
      iconColorClassName="text-purple-400"
      footer={
        isPickStep ? (
          <ModalFooterActions
            onCancel={onClose}
            onConfirm={handleContinue}
            confirmLabel={arabicSource("hierarchy.change_manager_continue")}
            disabled={!canContinue}
          />
        ) : (
          <ModalFooterActions
            onCancel={handleBack}
            cancelLabel={arabicSource("hierarchy.change_manager_back")}
            onConfirm={handleConfirm}
            confirmLabel={arabicSource("common.confirm")}
            confirmClassName="bg-purple-500 text-white hover:bg-purple-500/90"
            loading={saving}
          />
        )
      }
    >
      {isPickStep ? (
        <>
          <div>
            <FieldLabel>{arabicSource("hierarchy.change_manager_current_label")}</FieldLabel>
            <p className="text-foreground" style={{ fontSize: 13 }}>
              {currentManager ? (
                <span data-i18n-ignore>{currentManager.name}</span>
              ) : (
                arabicSource("common.without_a_manager_top_of_the_pyramid")
              )}
            </p>
          </div>
          <div>
            <FieldLabel icon={Users} accentColorClassName="text-purple-400">
              {arabicSource("hierarchy.change_manager_new_label")}
            </FieldLabel>
            <TypeAhead
              items={candidateManagers}
              getId={getManagerId}
              getLabel={getManagerLabel}
              value={managerId != null ? String(managerId) : ""}
              onChange={handleManagerChange}
              optionsAreData
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource("hierarchy.change_manager_confirm_heading")} <span data-i18n-ignore>{node.name}</span>
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.change_manager_current_label")}</p>
              <p className="text-foreground truncate" style={{ fontSize: 13 }}>
                {currentManager ? (
                  <span data-i18n-ignore>{currentManager.name}</span>
                ) : (
                  arabicSource("common.without_a_manager_top_of_the_pyramid")
                )}
              </p>
            </div>
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.change_manager_new_label")}</p>
              <p className="text-primary truncate" style={{ fontSize: 13 }} data-i18n-ignore>{newManager?.name}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ChangeManagerModal;
