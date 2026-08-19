import { motion } from "motion/react";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { accentColors, deptColors, deptDots } from "../styles";
import EmployeeKanbanTile from "./EmployeeKanbanTile";

type EmployeesKanbanColumnProps = {
  dept: string;
  index: number;
  items: Employee[];
  dbEmpByPersonId: Map<number, DbEmployee>;
  onSelectEmployee: (employee: Employee) => void;
};

const EmployeesKanbanColumn = ({ dept, index, items, dbEmpByPersonId, onSelectEmployee }: EmployeesKanbanColumnProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className={`bg-card/20 backdrop-blur-md border ${deptColors[dept] || "border-border/40"} rounded-xl shadow-lg overflow-hidden`}
  >
    <div className="p-3 border-b border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${deptDots[dept] || "bg-primary"}`} />
        <span className="text-foreground" style={{ fontSize: 13 }}>{dept}</span>
      </div>
      <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
        {items.length}
      </span>
    </div>
    <div className="p-3 space-y-8 min-h-[140px] pt-8">
      {items.length > 0 ? items.map((emp, i) => (
        <EmployeeKanbanTile
          key={emp.dbId}
          emp={emp}
          index={i}
          accent={accentColors[(emp.id - 1) % accentColors.length]}
          dbEmp={dbEmpByPersonId.get(emp.id)}
          onSelectEmployee={onSelectEmployee}
        />
      )) : (
        <div className="flex items-center justify-center h-[80px] text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("employees.there_are_no_employees")}</div>
      )}
    </div>
  </motion.div>
);

export default EmployeesKanbanColumn;
