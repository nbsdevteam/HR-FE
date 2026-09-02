import { useMemo, useRef, useEffect } from "react";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { findOrgRootPosition } from "../utils/orgRootPosition";
import StructureTreeDepartmentColumn from "./StructureTreeDepartmentColumn";
import StructureTreeLegend from "./StructureTreeLegend";
import StructureTreeRootCard from "./StructureTreeRootCard";
import TreeConnectors from "./TreeConnectors";

type StructureTreeViewProps = {
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
 * The org chart: top position, then every department, then the positions in
 * each and the people in those.
 *
 * The wire from the head to the departments is a reading aid, not a reporting
 * line — the response carries no department parent and no position-to-position
 * link. When no head position exists the departments render on their own
 * rather than gaining an invented one.
 */
const StructureTreeView = ({
  departments,
  collapsedDepartments,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureTreeViewProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const root = useMemo(() => findOrgRootPosition(departments), [departments]);

  useEffect(() => {
    columnRefs.current = columnRefs.current.slice(0, departments.length);
  }, [departments.length]);

  const registerColumnRef = (index: number, el: HTMLDivElement | null): void => {
    columnRefs.current[index] = el;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="relative flex flex-col items-center">
        {root && (
          <TreeConnectors
            parentRef={rootRef}
            childRefs={columnRefs}
            color="var(--color-border)"
          />
        )}

        {root && (
          <div ref={rootRef} className="relative z-[1]">
            <StructureTreeRootCard
              position={root.position}
              department={root.department}
              onSelectPosition={onSelectPosition}
            />
          </div>
        )}

        <div className={`relative z-[1] flex items-start gap-3 ${root ? "pt-12" : ""}`}>
          {departments.map((department, index) => (
            <div key={department.department_id} ref={(el) => registerColumnRef(index, el)}>
              <StructureTreeDepartmentColumn
                department={department}
                rootPositionId={root ? root.position.position_id : null}
                collapsed={collapsedDepartments.has(department.department_id)}
                onToggleDepartment={onToggleDepartment}
                matchedIds={matchedIds}
                hasActiveFilter={hasActiveFilter}
                onSelectPosition={onSelectPosition}
                onSelectEmployee={onSelectEmployee}
              />
            </div>
          ))}
        </div>
      </div>

      <StructureTreeLegend />
    </div>
  );
};

export default StructureTreeView;
