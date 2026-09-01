import { useCallback } from "react";
import type { MouseEvent } from "react";
import { User } from "lucide-react";
import type { OrgStructureDepartment, OrgStructureEmployee, OrgStructurePosition } from "@/shared/hooks";
import { employeeMatchId } from "../utils/orgStructure";

type StructureCardsEmployeeProps = {
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
 * One real person holding a position.
 *
 * Only rendered from `position.employees`, which the backend populates from
 * actual records — this component never receives a placeholder.
 */
const StructureCardsEmployee = ({
  employee,
  position,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectEmployee,
}: StructureCardsEmployeeProps) => {
  const matched = matchedIds.has(employeeMatchId(employee));
  const dimmed = hasActiveFilter && !matched;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>): void => {
      event.stopPropagation();
      onSelectEmployee(employee, position, department);
    },
    [onSelectEmployee, employee, position, department],
  );

  return (
    <div
      data-structure-id={employeeMatchId(employee)}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      className={`flex items-center gap-2.5 py-1 cursor-pointer rounded-md transition-opacity ${
        matched ? "ring-2 ring-primary/60" : ""
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <User className="w-3.5 h-3.5" />
      </span>
      <span className="truncate" style={{ fontSize: 13 }}>
        {employee.name}
      </span>
      {/* Frequently empty on real rows — an empty badge would just be noise. */}
      {employee.employee_code && (
        <span
          className="shrink-0 rounded bg-muted/40 text-muted-foreground tabular-nums px-1.5 py-0.5"
          style={{ fontSize: 10.5 }}
        >
          {employee.employee_code}
        </span>
      )}
    </div>
  );
};

export default StructureCardsEmployee;
