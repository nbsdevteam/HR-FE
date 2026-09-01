import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import type { OrgLevelGroup } from "../utils/orgStructure";
import StructureCardsPosition from "./StructureCardsPosition";

type StructureCardsLevelGroupProps = {
  group: OrgLevelGroup;
  department?: OrgStructureDepartment;
  matchedIds: Set<string>;
  hasActiveFilter: boolean;
  onSelectPosition: (position: OrgStructurePosition, department?: OrgStructureDepartment) => void;
  onSelectEmployee: (
    employee: OrgStructurePosition["employees"][number],
    position: OrgStructurePosition,
    department?: OrgStructureDepartment,
  ) => void;
  /**
   * Registers a position card's DOM node so an ancestor can draw a connector
   * wire to it. Omitted for rows that aren't part of a wired tree (the
   * orphan bucket has no seniority chain to connect).
   */
  registerCardRef?: (index: number, el: HTMLDivElement | null) => void;
};

/**
 * One seniority band inside a department, drawn as a horizontal row of the
 * graph — a labelled divider, then every position at that level side by side.
 *
 * The divider is purely decorative (§2 rule 4 of the handoff doc): it never
 * draws a line from one specific card to another, since this endpoint carries
 * no manager relationship to justify one.
 */
const StructureCardsLevelGroup = ({
  group,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
  registerCardRef,
}: StructureCardsLevelGroupProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-border/40" />
        <p
          className="shrink-0 text-muted-foreground uppercase tracking-wide"
          style={{ fontSize: 10.5 }}
        >
          {group.level === null
            ? t("hierarchy.no_level")
            : t("hierarchy.level_n", { level: group.level })}
        </p>
        <div className="flex-1 border-t border-border/40" />
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {group.positions.map((position, index) => (
          <div
            key={position.position_id}
            ref={registerCardRef ? (el) => registerCardRef(index, el) : undefined}
          >
            <StructureCardsPosition
              position={position}
              department={department}
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

export default StructureCardsLevelGroup;
