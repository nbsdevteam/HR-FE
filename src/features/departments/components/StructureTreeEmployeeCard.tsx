import type { OrgStructureDepartment, OrgStructureEmployee, OrgStructurePosition } from "@/shared/hooks";
import StructureCardsEmployee from "./StructureCardsEmployee";

type StructureTreeEmployeeCardProps = {
  employee: OrgStructureEmployee;
  position: OrgStructurePosition;
  department?: OrgStructureDepartment;
  matchedIds: Set<string>;
  hasActiveFilter: boolean;
  onSelectEmployee: (
    employee: OrgStructureEmployee,
    position: OrgStructurePosition,
    department?: OrgStructureDepartment,
  ) => void;
};

/**
 * A person on the tree, boxed as its own node.
 *
 * Only the frame belongs to this view — the row itself is `StructureCardsEmployee`,
 * so selection, search highlighting and dimming behave exactly as they do in
 * the card view rather than being reimplemented here.
 */
const StructureTreeEmployeeCard = ({
  employee,
  position,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectEmployee,
}: StructureTreeEmployeeCardProps) => (
  <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-1">
    <StructureCardsEmployee
      employee={employee}
      position={position}
      department={department}
      matchedIds={matchedIds}
      hasActiveFilter={hasActiveFilter}
      onSelectEmployee={onSelectEmployee}
    />
  </div>
);

export default StructureTreeEmployeeCard;
