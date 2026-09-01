import { hrCall } from "./client";
import { mapOrgStructureTree } from "./mappers";
import type { OrgStructureTree } from "../hooks";

/**
 * The Organizational Structure screen: department → position → employee.
 *
 * One request returns the whole tree — departments, their positions in
 * seniority order, and the real employees in each. The screen must not
 * reassemble this from several endpoints.
 *
 * `department_id: null` means "every department".
 */
export const fetchOrgStructureTree = (
  departmentId?: string,
  options: {
    includeEmptyDepartments?: boolean;
    includePositionsWithoutDepartment?: boolean;
  } = {},
): Promise<OrgStructureTree> =>
  hrCall("/api/hr/org-structure/tree", {
    department_id: departmentId ?? null,
    include_empty_departments: options.includeEmptyDepartments ?? true,
    include_positions_without_department:
      options.includePositionsWithoutDepartment ?? true,
  }).then(mapOrgStructureTree);
