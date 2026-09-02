import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";

/**
 * The position drawn at the head of the org chart, found by title.
 *
 * Nothing in the payload marks a top position: `hr.department.parent_id` is
 * empty on every department and no position carries a reporting link, so this
 * is a display convention rather than something read from the data. The match
 * is on the English title, which the API always sends, so it holds whatever
 * language the UI is showing.
 */
const ROOT_POSITION_TITLE = "ceo";

export type OrgRootPosition = {
  position: OrgStructurePosition;
  department: OrgStructureDepartment;
};

/** The head position and the department it belongs to, or `null` when there is none. */
export const findOrgRootPosition = (
  departments: OrgStructureDepartment[],
): OrgRootPosition | null => {
  for (const department of departments) {
    const position = department.positions.find(
      (candidate) => candidate.title.trim().toLowerCase() === ROOT_POSITION_TITLE,
    );
    if (position) return { position, department };
  }
  return null;
};
