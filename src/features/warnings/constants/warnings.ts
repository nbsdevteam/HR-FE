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

/** Offered terms for `duration_months`; the backend accepts any whole 1–120. */
export const WARNING_DURATION_MONTH_OPTIONS = [1, 3, 6, 12];

/**
 * Sentinel for the duration control's "pick an exact date" branch. The backend
 * takes `duration_months` *or* `expiry_date`, never both, so the form sends one
 * of them based on whether this value is selected.
 */
export const WARNING_EXPIRY_CUSTOM = "custom";

/**
 * Only used until `/api/hr/warnings/attachment_settings` answers — HR can change
 * the real limits from the settings screen, so nothing else may hard-code them.
 */
export const DEFAULT_WARNING_ATTACHMENT_FORMATS = [
  ".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg",
];
export const DEFAULT_WARNING_ATTACHMENT_MAX_BYTES = 10485760;
