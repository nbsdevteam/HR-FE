/**
 * Single seam for the `hr.leave.manage_types` gate on Additional Annual Leave
 * grants (backend v1.17.0 §3): the "Grant"/"Void" actions should be hidden
 * from a viewer without that permission, since the backend answers those
 * calls with `Forbidden`.
 *
 * This app carries no client-side RBAC yet (mirrors `useWarningPermissions`)
 * — `useAuth`'s user exposes only id/email/name, with no group or permission
 * list — so the flag is optimistic and the backend stays the enforcement
 * point. When the login response starts carrying permissions, derive
 * `canManage` here and the grant panel follows without further changes.
 */
export const useAdditionalLeavePermissions = () => {
  return { canManage: true };
};
