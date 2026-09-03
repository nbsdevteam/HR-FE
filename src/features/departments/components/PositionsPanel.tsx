import { useCallback } from "react";
import { Loader2, Network, Plus } from "lucide-react";
import { Button, EmptyState } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import type { PositionDepartmentGroup, PositionFilter, PositionNode } from "../types";
import PositionsFilterBar from "./PositionsFilterBar";
import PositionDepartmentSection from "./PositionDepartmentSection";

type PositionsPanelProps = {
  groups: PositionDepartmentGroup[];
  hasPositions: boolean;
  collapsedDepartments: Record<string, boolean>;
  posSearch: string;
  onPosSearchChange: (value: string) => void;
  onClearPosSearch: () => void;
  filter: PositionFilter;
  onFilterChange: (filter: PositionFilter) => void;
  filterCounts: Record<PositionFilter, number>;
  busy: boolean;
  isDragActive: boolean;
  onToggleDepartment: (departmentId: string) => void;
  onExpandDepartment: (departmentId: string) => void;
  onDrop: (employeeId: string, positionId: string) => void;
  onAddPosition: (parentId: string | null) => void;
  onDeletePosition: (posId: string) => void;
  onEditPosition: (pos: PositionNode) => void;
  onEditEmployee: (employee: DbEmployee) => void;
};

/**
 * The position side: a department-grouped grid of position cards that grows
 * with expanded departments (capped at max-h-[560px], past which it scrolls
 * internally). Only departments collapse.
 */
const PositionsPanel = ({
  groups,
  hasPositions,
  collapsedDepartments,
  posSearch,
  onPosSearchChange,
  onClearPosSearch,
  filter,
  onFilterChange,
  filterCounts,
  busy,
  isDragActive,
  onToggleDepartment,
  onExpandDepartment,
  onDrop,
  onAddPosition,
  onDeletePosition,
  onEditPosition,
  onEditEmployee,
}: PositionsPanelProps) => {
  const handleAddRootPositionClick = useCallback((): void => {
    onAddPosition(null);
  }, [onAddPosition]);

  return (
    <div className="flex-1 min-w-0 bg-card/20 border border-border/30 rounded-xl flex flex-col min-h-0">
      <div className="p-3 border-b border-border/30 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-foreground" style={{ fontSize: 15 }}>
            {arabicSource("common.position_structure")}
          </h3>
          {busy && (
            <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {arabicSource("common.saving")}
            </div>
          )}
        </div>
        {hasPositions && (
          <PositionsFilterBar
            posSearch={posSearch}
            onSearchChange={onPosSearchChange}
            onClearSearch={onClearPosSearch}
            filter={filter}
            onFilterChange={onFilterChange}
            counts={filterCounts}
          />
        )}
      </div>

      <div className="flex-auto min-h-0 max-h-[560px] overflow-y-auto p-3 space-y-5">
        {!hasPositions ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Network className="w-12 h-12 mb-4 opacity-30" />
            <p style={{ fontSize: 16 }}>{arabicSource("hierarchy.there_are_no_positions_yet")}</p>
            <p className="mt-2" style={{ fontSize: 13 }}>
              {arabicSource(
                "hierarchy.create_the_positions_first_and_then_drag_the_employees_to_assign",
              )}
            </p>
            <Button
              icon={Plus}
              onClick={handleAddRootPositionClick}
              className="mt-4"
              style={{ fontSize: 13 }}
            >
              {arabicSource("hierarchy.create_the_first_position")}
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState icon={Network} message={arabicSource("common.no_results_found")} />
        ) : (
          groups.map((group) => (
            <PositionDepartmentSection
              key={group.id}
              group={group}
              collapsed={Boolean(collapsedDepartments[group.id])}
              isDragActive={isDragActive}
              onToggleDepartment={onToggleDepartment}
              onExpandDepartment={onExpandDepartment}
              onDrop={onDrop}
              onAddPosition={onAddPosition}
              onDeletePosition={onDeletePosition}
              onEditPosition={onEditPosition}
              onEditEmployee={onEditEmployee}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PositionsPanel;
