import { usePermissions } from "@/shared/auth/permissions";

/**
 * Only `hr.leave.manage_types` may create/update/delete leave types —
 * already enforced server-side on all three routes. This is UX only: it
 * hides the create/delete affordances for a user who can't use them, the
 * backend stays the actual enforcement point.
 */
export const useLeaveTypePermissions = () => {
  const { hasPermission } = usePermissions();
  return { canManage: hasPermission("hr.leave.manage_types") };
};
