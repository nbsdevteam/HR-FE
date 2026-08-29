/**
 * Single seam for the `hr.warnings.edit` / `hr.warnings.view` split (backend §6.9):
 * upload and delete controls must be hidden from a view-only user, since the
 * backend answers those calls with `Forbidden`.
 *
 * This app carries no client-side RBAC yet — `useAuth`'s user exposes only
 * id/email/name, with no group or permission list — so the flag is optimistic
 * and the backend stays the enforcement point. When the login response starts
 * carrying permissions, derive `canEdit` here and every warning attachment
 * control follows without further changes.
 */
export const useWarningPermissions = () => {
  return { canEdit: true, canView: true };
};
