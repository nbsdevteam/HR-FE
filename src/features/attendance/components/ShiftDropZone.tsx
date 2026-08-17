import { useState } from "react";
import { Clock, Users, X } from "lucide-react";
import { empDisplayName, type DbEmployee, type DbShift } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

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

  const dayLabelsAr = [
    arabicSource("common.sunday"),
    arabicSource("shared.monday"),
    arabicSource("shared.three"),
    arabicSource("shared.arb"),
    arabicSource("shared.khmi"),
    arabicSource("shared.plural"),
    arabicSource("common.sat"),
  ];
  const workingDays = days.filter(d => (shift as any)[`${d}_is_working`]);
  const workingDayLabels = workingDays.map(d => dayLabelsAr[days.indexOf(d)]);

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        dragOver ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" : "border-border/40 bg-card/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
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
        {assignedEmps.length > 0 ? assignedEmps.map(emp => {
          const name = empDisplayName(emp);
          return (
            <div key={emp.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              {emp.profile_picture ? (
                <img src={emp.profile_picture} alt={name} className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary" style={{ fontSize: 8 }}>{name.charAt(0)}</span>
                </div>
              )}
              <span className="text-foreground truncate flex-1" style={{ fontSize: 11 }}>{name}</span>
              <button
                onClick={() => onRemove(emp.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0"
                title={arabicSource("shared.cancel_assignment")}
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          );
        }) : (
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
