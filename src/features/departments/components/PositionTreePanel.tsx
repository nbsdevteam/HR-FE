import { useMemo, useCallback } from "react";
import { Loader2, Network, Plus } from "lucide-react";
import { Button } from "@/shared/components";
import { indexBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";
import type { PositionNode } from "../types";
import PositionCard from "./PositionCard";

type PositionTreePanelProps = {
  positionTree: PositionNode[];
  dbDepartments: DbDepartment[];
  deptColors: Record<string, string>;
  saving: boolean;
  onDrop: (employeeId: string, positionId: string) => void;
  onAddPosition: (parentId: string | null) => void;
  onDeletePosition: (posId: string) => void;
  onEditPosition: (pos: PositionNode) => void;
  expandedPositions: Record<string, boolean>;
  togglePositionExpand: (id: string) => void;
};

const PositionTreePanel = ({
  positionTree,
  dbDepartments,
  deptColors,
  saving,
  onDrop,
  onAddPosition,
  onDeletePosition,
  onEditPosition,
  expandedPositions,
  togglePositionExpand,
}: PositionTreePanelProps) => {
  // Built once here instead of `.find()`-ing the department list inside every card.
  const departmentsById = useMemo(
    () => indexBy(dbDepartments, (department) => department.id),
    [dbDepartments],
  );

  const handleAddPositionClick = useCallback((): void => {
    onAddPosition(null);
  }, [onAddPosition]);

  return (
    <div className="flex-1 bg-card/20 border border-border/30 rounded-xl overflow-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground" style={{ fontSize: 15 }}>
          {arabicSource("common.position_structure")}
        </h3>
        <div className="flex items-center gap-2">
          {saving && (
            <div
              className="flex items-center gap-1.5 text-primary"
              style={{ fontSize: 12 }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
              {arabicSource("common.saving")}
            </div>
          )}
          <Button size="sm" icon={Plus} onClick={handleAddPositionClick}>
            {arabicSource("hierarchy.new_position")}
          </Button>
        </div>
      </div>

      {positionTree.length > 0 ? (
        <div
          className="flex gap-6 justify-center"
          style={{ minWidth: "fit-content" }}
        >
          {positionTree.map((root) => (
            <PositionCard
              key={root.id}
              node={root}
              depth={0}
              departmentsById={departmentsById}
              deptColors={deptColors}
              onDrop={onDrop}
              onAddPosition={onAddPosition}
              onDeletePosition={onDeletePosition}
              onEditPosition={onEditPosition}
              expandedPositions={expandedPositions}
              togglePositionExpand={togglePositionExpand}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Network className="w-12 h-12 mb-4 opacity-30" />
          <p style={{ fontSize: 16 }}>
            {arabicSource("hierarchy.there_are_no_positions_yet")}
          </p>
          <p className="mt-2" style={{ fontSize: 13 }}>
            {arabicSource(
              "hierarchy.create_the_positions_first_and_then_drag_the_employees_to_assign",
            )}
          </p>
          <Button
            icon={Plus}
            onClick={handleAddPositionClick}
            className="mt-4"
            style={{ fontSize: 13 }}
          >
            {arabicSource("hierarchy.create_the_first_position")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PositionTreePanel;
