import { useCallback, useState } from "react";
import type { MouseEventHandler, Ref } from "react";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrgStructureDepartment, OrgStructurePosition, OrgStructureTree } from "@/shared/hooks";
import { EmptyState, LoadingState } from "@/shared/components";
import { useContentNaturalSize } from "../hooks/useContentNaturalSize";
import { useStructureTreeExpansion } from "../hooks/useStructureTreeExpansion";
import ReportingTreeBanner from "./ReportingTreeBanner";
import ReportingTreeView from "./ReportingTreeView";
import StructureCardsForest from "./StructureCardsForest";
import StructureCardsOrphans from "./StructureCardsOrphans";
import StructureCardsSummary from "./StructureCardsSummary";
import StructureTreeView from "./StructureTreeView";
import StructureViewModeToggle from "./StructureViewModeToggle";
import type { StructureViewMode } from "./StructureViewModeToggle";

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
  /** Pan/zoom state, scoped to just the diagram viewport below — the summary
   * tiles, view-mode toggle and orphans list stay outside it. */
  panEnabled: boolean;
  isDragging: boolean;
  zoom: number;
  containerRef: Ref<HTMLDivElement>;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
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
  panEnabled,
  isDragging,
  zoom,
  containerRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: StructureCardsViewProps) => {
  const [viewMode, setViewMode] = useState<StructureViewMode>("tree");
  const { t } = useTranslation();
  const { collapsedDepartments, toggleDepartment } = useStructureTreeExpansion();
  const { contentRef, naturalSize } = useContentNaturalSize<HTMLDivElement>();

  const handleViewModeChange = useCallback((next: StructureViewMode): void => {
    setViewMode(next);
  }, []);

  if (loading) {
    return <LoadingState message={t("common.loading")} variant="stacked" />;
  }

  if (error || !tree) {
    return <EmptyState icon={Building2} message={error ?? t("common.error")} />;
  }

  const hasContent =
    tree.departments.length > 0 ||
    tree.positions_without_department.length > 0 ||
    tree.reporting_tree.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        icon={Building2}
        message={t("hierarchy.no_structure_yet")}
        hint={t("hierarchy.no_structure_yet_hint")}
      />
    );
  }

  // Real reporting lines exist — render the tree they actually describe.
  // While `reporting_tree_is_flat`, fall back to the department-grouped view
  // instead (task doc §6): the screen stays useful today, and switches to
  // the reporting tree automatically the moment HR enters a reporting line.
  const showReportingTree = !tree.reporting_tree_is_flat && tree.reporting_tree.length > 0;

  return (
    <div className="space-y-4">
      <StructureCardsSummary totals={tree.totals} />

      {tree.reporting_tree_is_flat && <ReportingTreeBanner />}

      {/* Both alternatives below are department-driven; the reporting tree has its own shape. */}
      {!showReportingTree && (
        <div className="flex justify-end">
          <StructureViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      )}

      {/*
        Only this viewport pans/zooms/scrolls horizontally — the page body and
        the summary/toggle/orphans sections around it never do. The outer div
        reserves the natural content footprint scaled by `zoom` (so the
        scrollbar actually shrinks as the user zooms out); the inner div keeps
        its natural, unscaled layout size and is visually scaled with
        `transform`, which `useContentNaturalSize` measures around.
      */}
      <div
        ref={containerRef}
        className={`overflow-auto rounded-xl border border-border/30 bg-background/40 ${panEnabled ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        style={{ maxHeight: "75vh" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="mx-auto"
          style={{
            width: naturalSize.width ? naturalSize.width * zoom : undefined,
            height: naturalSize.height ? naturalSize.height * zoom : undefined,
          }}
        >
          <div
            ref={contentRef}
            // `w-max` (not `min-w-max`) pins this div's own width to its
            // intrinsic content size. `min-w-max` only sets a floor, so once
            // the wrapper above grows past that (zoom > 1, since it's sized
            // to naturalSize * zoom), this div's `width: auto` would stretch
            // to fill it — which useContentNaturalSize's ResizeObserver then
            // reports as a bigger "natural" size, growing the wrapper again,
            // in a runaway feedback loop.
            className="w-max py-4 transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            {showReportingTree && <ReportingTreeView roots={tree.reporting_tree} />}

            {!showReportingTree && viewMode === "tree" && (
              <StructureTreeView
                departments={tree.departments}
                collapsedDepartments={collapsedDepartments}
                onToggleDepartment={toggleDepartment}
                matchedIds={matchedIds}
                hasActiveFilter={hasActiveFilter}
                onSelectPosition={onSelectPosition}
                onSelectEmployee={onSelectEmployee}
              />
            )}

            {!showReportingTree && viewMode === "cards" && (
              <StructureCardsForest
                departments={tree.departments}
                collapsedDepartments={collapsedDepartments}
                onToggleDepartment={toggleDepartment}
                matchedIds={matchedIds}
                hasActiveFilter={hasActiveFilter}
                onSelectPosition={onSelectPosition}
                onSelectEmployee={onSelectEmployee}
              />
            )}
          </div>
        </div>
      </div>

      {/* Already nested inside the reporting tree (as department_id:false roots) — rendering it again here would double-count. */}
      {!showReportingTree && (
        <StructureCardsOrphans
          positions={tree.positions_without_department}
          matchedIds={matchedIds}
          hasActiveFilter={hasActiveFilter}
          onSelectPosition={onSelectPosition}
          onSelectEmployee={onSelectEmployee}
        />
      )}
    </div>
  );
};

export default StructureCardsView;
