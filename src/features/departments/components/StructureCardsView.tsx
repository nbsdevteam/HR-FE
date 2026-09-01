import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition, OrgStructureTree } from "@/shared/hooks";
import { EmptyState, LoadingState } from "@/shared/components";
import StructureCardsDepartment from "./StructureCardsDepartment";
import StructureCardsOrphans from "./StructureCardsOrphans";
import StructureCardsSummary from "./StructureCardsSummary";

type StructureCardsViewProps = {
  tree: OrgStructureTree | null;
  loading: boolean;
  error: string | null;
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
 * The level-wise graph: department → level band → position → employee.
 *
 * Driven by a single call to `/api/hr/org-structure/tree`, made once by the
 * caller (`useStructureView`) and handed down as `tree` — this component
 * never fetches on its own, so the page never fires the endpoint twice.
 *
 * Grade is not displayed anywhere, and cannot be — the payload carries no
 * grade code, name or band. See `docs/ORGANIZATIONAL_STRUCTURE_FE_HANDOFF.md`.
 */
const StructureCardsView = ({
  tree,
  loading,
  error,
  matchedIds,
  hasActiveFilter,
  onSelectPosition,
  onSelectEmployee,
}: StructureCardsViewProps) => {
  const { t } = useTranslation();

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
      <StructureCardsSummary totals={tree.totals} />

      {/* Departments arrive pre-sorted by the backend — rendered in array order. */}
      <div className="space-y-4">
        {tree.departments.map((department) => (
          <StructureCardsDepartment
            key={department.department_id}
            department={department}
            matchedIds={matchedIds}
            hasActiveFilter={hasActiveFilter}
            onSelectPosition={onSelectPosition}
            onSelectEmployee={onSelectEmployee}
          />
        ))}
      </div>

      <StructureCardsOrphans
        positions={tree.positions_without_department}
        matchedIds={matchedIds}
        hasActiveFilter={hasActiveFilter}
        onSelectPosition={onSelectPosition}
        onSelectEmployee={onSelectEmployee}
      />
    </div>
  );
};

export default StructureCardsView;
