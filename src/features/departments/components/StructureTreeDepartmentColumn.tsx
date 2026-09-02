import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { departmentSeats, departmentStaffOnPositions, orgLabel } from "../utils/orgStructure";
import StructureTreePositionCard from "./StructureTreePositionCard";

type StructureTreeDepartmentColumnProps = {
  department: OrgStructureDepartment;
  /** Hoisted to the head of the tree, so it is not repeated inside its own department. */
  rootPositionId: string | null;
  collapsed: boolean;
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
 * One department and the positions beneath it, as a column of the tree.
 *
 * Positions keep payload order — the backend sorts them by level, and
 * reordering them here would assert a seniority the response does not carry.
 */
const StructureTreeDepartmentColumn = ({
  department,
  rootPositionId,
  collapsed,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureTreeDepartmentColumnProps) => {
  const { t } = useTranslation();

  const positions = useMemo(
    () => department.positions.filter((position) => position.position_id !== rootPositionId),
    [department.positions, rootPositionId],
  );

  const onPositions = departmentStaffOnPositions(department);
  const seats = departmentSeats(department);

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      onToggleDepartment(department.department_id);
    },
    [onToggleDepartment, department.department_id],
  );

  return (
    <div className="flex w-40 flex-col items-stretch">
      <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center shadow-sm">
        <span className="mx-auto mb-1 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5" />
        </span>
        <p className="font-semibold leading-snug" style={{ fontSize: 12 }}>
          {orgLabel(department.department, department.department_ar)}
        </p>
        <p className="text-muted-foreground tabular-nums mt-0.5" style={{ fontSize: 10 }}>
          {t("hierarchy.n_positions", { count: department.position_count })}
          {seats > 0 && ` · ${t("hierarchy.filled_of_seats", { filled: onPositions, seats })}`}
        </p>
      </div>

      {positions.length > 0 && (
        <button
          type="button"
          onClick={handleToggleClick}
          aria-expanded={!collapsed}
          className="mx-auto my-1 p-0.5 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 motion-reduce:transition-none ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
      )}

      {!collapsed && (
        <div className="flex flex-col gap-2">
          {positions.map((position) => (
            <StructureTreePositionCard
              key={position.position_id}
              position={position}
              department={department}
              matchedIds={matchedIds}
              hasActiveFilter={hasActiveFilter}
              onSelectPosition={onSelectPosition}
              onSelectEmployee={onSelectEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StructureTreeDepartmentColumn;
