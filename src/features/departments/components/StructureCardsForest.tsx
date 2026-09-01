import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import StructureCardsDepartment from "./StructureCardsDepartment";

type StructureCardsForestProps = {
  departments: OrgStructureDepartment[];
  collapsedDepartments: Set<string>;
  onToggleDepartment: (departmentId: string) => void;
  matchedIds: Set<string>;
  hasActiveFilter: boolean;
  onSelectPosition: (position: OrgStructurePosition, department?: OrgStructureDepartment) => void;
  onSelectEmployee: (
    employee: OrgStructurePosition["employees"][number],
    position: OrgStructurePosition,
    department?: OrgStructureDepartment,
  ) => void;
};

/**
 * The head of the graph: every department, standing on its own.
 *
 * There is deliberately no card above them. The payload carries no
 * organization node, and `hr.department.parent_id` is empty on all 10
 * departments, so any single parent — "Organization", a headcount total, a
 * department promoted to act as one — would be invented rather than read
 * (task doc §0, §11).
 *
 * Departments stack vertically rather than sitting in one row. A row of ten
 * overflowed its scroll container and pushed the first departments off the
 * left edge, so the screen opened on whichever one happened to land in the
 * middle. Stacked, it reads top-down in payload order — department, then its
 * levels, then the positions on each level.
 */
const StructureCardsForest = ({
  departments,
  collapsedDepartments,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsForestProps) => (
  <div className="flex flex-col items-center gap-10">
    {departments.map((department) => (
      <StructureCardsDepartment
        key={department.department_id}
        department={department}
        expanded={!collapsedDepartments.has(department.department_id)}
        onToggleDepartment={onToggleDepartment}
        matchedIds={matchedIds}
        hasActiveFilter={hasActiveFilter}
        onSelectPosition={onSelectPosition}
        onSelectEmployee={onSelectEmployee}
      />
    ))}
  </div>
);

export default StructureCardsForest;
