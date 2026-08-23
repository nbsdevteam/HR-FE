import { LIFECYCLE_PALETTE, SEVERITY_PALETTE } from "@/shared/utils/statusColors";

// Odoo's lugal.hr.warning uses a fixed English selection for type/status; the FE
// displays Arabic labels driven by configurations. Map between them by position.
export const ODOO_WARNING_TYPE_KEYS = ["verbal", "written", "first", "second", "final"];
export const ODOO_WARNING_STATUS_KEYS = ["active", "expired", "cancelled"];

// Warning types are coloured by severity index (lightest → most severe) and
// statuses by lifecycle position (active → finished → cancelled). Both ramps are
// the shared ones, so the Tailwind strings live in exactly one place app-wide.
export const typeColorPalette = SEVERITY_PALETTE;
export const statusColorPalette = LIFECYCLE_PALETTE;
