import { memo, useCallback } from "react";
import { Edit2 } from "lucide-react";
import { NodeAvatar } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { usePermissions } from "@/shared/auth/permissions";

type PositionCardEmployeeRowProps = {
  employee: DbEmployee;
  color: string;
  onEditEmployee: (employee: DbEmployee) => void;
};

/** One employee currently appointed to a position. */
const PositionCardEmployeeRow = ({
  employee,
  color,
  onEditEmployee,
}: PositionCardEmployeeRowProps) => {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("hr.employees.edit");
  const name = empDisplayName(employee);

  const handleEditClick = useCallback((): void => {
    onEditEmployee(employee);
  }, [employee, onEditEmployee]);

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <NodeAvatar
        photo={employee.profile_picture}
        name={name}
        color={color}
        initials={name.charAt(0)}
        sizeClassName="w-6 h-6"
        extraClassName="shrink-0"
        fontSize={9}
      />
      <span className="text-foreground truncate flex-1" style={{ fontSize: 11 }} data-i18n-ignore>
        {name}
      </span>
      {canEdit && (
        <button
          onClick={handleEditClick}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-blue-500/20 transition-colors shrink-0"
          title={arabicSource("common.edit")}
        >
          <Edit2 className="w-3 h-3 text-blue-400" />
        </button>
      )}
    </div>
  );
};

export default memo(PositionCardEmployeeRow);
