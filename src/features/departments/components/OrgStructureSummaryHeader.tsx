import { useTranslation } from "react-i18next";
import type { OrgStructureTotals } from "@/shared/hooks";

type OrgStructureSummaryHeaderProps = {
  totals: OrgStructureTotals;
};

type Tile = { label: string; value: number; muted?: boolean };

/**
 * The populations behind the structure, stated separately.
 *
 * `employees_total` and `employees_on_positions` are very different numbers —
 * most employees may hold no position at all. Showing only one of them invites
 * the reader to assume the structure has lost people.
 */
const OrgStructureSummaryHeader = ({ totals }: OrgStructureSummaryHeaderProps) => {
  const { t } = useTranslation();

  const tiles: Tile[] = [
    { label: t("hierarchy.departments_count"), value: totals.departments },
    { label: t("hierarchy.positions_total"), value: totals.positions },
    { label: t("hierarchy.seats_total"), value: totals.seats },
    { label: t("hierarchy.on_positions"), value: totals.employees_on_positions },
    {
      label: t("hierarchy.without_position"),
      value: Math.max(0, totals.employees_total - totals.employees_on_positions),
      muted: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border border-border/50 bg-card px-3 py-2.5"
        >
          <p
            className={`tabular-nums font-semibold ${tile.muted ? "text-muted-foreground" : ""}`}
            style={{ fontSize: 20 }}
          >
            {tile.value}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {tile.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default OrgStructureSummaryHeader;
