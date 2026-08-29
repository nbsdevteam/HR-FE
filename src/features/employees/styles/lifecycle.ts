import { getStatusColor } from "@/shared/utils/statusColors";
import { arabicSource } from "@/i18n/source";

export const lifecycleCardClass = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

export const lifecycleInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

/** Lifecycle statuses that get a badge colour, in the order they appear in the UI. */
export const lifecycleStatusKeys = [
  "active",
  "expired",
  "terminated",
  "renewed",
  "pending",
  "valid",
  "expiring_soon",
  "missing",
  "pending_review",
  "initiated",
  "in_progress",
  "clearance",
  "settlement",
  "completed",
  "cancelled",
] as const;

/**
 * Projection of the shared `STATUS_COLORS` table onto the lifecycle key set.
 * The Tailwind strings live in `@/shared/utils/statusColors` only — this map
 * exists so lifecycle callers keep their existing `Record<string, string>` API.
 */
export const defaultLifecycleStatusColors: Record<string, string> = Object.fromEntries(
  lifecycleStatusKeys.map(key => [key, getStatusColor(key)]),
);

export const defaultLifecycleStatusLabels: Record<string, string> = {
  active: arabicSource("common.is_active"),
  expired: arabicSource("common.finished"),
  terminated: arabicSource("lifecycle.terminated"),
  renewed: arabicSource("lifecycle.refurbished"),
  pending: arabicSource("common.pending"),
  valid: arabicSource("common.surrey"),
  expiring_soon: arabicSource("common.soon_to_be_completed"),
  missing: arabicSource("common.is_missing"),
  pending_review: arabicSource("common.is_under_review"),
  initiated: arabicSource("lifecycle.started"),
  in_progress: arabicSource("common.my_neighbor"),
  clearance: arabicSource("lifecycle.disclaimer"),
  settlement: arabicSource("lifecycle.settlement"),
  completed: arabicSource("common.complete"),
  cancelled: arabicSource("common.canceled"),
  passed: arabicSource("common.successful"),
  failed: arabicSource("common.failed"),
  waived: arabicSource("lifecycle.exempt"),
};

export const defaultExitTypeLabels: Record<string, string> = {
  resignation: arabicSource("lifecycle.resignation"),
  termination: arabicSource("common.termination_of_service"),
  contract_end: arabicSource("lifecycle.contract_expiration"),
  retirement: arabicSource("lifecycle.retired"),
  mutual: arabicSource("lifecycle.mutual_agreement"),
  death: arabicSource("lifecycle.death"),
};

export const defaultChecklistCategoryLabels: Record<string, string> = {
  general: arabicSource("common.general"),
  it: arabicSource("common.information_technology"),
  finance: arabicSource("common.finance"),
  hr: arabicSource("common.human_resources"),
  admin: arabicSource("common.management"),
  custodies: arabicSource("lifecycle.covenant"),
};
