import type { DbLeaveType } from "@/shared/hooks";
import type { NewLeaveTypeForm } from "../types";

/**
 * The Edit modal reuses `NewLeaveTypeForm`'s shape (Create's active field
 * set — see the 10 Sep backend hand-off that retired the rest). `monthly_accrual`
 * is derived and never returned as `accrual_days_per_month`, so the override
 * always starts blank; leaving it untouched keeps whatever the backend already
 * derived instead of resetting it to 0 (per the "omit = untouched" save contract).
 */
export const leaveTypeToEditForm = (leaveType: DbLeaveType): NewLeaveTypeForm => ({
  name_ar: leaveType.name_ar,
  name_en: leaveType.name_en || "",
  is_paid: leaveType.is_paid,
  default_days_per_year: leaveType.default_days_per_year,
  accrual_enabled: leaveType.accrual_enabled,
  accrual_days_per_month: 0,
  color: leaveType.color,
  allow_half_day: leaveType.allow_half_day,
  allow_hourly: leaveType.allow_hourly,
  requires_attachment: leaveType.requires_attachment,
  min_service_months: leaveType.min_service_months,
  excuse_on_insufficient_balance: leaveType.excuse_on_insufficient_balance,
  balance_reset_policy: leaveType.balance_reset_policy,
});

const EDIT_FIELD_KEYS: Extract<keyof NewLeaveTypeForm, string>[] = [
  "name_ar",
  "name_en",
  "is_paid",
  "default_days_per_year",
  "accrual_enabled",
  "accrual_days_per_month",
  "color",
  "allow_half_day",
  "allow_hourly",
  "requires_attachment",
  "min_service_months",
  "excuse_on_insufficient_balance",
  "balance_reset_policy",
];

/**
 * Only the fields the admin actually changed go out — an untouched key is
 * left alone server-side. `forceKeys` overrides that for a field whose
 * "no visible change" is itself meaningful (accrual_days_per_month: clearing
 * it back to 0 must still reach the backend, since 0 also happens to be the
 * always-blank starting value — see `leaveTypeToEditForm`).
 */
export const diffLeaveTypeForm = (
  original: NewLeaveTypeForm,
  edited: NewLeaveTypeForm,
  forceKeys: ReadonlySet<Extract<keyof NewLeaveTypeForm, string>> = new Set(),
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};
  for (const key of EDIT_FIELD_KEYS) {
    if (edited[key] !== original[key] || forceKeys.has(key)) patch[key] = edited[key];
  }
  // The backend's English-name column is `name`, not `name_en` — Create
  // already maps it the same way (see useLeaveTypeManagement.createLeaveType).
  // Sending `name_en` as-is is silently ignored, leaving the name unchanged.
  if ("name_en" in patch) {
    patch.name = patch.name_en;
    delete patch.name_en;
  }
  return patch;
};
