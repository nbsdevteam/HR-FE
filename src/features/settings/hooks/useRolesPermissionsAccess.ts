import { usePermissions } from "@/shared/auth/permissions";

/**
 * `hr.roles_permissions.view` gates the card/nav entry, `.manage` gates the
 * save/reset actions inside it — nobody has either by default (backend
 * hand-off §2). UX only: the backend is the actual enforcement point.
 */
export const useRolesPermissionsAccess = () => {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission("hr.roles_permissions.view"),
    canManage: hasPermission("hr.roles_permissions.manage"),
  };
};
