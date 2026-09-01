import { useCallback, useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import {
  departmentSeats,
  departmentStaffOnPositions,
  departmentStaffWithoutPosition,
  employeeMatchId,
  groupPositionsByLevel,
  orgLabel,
  positionMatchId,
} from "../utils/orgStructure";
import StructureCardsLevelChain from "./StructureCardsLevelChain";

type StructureCardsDepartmentProps = {
  department: OrgStructureDepartment;
  expanded: boolean;
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
 * The tier-1 node of the graph: one department, collapsed by default. Its
 * toggle carries the level count; expanding it wires up the level chain
 * beneath it (handoff doc §2).
 *
 * A department with no positions still renders — its emptiness is part of
 * the structure, not a reason to hide it.
 */
const StructureCardsDepartment = ({
  department,
  expanded,
  onToggleDepartment,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsDepartmentProps) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupPositionsByLevel(department.positions), [department.positions]);
  const hasLevels = groups.length > 0;
  const onPositions = departmentStaffOnPositions(department);
  const seats = departmentSeats(department);
  const withoutPosition = departmentStaffWithoutPosition(department);

  const isMatchedInside = useMemo(
    () =>
      hasActiveFilter &&
      department.positions.some(
        (position) =>
          matchedIds.has(positionMatchId(position)) ||
          position.employees.some((employee) => matchedIds.has(employeeMatchId(employee))),
      ),
    [department.positions, matchedIds, hasActiveFilter],
  );
  const isExpanded = expanded || isMatchedInside;

  const handleToggleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      onToggleDepartment(department.department_id);
    },
    [onToggleDepartment, department.department_id],
  );

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={cardRef}
        className="relative z-[1] w-64 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm"
      >
        <header className="flex items-start justify-between gap-2 border-b border-border/40 bg-muted/10 px-3.5 py-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold" style={{ fontSize: 13.5 }}>
                {orgLabel(department.department, department.department_ar)}
              </h3>
              <p className="tabular-nums text-muted-foreground truncate" style={{ fontSize: 10.5 }}>
                {t("hierarchy.n_positions", { count: department.position_count })}
              </p>
            </div>
          </div>

          {hasLevels && (
            <button
              type="button"
              onClick={handleToggleClick}
              aria-expanded={isExpanded}
              className="shrink-0 flex items-center gap-1 rounded-full bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary px-2 py-1 transition-colors"
            >
              <span className="tabular-nums" style={{ fontSize: 10.5 }}>
                {department.level_count}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 motion-reduce:transition-none ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </header>

        <div className="px-3.5 py-2 text-muted-foreground" style={{ fontSize: 11 }}>
          {!hasLevels ? (
            <p>{t("hierarchy.no_positions_defined")}</p>
          ) : (
            seats > 0 && (
              <p className="tabular-nums">{t("hierarchy.filled_of_seats", { filled: onPositions, seats })}</p>
            )
          )}
        </div>
      </div>

      {isExpanded && hasLevels && (
        <div className="pt-2">
          <StructureCardsLevelChain
            groups={groups}
            index={0}
            parentRef={cardRef}
            department={department}
            matchedIds={matchedIds}
            hasActiveFilter={hasActiveFilter}
            onSelectPosition={onSelectPosition}
            onSelectEmployee={onSelectEmployee}
          />
        </div>
      )}

      {/*
        department.employee_count includes people holding no position, so it
        is not the sum of the level chain above. Surface the remainder
        separately instead of letting the two numbers silently disagree.
      */}
      {withoutPosition > 0 && (
        <p className="mt-2 text-muted-foreground" style={{ fontSize: 11 }}>
          {t("hierarchy.n_without_position", { count: withoutPosition })}
        </p>
      )}
    </div>
  );
};

export default StructureCardsDepartment;
