import { Building2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment, DbShift } from "@/shared/hooks";
import ShiftDepartmentAssignmentRow from "./ShiftDepartmentAssignmentRow";

type TShiftDepartmentAssignmentsProps = {
  departments: DbDepartment[];
  deptLoading: boolean;
  shifts: DbShift[];
  assignments: Record<string, string>;
  saving: boolean;
  onAssignmentChange: (deptId: string, shiftId: string) => void;
  onSave: () => void;
};

const ShiftDepartmentAssignments = ({
  departments,
  deptLoading,
  shifts,
  assignments,
  saving,
  onAssignmentChange,
  onSave,
}: TShiftDepartmentAssignmentsProps) => {
  const handleAssignmentChange =
    (deptId: string) =>
    (shiftId: string): void => {
      onAssignmentChange(deptId, shiftId);
    };

  return (
    <div className="border-t border-border/20 pt-4">
      <h4 className="text-foreground flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-primary" />
        {arabicSource("settings.assigning_shifts_to_departments")}
      </h4>
      <div className="space-y-3">
        {deptLoading ? (
          <div className="text-muted-foreground text-center py-6">
            {arabicSource("common.loading")}
          </div>
        ) : departments.length === 0 ? (
          <div className="text-muted-foreground text-center py-6">
            {arabicSource("common.there_are_no_sections")}
          </div>
        ) : (
          departments?.map((dept) => (
            <ShiftDepartmentAssignmentRow
              key={dept.id}
              department={dept}
              shifts={shifts}
              value={assignments[dept.id] || ""}
              onChange={handleAssignmentChange(dept.id)}
            />
          ))
        )}
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors"
      >
        {saving
          ? arabicSource("common.saving")
          : arabicSource("settings.save_partition_assignments")}
      </button>
    </div>
  );
};

export default ShiftDepartmentAssignments;
