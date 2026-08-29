import { useMemo, useCallback } from "react";
import { Trash2, Users } from "lucide-react";
import {
  ModalFooterActions,
  ModalOverlay,
  NodeAvatar,
} from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { defaultDeptColorMap } from "../styles";
import { countDescendants, findParentOf } from "../utils/hierarchyTree";
import DeleteOptionButton from "./DeleteOptionButton";

/**
 * Kept local rather than folded into the shared `ConfirmDeleteModal`: this
 * dialog renders an avatar header + department colour bar and, when the node
 * has reports, replaces the confirm/cancel row with a two-way choice
 * (re-parent the subordinates vs. orphan them). `ConfirmDeleteModal` only
 * models a single confirm action, so it cannot express that branch.
 */
const DeleteConfirmModal = ({
  node,
  orgTree,
  onDelete,
  onClose,
}: {
  node: OrgNode;
  orgTree: OrgNode;
  onDelete: (node: OrgNode, reparent: boolean) => void;
  onClose: () => void;
}) => {
  const parentNode = useMemo(
    () => findParentOf(orgTree, node.id),
    [orgTree, node.id],
  );
  const descendantCount = useMemo(() => countDescendants(node), [node]);

  const hasChildren = node.children.length > 0;
  const topColor = defaultDeptColorMap[node.department] || node.color;

  const handleDeleteWithReassignClick = useCallback((): void => {
    onDelete(node, true);
  }, [node, onDelete]);

  const handleDeleteWithoutReassignClick = useCallback((): void => {
    onDelete(node, false);
  }, [node, onDelete]);

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.92 },
      }}
    >
      <div className="h-1.5" style={{ background: topColor }} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <NodeAvatar
            photo={node.photo}
            name={node.name}
            color={node.color}
            initials={node.initials}
            sizeClassName="w-12 h-12"
            extraClassName="shadow-md"
            fontSize={18}
          />
          <div data-i18n-ignore>
            <h3 className="text-foreground" style={{ fontSize: 14 }}>
              {node.name}
            </h3>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {node.position}
            </p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400" style={{ fontSize: 12 }}>
            {arabicSource(
              "hierarchy.are_you_sure_to_delete_this_employee_from_the_organizational_cha",
            )}
          </p>
          <p className="text-red-400/70 mt-1" style={{ fontSize: 11 }}>
            {arabicSource(
              "hierarchy.only_the_link_to_the_manager_will_be_removed_the_employee_will_n",
            )}
          </p>
        </div>

        {hasChildren ? (
          <div className="space-y-3">
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {arabicSource("hierarchy.this_employee_has")} {node.children.length}{" "}
              {arabicSource("hierarchy.direct_reports_choose_what_to_do")}
            </p>
            <DeleteOptionButton
              icon={Users}
              onClick={handleDeleteWithReassignClick}
              toneClassName="border-border/60 hover:border-primary/40 hover:bg-primary/5"
              iconClassName="text-primary"
              titleClassName="text-foreground"
              title={arabicSource("hierarchy.moving_subordinates_to_the_top")}
              description={
                parentNode ? (
                  <>
                    {arabicSource("hierarchy.subordinates_will_be_transferred_to")}
                    <span data-i18n-ignore>{parentNode.name}</span>"
                  </>
                ) : (
                  arabicSource(
                    "hierarchy.subordinates_will_be_moved_to_a_higher_level",
                  )
                )
              }
            />
            <DeleteOptionButton
              icon={Trash2}
              onClick={handleDeleteWithoutReassignClick}
              toneClassName="border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5"
              iconClassName="text-red-400"
              titleClassName="text-red-400"
              title={arabicSource("hierarchy.dismissal_of_all_subordinates")}
              description={`${arabicSource("hierarchy.will_lose")} ${descendantCount} ${arabicSource("hierarchy.the_liaison_employee_with_their_manager")}`}
            />
            <button
              onClick={onClose}
              className="w-full mt-1 py-2 rounded-lg bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-center"
              style={{ fontSize: 12 }}
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        ) : (
          <ModalFooterActions
            onCancel={onClose}
            onConfirm={handleDeleteWithoutReassignClick}
            confirmLabel={arabicSource("common.separation_from_the_structure")}
            confirmIcon={Trash2}
            confirmClassName="bg-red-500/90 hover:bg-red-500 text-white"
            wrapperClassName="flex items-center justify-end gap-3 mt-2"
          />
        )}
      </div>
    </ModalOverlay>
  );
};

export default DeleteConfirmModal;
