import { memo } from "react";
import type { MouseEventHandler, Ref } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link2, Loader2, Maximize2, Minus, Move, Plus, Users } from "lucide-react";
import type { DbEmployee, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import OrgCard from "./OrgCard";
import DepartmentStatTile from "./DepartmentStatTile";
import ToolbarIconButton from "./ToolbarIconButton";
import ToolbarTextButton from "./ToolbarTextButton";

type DepartmentStat = {
  name: string;
  count: number;
};

type HierarchyTreeSectionProps = {
  dbEmployees: DbEmployee[];
  dbPositions: DbPosition[];
  departmentStats: DepartmentStat[];
  deptColors: Record<string, string>;
  saving: boolean;
  panEnabled: boolean;
  isDragging: boolean;
  zoom: number;
  orgTree: OrgNode;
  expandedMap: Record<number, boolean>;
  selectedNodeId: number | null;
  highlightedIds: Set<number>;
  searchMatchIds: Set<number>;
  containerRef: Ref<HTMLDivElement>;
  chartContentRef: Ref<HTMLDivElement>;
  onTogglePan: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
  onToggleExpand: (id: number) => void;
  onSelectNode: (node: OrgNode) => void;
};

const HierarchyTreeSection = ({
  dbEmployees,
  dbPositions,
  departmentStats,
  deptColors,
  saving,
  panEnabled,
  isDragging,
  zoom,
  orgTree,
  expandedMap,
  selectedNodeId,
  highlightedIds,
  searchMatchIds,
  containerRef,
  chartContentRef,
  onTogglePan,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onExpandAll,
  onCollapseAll,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onToggleExpand,
  onSelectNode,
}: HierarchyTreeSectionProps) => (
  <>
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
      <Link2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-foreground" style={{ fontSize: 13 }}>
          {dbPositions.length > 0
            ? <>{arabicSource("hierarchy.the_organizational_structure_is_automatically_built_from")} <span className="text-primary">{arabicSource("common.position_structure")}</span> {arabicSource("hierarchy.appoint_employees_from_the_positions_and_designations_tab")}</>
            : <>{arabicSource("hierarchy.the_organizational_structure_is_automatically_built_from_a_field")} <span className="text-primary">{arabicSource("hierarchy.direct_manager_manager_id")}</span> {arabicSource("hierarchy.in_each_employee_s_data")}</>
          }
        </p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
          {dbPositions.length > 0
            ? arabicSource("hierarchy.vacant_positions_are_shown_with_a_dashed_frame_card_colors_follo")
            : arabicSource("hierarchy.to_assign_a_manager_to_an_employee_edit_the_employee_data_from_t")
          }
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/30 rounded-xl p-3 text-center shadow-md">
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("common.total_employees")}</p>
        <span className="text-gradient-gold block mt-1" style={{ fontSize: 22 }}>{dbEmployees.length}</span>
        <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("hierarchy.in")} {departmentStats.length} {arabicSource("common.sections")}</p>
      </motion.div>
      {departmentStats.map((dept, i) => (
        <DepartmentStatTile key={dept.name} name={dept.name} count={dept.count} color={deptColors[dept.name] || "#888"} delay={(i + 1) * 0.05} />
      ))}
    </div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-wrap gap-2">
        <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.interactive_organization_map")}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {saving && (
            <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {arabicSource("common.saving")}
            </div>
          )}
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
          <div className="w-px h-5 bg-border/40" />
          <ToolbarTextButton onClick={onExpandAll}>{arabicSource("hierarchy.expand_all")}</ToolbarTextButton>
          <ToolbarTextButton onClick={onCollapseAll}>{arabicSource("hierarchy.collapse_all")}</ToolbarTextButton>
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
        {dbEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-30" />
            <p style={{ fontSize: 16 }}>{arabicSource("hierarchy.there_are_no_employees_in_the_system_yet")}</p>
            <p className="mt-2" style={{ fontSize: 13 }}>{arabicSource("hierarchy.add_employees_from_the_employees_page_and_then_select_their_dire")}</p>
          </div>
        ) : (
          <div style={{ width: "fit-content", minWidth: "100%", paddingBottom: 40 }}>
            <div ref={chartContentRef} className="transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "fit-content", margin: "0 auto" }}>
              <OrgCard node={orgTree} expandedMap={expandedMap} toggleExpand={onToggleExpand}
                onSelect={onSelectNode} selectedId={selectedNodeId}
                highlightedIds={highlightedIds} searchMatchIds={searchMatchIds} deptColors={deptColors} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </>
);

export default memo(HierarchyTreeSection);
