import { useMemo } from "react";
import { Building2, Layers, UserCheck, UserX, Briefcase } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/shared/components";
import type { OrgStructureTotals } from "@/shared/hooks";

type StructureCardsSummaryProps = {
  totals: OrgStructureTotals;
};

type SummaryTile = {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
};

/**
 * The populations behind the structure, stated separately.
 *
 * `employees_total` and `employees_on_positions` are very different numbers —
 * most employees may hold no position at all. Showing only one of them invites
 * the reader to assume the structure has lost people.
 */
const StructureCardsSummary = ({ totals }: StructureCardsSummaryProps) => {
  const { t } = useTranslation();

  const tiles = useMemo<SummaryTile[]>(
    () => [
      { label: t("hierarchy.departments_count"), value: totals.departments, icon: Building2 },
      { label: t("hierarchy.positions_total"), value: totals.positions, icon: Briefcase },
      { label: t("hierarchy.seats_total"), value: totals.seats, icon: Layers },
      { label: t("hierarchy.on_positions"), value: totals.employees_on_positions, icon: UserCheck },
      {
        label: t("hierarchy.without_position"),
        value: Math.max(0, totals.employees_total - totals.employees_on_positions),
        icon: UserX,
      },
    ],
    [t, totals],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {tiles.map((tile, index) => (
        <StatCard
          key={tile.label}
          label={tile.label}
          value={tile.value}
          icon={tile.icon}
          index={index}
          decoration="glow"
          hoverLift
        />
      ))}
    </div>
  );
};

export default StructureCardsSummary;
