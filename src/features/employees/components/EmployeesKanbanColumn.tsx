import { memo, useCallback } from "react";
import { KanbanColumn } from "@/shared/components";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { accentColors, deptColors, deptDots } from "../styles";
import EmployeeKanbanTile from "./EmployeeKanbanTile";

type EmployeesKanbanColumnProps = {
  dept: string;
  index: number;
  employees: Employee[];
  dbEmpByPersonId: ReadonlyMap<number, DbEmployee>;
  onSelectEmployee: (employee: Employee) => void;
};

const EmployeesKanbanColumn = ({
  dept,
  index,
  employees,
  dbEmpByPersonId,
  onSelectEmployee,
}: EmployeesKanbanColumnProps) => {
  const renderTile = useCallback(
    (emp: Employee, i: number) => (
      <EmployeeKanbanTile
        key={emp.dbId}
        emp={emp}
        index={i}
        accent={accentColors[(emp.id - 1) % accentColors.length]}
        dbEmp={dbEmpByPersonId.get(emp.id)}
        onSelectEmployee={onSelectEmployee}
      />
    ),
    [dbEmpByPersonId, onSelectEmployee],
  );

  return (
    <KanbanColumn
      label={dept}
      index={index}
      delayStep={0.08}
      accentClassName={deptColors[dept] || "border-border/40"}
      dotClassName={deptDots[dept] || "bg-primary"}
      items={employees}
      emptyMessage={arabicSource("employees.there_are_no_employees")}
      headerClassName="p-3 border-b border-border/20 flex items-center justify-between"
      labelFontSize={13}
      bodyClassName="p-3 space-y-8 min-h-[140px] pt-8 max-h-[70vh] overflow-y-auto"
      renderItem={renderTile}
    />
  );
};

export default memo(EmployeesKanbanColumn);
