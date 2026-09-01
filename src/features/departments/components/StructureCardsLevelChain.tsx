import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { OrgStructureDepartment, OrgStructurePosition } from "@/shared/hooks";
import type { OrgLevelGroup } from "../utils/orgStructure";
import StructureCardsLevelGroup from "./StructureCardsLevelGroup";
import TreeConnectors from "./TreeConnectors";

type StructureCardsLevelChainProps = {
  groups: OrgLevelGroup[];
  index: number;
  parentRef: RefObject<HTMLDivElement | null>;
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
 * One level band, drawn as a wired row: a fan of connectors from the previous
 * row (or the department card) to every position on this level, then — if a
 * level follows — recurses, handing the *row's own anchor point* on as the
 * next connector's parent.
 *
 * The anchor is never one of the row's cards: when a level holds several
 * peers, nothing in the data says which of them the next level reports to,
 * so the wire must originate from the row as a whole (handoff doc §4).
 */
const StructureCardsLevelChain = ({
  groups,
  index,
  parentRef,
  department,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsLevelChainProps) => {
  const group = groups[index];
  const anchorRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, group.positions.length);
  }, [group.positions.length]);

  const registerCardRef = (position: number, el: HTMLDivElement | null): void => {
    cardRefs.current[position] = el;
  };

  return (
    <div className="relative flex flex-col items-center">
      <TreeConnectors parentRef={parentRef} childRefs={cardRefs} color="var(--color-border)" />

      <div className="relative z-[1] pt-8">
        <StructureCardsLevelGroup
          group={group}
          department={department}
          matchedIds={matchedIds}
          hasActiveFilter={hasActiveFilter}
          onSelectPosition={onSelectPosition}
          onSelectEmployee={onSelectEmployee}
          registerCardRef={registerCardRef}
        />
      </div>

      <div ref={anchorRef} className="relative z-[1] w-px h-px" />

      {index + 1 < groups.length && (
        <div className="pt-2">
          <StructureCardsLevelChain
            groups={groups}
            index={index + 1}
            parentRef={anchorRef}
            department={department}
            matchedIds={matchedIds}
            hasActiveFilter={hasActiveFilter}
            onSelectPosition={onSelectPosition}
            onSelectEmployee={onSelectEmployee}
          />
        </div>
      )}
    </div>
  );
};

export default StructureCardsLevelChain;
