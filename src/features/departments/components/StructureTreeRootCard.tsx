import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import { orgLabel, positionMatchId } from "../utils/orgStructure";

type StructureTreeRootCardProps = {
  position: OrgStructurePosition;
  department: OrgStructureDepartment;
  onSelectPosition: (position: OrgStructurePosition, department?: OrgStructureDepartment) => void;
};

/**
 * The head of the tree — a real position read from the payload, with its own
 * department named under it.
 *
 * The departments are drawn beneath it because an org chart is read that way,
 * not because the response says they report to it: `hr.department.parent_id`
 * is empty on every department. The card states only what the payload holds
 * for this one position.
 */
const StructureTreeRootCard = ({
  position,
  department,
  onSelectPosition,
}: StructureTreeRootCardProps) => {
  const { t } = useTranslation();

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
      className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm cursor-pointer"
    >
      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <UserRound className="w-4 h-4" />
      </span>
      <div className="min-w-0 text-start">
        <p className="font-semibold leading-snug" style={{ fontSize: 14 }}>
          {orgLabel(position.title, position.title_ar)}
        </p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
          {orgLabel(department.department, department.department_ar)}
        </p>
        <p className="text-muted-foreground tabular-nums" style={{ fontSize: 11 }}>
          {t("hierarchy.n_positions", { count: position.seats })}
          {position.seats > 0 &&
            ` · ${t("hierarchy.filled_of_seats", {
              filled: position.employee_count,
              seats: position.seats,
            })}`}
        </p>
      </div>
    </div>
  );
};

export default StructureTreeRootCard;
