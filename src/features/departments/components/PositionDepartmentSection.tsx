import { memo } from "react";
import type { PositionDepartmentGroup, PositionNode } from "../types";
import PositionDepartmentHeaderRow from "./PositionDepartmentHeaderRow";
import PositionCard from "./PositionCard";

type PositionDepartmentSectionProps = {
  group: PositionDepartmentGroup;
  collapsed: boolean;
  isDragActive: boolean;
  onToggleDepartment: (departmentId: string) => void;
  onExpandDepartment: (departmentId: string) => void;
  onDrop: (employeeId: string, positionId: string) => void;
  onAddPosition: (parentId: string | null) => void;
  onDeletePosition: (posId: string) => void;
  onEditPosition: (pos: PositionNode) => void;
};

/**
 * One department: its collapsible heading, and — while expanded — a
 * responsive grid of its position cards. Only the heading collapses; a
 * position's occupants stay on its card the whole time.
 */
const PositionDepartmentSection = ({
  group,
  collapsed,
  isDragActive,
  onToggleDepartment,
  onExpandDepartment,
  onDrop,
  onAddPosition,
  onDeletePosition,
  onEditPosition,
}: PositionDepartmentSectionProps) => (
  <div>
    <PositionDepartmentHeaderRow
      group={group}
      collapsed={collapsed}
      isDragActive={isDragActive}
      onToggle={onToggleDepartment}
      onExpand={onExpandDepartment}
    />
    {!collapsed && (
      <div
        className="grid gap-3 mt-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {group.rows.map((row, index) => (
          <PositionCard
            key={row.node.id}
            row={row}
            color={group.color}
            departmentName={group.name}
            index={index}
            isDragActive={isDragActive}
            onDrop={onDrop}
            onAddPosition={onAddPosition}
            onDeletePosition={onDeletePosition}
            onEditPosition={onEditPosition}
          />
        ))}
      </div>
    )}
  </div>
);

export default memo(PositionDepartmentSection);
