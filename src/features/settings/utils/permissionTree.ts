import type { HrPermissionActionMap, HrPermissionTree } from "../api/permissionsAdmin";

/**
 * Fills a full `hr_permission_tree`-shaped template with values from an
 * overlay (e.g. `effective_permissions`), defaulting any leaf the overlay
 * doesn't cover to `false`. The result always has every section/action the
 * schema declares — required because `.../permissions/set` must be sent the
 * complete tree, not just the changed leaves.
 */
export const buildPermissionTree = (
  template: HrPermissionTree,
  overlay: HrPermissionTree | undefined,
): HrPermissionTree => {
  const result: HrPermissionTree = {};
  for (const [section, actions] of Object.entries(template)) {
    const overlaySection = overlay?.[section];
    const sectionResult: HrPermissionActionMap = {};
    for (const action of Object.keys(actions)) {
      sectionResult[action] = overlaySection?.[action] === true;
    }
    result[section] = sectionResult;
  }
  return result;
};
