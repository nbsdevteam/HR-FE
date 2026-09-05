import { TypeAhead } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment, DbShift } from "@/shared/hooks";

const getShiftId = (shift: DbShift): string => shift.id;
const getShiftLabel = (shift: DbShift): string => shift.name;

type TShiftDepartmentAssignmentRowProps = {
  department: DbDepartment;
  shifts: DbShift[];
  value: string;
  onChange: (shiftId: string) => void;
};

const ShiftDepartmentAssignmentRow = ({
  department,
  shifts,
  value,
  onChange,
}: TShiftDepartmentAssignmentRowProps) => {
  return (
    <div className="flex items-center flex-wrap gap-3 p-3 bg-muted/10 rounded-lg">
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: department.color }}
      />
      <span className="text-foreground flex-1 min-w-[80px] truncate">
        {department.name}
      </span>
      <TypeAhead
        items={shifts || []}
        getId={getShiftId}
        getLabel={getShiftLabel}
        value={value}
        onChange={onChange}
        blankLabel={arabicSource("settings.virtual_shift")}
        className="w-full sm:w-auto sm:min-w-[180px]"
      />
    </div>
  );
};

export default ShiftDepartmentAssignmentRow;
