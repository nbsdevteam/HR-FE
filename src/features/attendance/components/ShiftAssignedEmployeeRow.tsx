import { memo } from "react";
import { X } from "lucide-react";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type ShiftAssignedEmployeeRowProps = {
  employee: DbEmployee;
  onRemove: (empId: string) => void;
};

const ShiftAssignedEmployeeRow = ({ employee, onRemove }: ShiftAssignedEmployeeRowProps) => {
  const name = empDisplayName(employee);

  const handleRemoveClick = (): void => {
    onRemove(employee.id);
  };

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
      {employee.profile_picture ? (
        <img src={employee.profile_picture} alt={name} className="w-5 h-5 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-primary" style={{ fontSize: 8 }}>{name.charAt(0)}</span>
        </div>
      )}
      <span className="text-foreground truncate flex-1" style={{ fontSize: 11 }}>{name}</span>
      <button
        onClick={handleRemoveClick}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0"
        title={arabicSource("shared.cancel_assignment")}
      >
        <X className="w-3 h-3 text-red-400" />
      </button>
    </div>
  );
};

export default memo(ShiftAssignedEmployeeRow);
