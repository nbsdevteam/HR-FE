import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import StructureCardsDepartment from "./StructureCardsDepartment";

type StructureCardsForestProps = {
  departments: OrgStructureDepartment[];
  expandedDepartments: Set<string>;
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
 * (task doc §0, §11). A forest of real roots is the honest shape, and it is
 * the same shape `ReportingTreeView` renders once reporting lines exist.
 */
const StructureCardsForest = ({
  departments,
  expandedDepartments,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsForestProps) => (
  <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-8">
    {departments.map((department) => (
      <StructureCardsDepartment
        key={department.department_id}
        department={department}
        expanded={expandedDepartments.has(department.department_id)}
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
