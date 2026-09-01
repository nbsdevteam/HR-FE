import { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructurePosition } from "@/shared/hooks";
import { groupPositionsByLevel } from "../utils/orgStructure";
import OrgStructureLevelGroup from "./OrgStructureLevelGroup";

type OrgStructureOrphanPositionsProps = {
  positions: OrgStructurePosition[];
};

/**
 * Positions that carry no department.
 *
 * The backend keeps these out of `departments` on purpose, so they get their
 * own labelled group rather than being folded into a real department — which
 * would misattribute them.
 */
const OrgStructureOrphanPositions = ({ positions }: OrgStructureOrphanPositionsProps) => {
  const { t } = useTranslation();
  const groups = useMemo(() => groupPositionsByLevel(positions), [positions]);

  if (positions.length === 0) return null;

  return (
    <section className="rounded-xl border border-dashed border-border/60 bg-card/40 overflow-hidden">
      <header className="flex items-start gap-2.5 border-b border-border/40 px-4 py-3">
        <span className="w-8 h-8 rounded-lg bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0">
          <HelpCircle className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold" style={{ fontSize: 14.5 }}>
            {t("hierarchy.no_department")}
          </h3>
          <p className="text-muted-foreground" style={{ fontSize: 11.5 }}>
            {t("hierarchy.positions_without_department_hint")}
          </p>
        </div>
      </header>
      <div className="px-4 py-3 space-y-3">
        {groups.map((group) => (
          <OrgStructureLevelGroup key={group.level ?? "none"} group={group} />
        ))}
      </div>
    </section>
  );
};

export default OrgStructureOrphanPositions;
