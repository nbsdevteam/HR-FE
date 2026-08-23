import { useState } from "react";
import { Clock, Users } from "lucide-react";
import { type DbEmployee, type DbShift } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { shiftDayLabelsAr } from "../data";
import ShiftAssignedEmployeeRow from "./ShiftAssignedEmployeeRow";

type ShiftDropZoneProps = {
  shift: DbShift;
  assignedEmps: DbEmployee[];
  onDrop: (empId: string, shiftId: string) => void;
  onRemove: (empId: string) => void;
};

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const ShiftDropZone = ({ shift, assignedEmps, onDrop, onRemove }: ShiftDropZoneProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const empId = e.dataTransfer.getData("shift-employee-id");
    if (empId) onDrop(empId, shift.id);
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>): void => {
    setDragOver(false);
  };

  const workingDays = days.filter(d => (shift as any)[`${d}_is_working`]);
  const workingDayLabels = workingDays.map(d => shiftDayLabelsAr[days.indexOf(d)]);

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        dragOver ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" : "border-border/40 bg-card/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${shift.is_default ? "bg-primary/20" : "bg-muted/30"}`}>
              <Clock className={`w-4 h-4 ${shift.is_default ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-foreground" style={{ fontSize: 13 }}>{shift.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                {workingDayLabels.join(" · ")} | {shift.target_hours_per_day}{arabicSource("shared.h_day")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground" style={{ fontSize: 12 }}>{assignedEmps.length}</span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-1.5 min-h-[60px]">
        {assignedEmps.length > 0 ? assignedEmps.map(emp => (
          <ShiftAssignedEmployeeRow key={emp.id} employee={emp} onRemove={onRemove} />
        )) : (
          <div className={`p-3 rounded-lg border-2 border-dashed text-center transition-colors ${dragOver ? "border-primary/60 bg-primary/5" : "border-border/20"}`}>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              {dragOver ? arabicSource("common.drop_here_to_set") : arabicSource("shared.drag_the_staff_here")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftDropZone;
