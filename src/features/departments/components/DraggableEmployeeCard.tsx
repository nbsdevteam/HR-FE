import { useState } from "react";
import { GripVertical } from "lucide-react";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";

const DraggableEmployeeCard = ({ emp, deptColors }: { emp: DbEmployee; deptColors: Record<string, string> }) => {
  const [dragging, setDragging] = useState(false);
  const name = empDisplayName(emp);
  const color = deptColors[emp.department] || "#8B5CF6";

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("employee-id", emp.id); e.dataTransfer.effectAllowed = "move"; setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      {emp.profile_picture ? (
        <img src={emp.profile_picture} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
          <span className="text-white" style={{ fontSize: 10 }}>{name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate" style={{ fontSize: 12 }}>{name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{emp.department || "—"}</p>
      </div>
    </div>
  );

};

export default DraggableEmployeeCard;
