import { lazy, Suspense } from "react";
import type { HTMLMotionProps } from "motion/react";
import { ModalOverlay } from "@/shared/components";
import type { OrgNode } from "../types";

const DetailPanel = lazy(() => import("./DetailPanel"));

/**
 * DetailPanel animates itself, so the overlay's content wrapper stays inert —
 * this reproduces the previous hand-rolled backdrop exactly.
 */
const INERT_CONTENT_MOTION: HTMLMotionProps<"div"> = {
  initial: false,
  animate: undefined,
  exit: undefined,
};

type DetailPanelModalProps = {
  node: OrgNode;
  orgTree: OrgNode;
  onClose: () => void;
  onAddChild: (id: number) => void;
  onDelete: (node: OrgNode) => void;
  onEdit: (node: OrgNode) => void;
};

const DetailPanelModal = ({
  node,
  orgTree,
  onClose,
  onAddChild,
  onDelete,
  onEdit,
}: DetailPanelModalProps) => (
  <ModalOverlay
    onClose={onClose}
    overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    contentClassName=""
    contentMotionProps={INERT_CONTENT_MOTION}
  >
    <Suspense fallback={null}>
      <DetailPanel
        node={node}
        orgTree={orgTree}
        onClose={onClose}
        onAddChild={onAddChild}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </Suspense>
  </ModalOverlay>
);

export default DetailPanelModal;
