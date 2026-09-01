import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOrgStructure } from "@/shared/hooks";
import { EmptyState, LoadingState } from "@/shared/components";
import OrgStructureDepartmentCard from "./OrgStructureDepartmentCard";
import OrgStructureOrphanPositions from "./OrgStructureOrphanPositions";
import OrgStructureSummaryHeader from "./OrgStructureSummaryHeader";

/**
 * The Organizational Structure tab: department → position → employee.
 *
 * Driven by a single call to `/api/hr/org-structure/tree`; the structure is
 * never reassembled from several endpoints. Read-only.
 *
 * Grade is not displayed anywhere, and cannot be — the payload carries no
 * grade code, name or band. See `docs/ORGANIZATIONAL_STRUCTURE_FE_HANDOFF.md`.
 */
const OrgStructureView = () => {
  const { t } = useTranslation();
  const { tree, loading, error } = useOrgStructure();

  if (loading) {
    return <LoadingState message={t("common.loading")} variant="stacked" />;
  }

  if (error || !tree) {
    return <EmptyState icon={Building2} message={error ?? t("common.error")} />;
  }

  const hasContent =
    tree.departments.length > 0 || tree.positions_without_department.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        icon={Building2}
        message={t("hierarchy.no_structure_yet")}
        hint={t("hierarchy.no_structure_yet_hint")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <OrgStructureSummaryHeader totals={tree.totals} />

      {/* Departments arrive pre-sorted by the backend — rendered in array order. */}
      <div className="grid gap-4 lg:grid-cols-2">
        {tree.departments.map((department) => (
          <OrgStructureDepartmentCard
            key={department.department_id}
            department={department}
          />
        ))}
      </div>

      <OrgStructureOrphanPositions positions={tree.positions_without_department} />
    </div>
  );
};

export default OrgStructureView;
