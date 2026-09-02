import { useMemo } from "react";
import type { ComponentType } from "react";
import { Briefcase, Building2, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import StructureTreeLegendItem from "./StructureTreeLegendItem";

type LegendEntry = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

/** What each kind of node on the tree means, in the order they nest. */
const StructureTreeLegend = () => {
  const { t } = useTranslation();

  const entries = useMemo<LegendEntry[]>(
    () => [
      { label: t("common.employee"), icon: UserRound },
      { label: t("common.position"), icon: Briefcase },
      { label: t("common.section"), icon: Building2 },
      { label: t("hierarchy.vacant") },
    ],
    [t],
  );

  return (
    <div className="mx-auto flex flex-wrap items-center justify-center gap-5 rounded-xl border border-border/40 bg-card/40 px-5 py-2.5">
      {entries.map((entry) => (
        <StructureTreeLegendItem key={entry.label} label={entry.label} icon={entry.icon} />
      ))}
    </div>
  );
};

export default StructureTreeLegend;
