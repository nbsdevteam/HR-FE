import { hrCall } from "./client";

export interface HrPermissionActionMap {
  [action: string]: boolean;
}

export interface HrPermissionSectionTree {
  [key: string]: HrPermissionActionMap | HrPermissionSectionTree;
}

export interface HrPermissionsResponse {
  id: number;
  name: string;
  role: string;
  role_label: string;
  permissions: Record<string, HrPermissionSectionTree>;
  routes: Record<string, boolean>;
}

export const fetchMyPermissions = (): Promise<HrPermissionsResponse> =>
  hrCall<HrPermissionsResponse>("/api/crm/me/permissions", {});
