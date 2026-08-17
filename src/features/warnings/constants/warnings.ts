// Odoo's lugal.hr.warning uses a fixed English selection for type/status; the FE
// displays Arabic labels driven by configurations. Map between them by position.
export const ODOO_WARNING_TYPE_KEYS = ["verbal", "written", "first", "second", "final"];
export const ODOO_WARNING_STATUS_KEYS = ["active", "expired", "cancelled"];

// Color gradients for warning types — auto-assigned by severity index (lightest → most severe)
export const typeColorPalette = [
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-primary/10 border-primary/20 text-primary",
  "bg-red-400/10 border-red-400/20 text-red-400",
  "bg-red-600/10 border-red-600/20 text-red-500",
  "bg-destructive/10 border-destructive/20 text-destructive",
];

// Status color palette (first = active/destructive, second = expired/muted, third+ = canceled/green)
export const statusColorPalette = [
  "bg-destructive/10 border-destructive/20 text-destructive",
  "bg-muted/30 border-border text-muted-foreground",
  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
];
