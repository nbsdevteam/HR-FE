import { useMemo } from "react";
import { motion } from "motion/react";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import EmployeesKanbanColumn from "./EmployeesKanbanColumn";

type EmployeesKanbanViewProps = {
  departments: string[];
  employees: Employee[];
  dbEmployees: DbEmployee[];
  selectedDept: string;
  onSelectEmployee: (employee: Employee) => void;
};

const EmployeesKanbanView = ({
  departments,
  employees,
  dbEmployees,
  selectedDept,
  onSelectEmployee,
}: EmployeesKanbanViewProps) => {
  const employeesByDept = useMemo(() => {
    const map = new Map<string, Employee[]>();
    for (const emp of employees) {
      const bucket = map.get(emp.department);
      if (bucket) bucket.push(emp);
      else map.set(emp.department, [emp]);
    }
    return map;
  }, [employees]);

  const dbEmpByPersonId = useMemo(
    () => new Map(dbEmployees.map((e) => [e.person_id, e])),
    [dbEmployees],
  );

  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
    >
      {departments.map((dept, ci) => {
        if (selectedDept !== arabicSource("common.all") && selectedDept !== dept) return null;

        return (
          <EmployeesKanbanColumn
            key={dept}
            dept={dept}
            index={ci}
            items={employeesByDept.get(dept) || []}
            dbEmpByPersonId={dbEmpByPersonId}
            onSelectEmployee={onSelectEmployee}
          />
        );
      })}
    </motion.div>
  );
};

export default EmployeesKanbanView;
