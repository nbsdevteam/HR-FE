import { arabicSource } from "@/i18n/source";

export const lifecycleCardClass = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

export const lifecycleInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

export const defaultLifecycleStatusColors: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  expired: "bg-destructive/10 border-destructive/20 text-destructive",
  terminated: "bg-destructive/10 border-destructive/20 text-destructive",
  renewed: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  pending: "bg-primary/10 border-primary/20 text-primary",
  valid: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  expiring_soon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  missing: "bg-destructive/10 border-destructive/20 text-destructive",
  pending_review: "bg-primary/10 border-primary/20 text-primary",
  initiated: "bg-primary/10 border-primary/20 text-primary",
  in_progress: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  clearance: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  settlement: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  completed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  cancelled: "bg-muted/20 border-muted/30 text-muted-foreground",
};

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
