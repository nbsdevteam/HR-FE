import { memo, useState, useCallback } from "react";
import type React from "react";
import { GripVertical } from "lucide-react";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { NodeAvatar } from "@/shared/components";

type DraggableEmployeeCardProps = {
  emp: DbEmployee;
  deptColors: Record<string, string>;
  /** Lets the view light up the positions that can take this employee. */
  onDragStateChange?: (employeeId: string | null) => void;
};

const DraggableEmployeeCard = ({ emp, deptColors, onDragStateChange }: DraggableEmployeeCardProps) => {
  const [dragging, setDragging] = useState(false);
  const name = empDisplayName(emp);
  const color = deptColors[emp.department] || "#8B5CF6";

  const handleCardDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.dataTransfer.setData("employee-id", emp.id);
      e.dataTransfer.effectAllowed = "move";
      setDragging(true);
      onDragStateChange?.(emp.id);
    },
    [emp.id, onDragStateChange],
  );

  const handleCardDragEnd = useCallback((): void => {
    setDragging(false);
    onDragStateChange?.(null);
  }, [onDragStateChange]);

  return (
    <div
      draggable
      onDragStart={handleCardDragStart}
      onDragEnd={handleCardDragEnd}
      className={`h-full flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      <NodeAvatar photo={emp.profile_picture} name={name} color={color} initials={name.charAt(0)} sizeClassName="w-7 h-7" extraClassName="shrink-0" fontSize={10} />
      <div className="min-w-0 flex-1" data-i18n-ignore>
        <p className="text-foreground truncate" style={{ fontSize: 12 }}>{name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{emp.department || "—"}</p>
      </div>
    </div>
  );

};

export default memo(DraggableEmployeeCard);
