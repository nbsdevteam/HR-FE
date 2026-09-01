import { memo } from "react";
import type { MouseEventHandler, Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, Minus, Move, Plus } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { OrgStructureDepartment, OrgStructurePosition, OrgStructureTree } from "@/shared/hooks";
import type { SelectedStructureItem } from "../hooks/useStructureView";
import HierarchyFilterBar from "./HierarchyFilterBar";
import StructureCardsView from "./StructureCardsView";
import StructureItemDetailPopover from "./StructureItemDetailPopover";
import ToolbarIconButton from "./ToolbarIconButton";

type HierarchyStructureSectionProps = {
  tree: OrgStructureTree | null;
  loading: boolean;
  error: string | null;
  panEnabled: boolean;
  isDragging: boolean;
  zoom: number;
  containerRef: Ref<HTMLDivElement>;
  chartContentRef: Ref<HTMLDivElement>;
  departmentOptions: string[];
  jobTitleOptions: string[];
  departmentFilter: string;
  jobTitleFilter: string;
  hasActiveFilter: boolean;
  matchedIds: Set<string>;
  selectedItem: SelectedStructureItem | null;
  onDepartmentFilterChange: (value: string) => void;
  onJobTitleFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onTogglePan: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
  onSelectPosition: (position: OrgStructurePosition, department?: OrgStructureDepartment) => void;
  onSelectEmployee: (
    employee: OrgStructurePosition["employees"][number],
    position: OrgStructurePosition,
    department?: OrgStructureDepartment,
  ) => void;
  onCloseDetail: () => void;
};

/**
 * The level-wise graph, wrapped in the same toolbar chrome the manager tree
 * used to own (zoom/pan, filters). Expand-all/collapse-all and the "saving"
 * indicator are dropped — nothing here is collapsible, and this view never
 * mutates anything.
 */
const HierarchyStructureSection = ({
  tree,
  loading,
  error,
  panEnabled,
  isDragging,
  zoom,
  containerRef,
  chartContentRef,
  departmentOptions,
  jobTitleOptions,
  departmentFilter,
  jobTitleFilter,
  hasActiveFilter,
  matchedIds,
  selectedItem,
  onDepartmentFilterChange,
  onJobTitleFilterChange,
  onClearFilters,
  onTogglePan,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onSelectPosition,
  onSelectEmployee,
  onCloseDetail,
}: HierarchyStructureSectionProps) => (
  <>
    <HierarchyFilterBar
      departmentOptions={departmentOptions}
      jobTitleOptions={jobTitleOptions}
      departmentFilter={departmentFilter}
      jobTitleFilter={jobTitleFilter}
      hasActiveFilter={hasActiveFilter}
      onDepartmentFilterChange={onDepartmentFilterChange}
      onJobTitleFilterChange={onJobTitleFilterChange}
      onClearFilters={onClearFilters}
    />

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-wrap gap-2">
        <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.current_structure")}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ToolbarIconButton
            icon={Move}
            onClick={onTogglePan}
            active={panEnabled}
            title={panEnabled ? arabicSource("hierarchy.stop_dragging") : arabicSource("hierarchy.activate_drag_to_move")}
          />
          <div className="w-px h-5 bg-border/40" />
          <ToolbarIconButton icon={Minus} onClick={onZoomOut} title={arabicSource("hierarchy.zoom_out")} />
          <span className="text-muted-foreground min-w-[40px] text-center" style={{ fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
          <ToolbarIconButton icon={Plus} onClick={onZoomIn} title={arabicSource("hierarchy.enlarge")} />
          <ToolbarIconButton icon={Maximize2} onClick={onResetZoom} title={arabicSource("hierarchy.reset")} />
        </div>
      </div>

      <AnimatePresence>
        {panEnabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border-b border-primary/10 px-5 py-2 flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-primary" />
            <p className="text-primary" style={{ fontSize: 12 }}>{arabicSource("hierarchy.drag_mode_is_on_drag_with_the_mouse_to_move_around_the_map")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className={`overflow-auto p-8 ${panEnabled ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
        style={{ maxHeight: "75vh" }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
          <div ref={chartContentRef} className="transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <StructureCardsView
              tree={tree}
              loading={loading}
              error={error}
              matchedIds={matchedIds}
              hasActiveFilter={hasActiveFilter}
              onSelectPosition={onSelectPosition}
              onSelectEmployee={onSelectEmployee}
            />
          </div>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {selectedItem && (
        <StructureItemDetailPopover item={selectedItem} onClose={onCloseDetail} />
      )}
    </AnimatePresence>
  </>
);

export default memo(HierarchyStructureSection);
