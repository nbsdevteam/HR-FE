import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { orgLabel, positionMatchId } from "../utils/orgStructure";
import StructureTreeEmployeeCard from "./StructureTreeEmployeeCard";
import StructureTreeVacancyChip from "./StructureTreeVacancyChip";

type StructureTreePositionCardProps = {
  position: OrgStructurePosition;
  department: OrgStructureDepartment;
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
 * A position, then everyone in it, then whatever is left unfilled.
 *
 * `seats` is the establishment, so it is what the card counts — the people
 * below are the ones actually recorded against it. Where the two disagree the
 * card shows both rather than reconciling them: a position can be over
 * establishment, and that is real.
 */
const StructureTreePositionCard = ({
  position,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureTreePositionCardProps) => {
  const { t } = useTranslation();
  const matched = matchedIds.has(positionMatchId(position));
  const dimmed = hasActiveFilter && !matched;

  const handleClick = useCallback((): void => {
    onSelectPosition(position, department);
  }, [onSelectPosition, position, department]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onSelectPosition(position, department);
    },
    [onSelectPosition, position, department],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div
        data-structure-id={positionMatchId(position)}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`flex items-start gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-2 text-start cursor-pointer transition-opacity ${
          matched ? "ring-2 ring-primary/60" : ""
        } ${dimmed ? "opacity-40" : ""}`}
      >
        <span className="mt-0.5 w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-3 h-3" />
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-snug" style={{ fontSize: 11.5 }}>
            {orgLabel(position.title, position.title_ar)}
          </p>
          <p className="text-muted-foreground tabular-nums" style={{ fontSize: 10 }}>
            {position.seats > 0
              ? t("hierarchy.n_positions", { count: position.seats })
              : t("hierarchy.n_employees", { count: position.employee_count })}
          </p>
        </div>
      </div>

      {position.employees.map((employee) => (
        <StructureTreeEmployeeCard
          key={employee.employee_id}
          employee={employee}
          position={position}
          department={department}
          matchedIds={matchedIds}
          hasActiveFilter={hasActiveFilter}
          onSelectEmployee={onSelectEmployee}
        />
      ))}

      <StructureTreeVacancyChip count={position.vacancies} />
    </div>
  );
};

export default StructureTreePositionCard;
