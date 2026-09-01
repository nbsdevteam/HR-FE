import { useTranslation } from "react-i18next";
import type { OrgLevelGroup } from "../utils/orgStructure";
import OrgStructurePositionRow from "./OrgStructurePositionRow";

type OrgStructureLevelGroupProps = {
  group: OrgLevelGroup;
};

/**
 * One seniority band inside a department.
 *
 * Positions of equal seniority share a level, so a band can legitimately hold
 * several positions — the band label is the level the backend assigned, never
 * a running count of rows.
 */
const OrgStructureLevelGroup = ({ group }: OrgStructureLevelGroupProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <p
        className="text-muted-foreground uppercase tracking-wide"
        style={{ fontSize: 10.5 }}
      >
        {group.level === null
          ? t("hierarchy.no_level")
          : t("hierarchy.level_n", { level: group.level })}
      </p>
      <div className="space-y-2">
        {group.positions.map((position) => (
          <OrgStructurePositionRow key={position.position_id} position={position} />
        ))}
      </div>
    </div>
  );
};

export default OrgStructureLevelGroup;
