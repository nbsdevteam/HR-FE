import { memo } from "react";
import { NodeAvatar } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";

type PositionCardEmployeeRowProps = {
  employee: DbEmployee;
  color: string;
};

/** One employee currently appointed to a position. */
const PositionCardEmployeeRow = ({
  employee,
  color,
}: PositionCardEmployeeRowProps) => {
  const name = empDisplayName(employee);

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
      <span className="text-foreground truncate" style={{ fontSize: 11 }}>
        {name}
      </span>
    </div>
  );
};

export default memo(PositionCardEmployeeRow);
