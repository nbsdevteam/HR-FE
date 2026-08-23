import type { HTMLMotionProps } from "motion/react";

/** Backdrop shared by every policy dialog (was copy-pasted into all three). */
export const POLICY_MODAL_OVERLAY_CLASS =
  "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4";

/** Card shell for the create/edit dialogs. */
export const POLICY_MODAL_CONTENT_CLASS =
  "bg-card border border-border/40 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto";

/** Wider card shell for the read-only view dialog. */
export const POLICY_MODAL_WIDE_CONTENT_CLASS =
  "bg-card border border-border/40 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto";

/** Scale+fade entrance shared by every policy dialog. */
export const POLICY_MODAL_MOTION_PROPS: HTMLMotionProps<"div"> = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/** Header row used by the policy dialogs (title start, close button end). */
export const POLICY_MODAL_HEADER_CLASS = "flex items-center justify-between mb-6";

/** Footer row holding a dialog's submit/cancel pair. */
export const POLICY_MODAL_ACTIONS_CLASS = "flex items-center gap-3 pt-4";

/** Shared field style for policy form inputs. */
export const policyFieldCls =
  "w-full px-4 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none";
