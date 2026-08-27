import { memo } from "react";
import type { DbEmployee } from "@/shared/hooks";
import DraggableEmployeeCard from "./DraggableEmployeeCard";

/** Card height plus the gap below it, so the windowed slice measures cleanly. */
export const EMPLOYEE_ITEM_HEIGHT = 56;

type UnassignedEmployeeItemProps = {
  employee: DbEmployee;
  deptColors: Record<string, string>;
  onDragStateChange: (employeeId: string | null) => void;
};

const UnassignedEmployeeItem = ({
  employee,
  deptColors,
  onDragStateChange,
}: UnassignedEmployeeItemProps) => (
  <div className="pb-1.5" style={{ height: EMPLOYEE_ITEM_HEIGHT }}>
    <DraggableEmployeeCard
      emp={employee}
      deptColors={deptColors}
      onDragStateChange={onDragStateChange}
    />
  </div>
);

export default memo(UnassignedEmployeeItem);
