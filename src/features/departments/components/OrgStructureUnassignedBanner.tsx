import { AlertTriangle } from "lucide-react";
import { StatCard } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type OrgStructureUnassignedBannerProps = {
  count: number;
};

/** Surfaces `unassigned_employee_count` — people who won't appear anywhere in the chart (backend §3). */
const OrgStructureUnassignedBanner = ({ count }: OrgStructureUnassignedBannerProps) => {
  if (count <= 0) return null;

  return (
    <StatCard
      label={arabicSource("org_structure.unassigned_employees_label")}
      value={count}
      icon={AlertTriangle}
      cardClassName="bg-amber-500/10 border border-amber-500/30"
      iconBoxClassName="bg-amber-500/15 border border-amber-500/30"
      iconClassName="w-5 h-5 text-amber-500"
      valueClassName="text-amber-500"
    />
  );
};

export default OrgStructureUnassignedBanner;
