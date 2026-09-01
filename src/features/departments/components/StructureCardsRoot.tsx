import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition, OrgStructureTree } from "@/shared/hooks";
import StructureCardsDepartment from "./StructureCardsDepartment";
import TreeConnectors from "./TreeConnectors";

type StructureCardsRootProps = {
  tree: OrgStructureTree;
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
 * The head of the graph: one root card for the whole organization, fanned out
 * by connector wires to every department (handoff doc §2 tier 1).
 */
const StructureCardsRoot = ({
  tree,
  expandedDepartments,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsRootProps) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const childRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    childRefs.current = childRefs.current.slice(0, tree.departments.length);
  }, [tree.departments.length]);

  const registerDepartmentRef = (index: number, el: HTMLDivElement | null): void => {
    childRefs.current[index] = el;
  };

  return (
    <div className="relative flex flex-col items-center">
      {tree.departments.length > 0 && (
        <TreeConnectors parentRef={cardRef} childRefs={childRefs} color="var(--color-border)" />
      )}

      <div
        ref={cardRef}
        className="relative z-[1] w-56 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center shadow-sm"
      >
        <p className="font-semibold" style={{ fontSize: 14 }}>
          {t("hierarchy.organization")}
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 11.5 }}>
          {t("hierarchy.overall_structure")}
        </p>
        <p className="mt-1 tabular-nums text-primary font-medium" style={{ fontSize: 12.5 }}>
          {t("hierarchy.n_employees", { count: tree.totals.employees_total })}
        </p>
      </div>

      <div className="relative z-[1] flex flex-wrap justify-center gap-6 pt-10">
        {tree.departments.map((department, index) => (
          <div key={department.department_id} ref={(el) => registerDepartmentRef(index, el)}>
            <StructureCardsDepartment
              department={department}
              expanded={expandedDepartments.has(department.department_id)}
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
  );
};

export default StructureCardsRoot;
