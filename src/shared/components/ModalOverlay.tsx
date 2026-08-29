import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const DEFAULT_OVERLAY_MOTION: HTMLMotionProps<"div"> = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const DEFAULT_CONTENT_MOTION: HTMLMotionProps<"div"> = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

const DEFAULT_OVERLAY_CLASS =
  "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4";

const DEFAULT_CONTENT_CLASS =
  "bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto";

interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  /**
   * Full replacement for the backdrop's className (not merged — pass the
   * complete class string when a modal's overlay differs from the default).
   */
  overlayClassName?: string;
  /**
   * Full replacement for the animated content card's className (not merged —
   * pass the complete class string when a modal's card differs from the default).
   */
  contentClassName?: string;
  /** Override the backdrop's framer-motion props (defaults to a simple fade). */
  overlayMotionProps?: HTMLMotionProps<"div">;
  /** Override the content card's framer-motion props (defaults to scale+fade). */
  contentMotionProps?: HTMLMotionProps<"div">;
  /** Set false to keep the modal open when the backdrop is clicked. */
  closeOnBackdropClick?: boolean;
}

/**
 * Shared modal backdrop + animated content card, factored out of the ~30 feature
 * modals that were each hand-rolling the same "fixed inset-0 bg-black/70
 * backdrop-blur-sm" overlay. Per-modal animation/sizing differences are passed
 * through via the motion/className overrides rather than baked in here.
 */
const ModalOverlay = ({
  onClose,
  children,
  overlayClassName,
  contentClassName,
  overlayMotionProps,
  contentMotionProps,
  closeOnBackdropClick = true,
}: ModalOverlayProps) => (
  <motion.div
    {...DEFAULT_OVERLAY_MOTION}
    {...overlayMotionProps}
    className={overlayClassName ?? DEFAULT_OVERLAY_CLASS}
    onClick={closeOnBackdropClick ? onClose : undefined}
  >
    <motion.div
      {...DEFAULT_CONTENT_MOTION}
      {...contentMotionProps}
      onClick={(e) => e.stopPropagation()}
      className={contentClassName ?? DEFAULT_CONTENT_CLASS}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default ModalOverlay;
