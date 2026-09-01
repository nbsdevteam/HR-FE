import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { isPositionVacant, orgLabel, positionMatchId } from "../utils/orgStructure";
import StructureCardsEmployee from "./StructureCardsEmployee";

type StructureCardsPositionProps = {
  position: OrgStructurePosition;
  department?: OrgStructureDepartment;
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
 * One position and the people in it.
 *
 * A position nobody holds is shown as vacant with its seat count — never with
 * an invented name. Grade is not rendered because the payload carries none;
 * seniority is shown by the enclosing level band.
 */
const StructureCardsPosition = ({
  position,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsPositionProps) => {
  const { t } = useTranslation();
  const vacant = isPositionVacant(position);
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
    <div
      data-structure-id={positionMatchId(position)}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`rounded-lg border p-3 text-start cursor-pointer transition-opacity w-full sm:w-64 ${
        vacant ? "border-dashed border-border/60 bg-transparent" : "border-border/40 bg-card/50"
      } ${matched ? "ring-2 ring-primary/60" : ""} ${dimmed ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-medium" style={{ fontSize: 13.5 }}>
          {orgLabel(position.title, position.title_ar)}
        </p>
        <span
          className="shrink-0 tabular-nums text-muted-foreground"
          style={{ fontSize: 11.5 }}
        >
          {position.seats > 0
            ? t("hierarchy.filled_of_seats", {
                filled: position.employee_count,
                seats: position.seats,
              })
            : t("hierarchy.n_employees", { count: position.employee_count })}
        </span>
      </div>

      {vacant ? (
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full border border-dashed border-flag-hair bg-flag-bg px-2.5 py-0.5 text-flag"
            style={{ fontSize: 11 }}
          >
            {t("hierarchy.vacant")}
          </span>
          {position.seats > 0 && (
            <span className="text-muted-foreground" style={{ fontSize: 11.5 }}>
              {t("hierarchy.n_vacant", { count: position.vacancies })}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-1.5 ps-1">
          {position.employees.map((employee) => (
            <StructureCardsEmployee
              key={employee.employee_id}
              employee={employee}
              position={position}
              department={department}
              matchedIds={matchedIds}
              hasActiveFilter={hasActiveFilter}
              onSelectEmployee={onSelectEmployee}
            />
          ))}
          {/* Some seats filled, some not — say so rather than leaving it implied. */}
          {position.vacancies > 0 && (
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11.5 }}>
              {t("hierarchy.n_vacant", { count: position.vacancies })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StructureCardsPosition;
