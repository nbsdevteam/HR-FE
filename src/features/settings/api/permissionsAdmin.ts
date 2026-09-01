import { hrCall } from "@/shared/api/client";
import type { HrPermissionActionMap } from "@/shared/api/permissions";

export type { HrPermissionActionMap };

/** `{ section: { action: granted } }` — the full togglable `hr.*` leaf set. */
export type HrPermissionTree = Record<string, HrPermissionActionMap>;

export interface HrPermissionsSchema {
  hr_permission_tree: HrPermissionTree;
  roles: string[];
  role_baselines: Record<string, HrPermissionTree>;
}

export interface HrAdminUserListItem {
  id: number;
  name: string;
  email: string;
  job_title: string;
  employee_id: number | null;
  department: string;
  active: boolean;
  role: string;
  role_label: string;
  has_hr_override: boolean;
}

export interface HrAdminUsersListParams {
  search?: string;
  role?: string;
  active?: boolean;
  page?: number;
  per_page?: number;
}

export interface HrAdminUsersListResponse {
  items: HrAdminUserListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface HrAdminUserPermissions {
  user_id: number;
  name: string;
  email: string;
  job_title: string;
  role: string;
  role_baseline: HrPermissionTree;
  individual_overrides: HrPermissionTree;
  has_individual_overrides: boolean;
  effective_permissions: HrPermissionTree;
  admin_notes: string;
  last_modified_by: string | null;
  last_modified_at: string | null;
}

export interface HrAdminSetPermissionsResponse {
  user_id: number;
  effective_permissions: HrPermissionTree;
}

/** Cacheable — call once and reuse for the editor's checkbox layout. */
export const fetchHrPermissionsSchema = (): Promise<HrPermissionsSchema> =>
  hrCall<HrPermissionsSchema>("/api/hr/admin/permissions/schema", {});

export const fetchHrAdminUsers = (
  params: HrAdminUsersListParams = {},
): Promise<HrAdminUsersListResponse> =>
  hrCall<HrAdminUsersListResponse>("/api/hr/admin/users/list", { ...params });

export const fetchHrUserPermissions = (userId: number): Promise<HrAdminUserPermissions> =>
  hrCall<HrAdminUserPermissions>(`/api/hr/admin/users/${userId}/permissions/get`, {});

/**
 * `permissions` must be the complete `hr` tree, not just the changed leaves —
 * any section omitted here reads back as unset (role/job-title default) on
 * the next load.
 */
export const setHrUserPermissions = (
  userId: number,
  permissions: HrPermissionTree,
  notes: string,
): Promise<HrAdminSetPermissionsResponse> =>
  hrCall<HrAdminSetPermissionsResponse>(`/api/hr/admin/users/${userId}/permissions/set`, {
    permissions,
    notes,
  });

/** Clears this user's individual HR override — falls back to role/job-title baseline. */
export const resetHrUserPermissions = (userId: number): Promise<HrAdminSetPermissionsResponse> =>
  hrCall<HrAdminSetPermissionsResponse>(`/api/hr/admin/users/${userId}/permissions/reset`, {});
