import { arabicSource } from "@/i18n/source";
import type { DbDepartment, DbShift } from "@/shared/hooks";

type ShiftDepartmentAssignmentRowProps = {
  department: DbDepartment;
  shifts: DbShift[];
  value: string;
  onChange: (shiftId: string) => void;
};

export const ShiftDepartmentAssignmentRow = ({ department, shifts, value, onChange }: ShiftDepartmentAssignmentRowProps) => (
  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: department.color }} />
    <span className="text-foreground flex-1">{department.name}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1 bg-muted/30 border border-border/40 rounded text-foreground text-sm focus:outline-none focus:border-primary"
    >
      <option value="">{arabicSource("settings.virtual_shift")}</option>
      {shifts.map((shift) => (
        <option key={shift.id} value={shift.id}>
          {shift.name}
        </option>
      ))}
    </select>
  </div>
);
