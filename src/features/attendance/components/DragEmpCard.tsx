import { memo, useState } from "react";
import { GripVertical } from "lucide-react";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";

type DragEmpCardProps = {
  emp: DbEmployee;
  color: string;
};

const DragEmpCard = ({ emp, color }: DragEmpCardProps) => {
  const [dragging, setDragging] = useState(false);
  const name = empDisplayName(emp);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.setData("shift-employee-id", emp.id);
    e.dataTransfer.effectAllowed = "move";
    setDragging(true);
  };

  const handleDragEnd = (_e: React.DragEvent<HTMLDivElement>): void => {
    setDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : "border-border/40 bg-card/50 hover:border-primary/30"
      }`}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      {emp.profile_picture ? (
        <img src={emp.profile_picture} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
          <span className="text-white" style={{ fontSize: 9 }}>{name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate" style={{ fontSize: 11 }}>{name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 9 }}>{emp.department || "—"}</p>
      </div>
    </div>
  );
};

export default memo(DragEmpCard);
