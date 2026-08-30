import { arabicSource } from "@/i18n/source";
import { STATUS_TONES } from "@/shared/utils/statusColors";
import type { DbLeaveRequest } from "@/shared/hooks";

export type LeaveExcuseStatusOverride = { label: string; toneClass: string };

/**
 * Overrides the generic Odoo-state badge for a leave carrying a manager
 * excuse request (backend `lugal_hr` v1.16.0). `state` alone maps `confirm`
 * to the same "Pending" badge as an ordinary request, and `validate` to
 * "Accepted" even when the excuse was rejected (the day just becomes Unpaid
 * Leave, not a plain approval) — read `leave_type_name` for what the leave
 * actually is, this only fixes the status label/tone.
 *
 * Returns `null` for a non-excuse leave, or an excuse that was approved
 * (the normal "Accepted" badge is already correct there).
 */
export const resolveLeaveExcuseStatus = (leave: DbLeaveRequest): LeaveExcuseStatusOverride | null => {
  if (!leave.excuse.active) return null;
  if (leave.excuse.state === "pending") {
    return { label: arabicSource("leave.excuse_status_pending"), toneClass: STATUS_TONES.warning };
  }
  if (leave.excuse.state === "rejected") {
    return { label: arabicSource("leave.excuse_status_rejected"), toneClass: STATUS_TONES.danger };
  }
  return null;
};
