export const auditCardCls =
  "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-6 shadow-lg";

export const actionColors: Record<string, string> = {
  create: "text-emerald-400",
  update: "text-blue-400",
  delete: "text-red-400",
  approve: "text-emerald-400",
  reject: "text-red-400",
  login: "text-primary",
  export: "text-blue-400",
  import: "text-amber-400",
  status_change: "text-amber-400",
  configuration_change: "text-purple-400",
};

export const notifTypeColors: Record<string, string> = {
  info: "border-blue-500/30 bg-blue-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  action: "border-primary/30 bg-primary/10",
};

/** Icon text colour per notification type — kept alongside notifTypeColors so a type has one place its colours are defined. */
export const notifTypeIconColors: Record<string, string> = {
  info: "text-primary",
  warning: "text-amber-400",
  success: "text-emerald-400",
  error: "text-red-400",
  action: "text-primary",
};
