import { usePermissions } from "@/shared/auth/permissions";

/**
 * `hr.warnings.edit` / `hr.warnings.view` split (backend §6.9): upload and
 * delete controls must be hidden from a view-only user, since the backend
 * answers those calls with `Forbidden`. The backend stays the enforcement
 * point — this only decides what renders.
 */
export const useWarningPermissions = () => {
  const { hasPermission } = usePermissions();
  return {
    canEdit: hasPermission("hr.warnings.edit"),
    canView: hasPermission("hr.warnings.view"),
  };
};
