import { useMemo } from "react";
import { motion } from "motion/react";
import { groupBy, indexBy } from "@/shared/utils/collections";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import EmployeesKanbanColumn from "./EmployeesKanbanColumn";

const EMPTY_COLUMN: Employee[] = [];

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
  const employeesByDept = useMemo(
    () => groupBy(employees, (emp) => emp.department),
    [employees],
  );

  const dbEmpByPersonId = useMemo(
    () => indexBy(dbEmployees, (e) => e.person_id),
    [dbEmployees],
  );

  /** Filter up front so the grid never renders `null` placeholder children. */
  const visibleDepartments = useMemo(
    () => (selectedDept === arabicSource("common.all")
      ? departments
      : departments.filter((dept) => dept === selectedDept)),
    [departments, selectedDept],
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
      {visibleDepartments.map((dept, ci) => (
        <EmployeesKanbanColumn
          key={dept}
          dept={dept}
          index={ci}
          employees={employeesByDept.get(dept) || EMPTY_COLUMN}
          dbEmpByPersonId={dbEmpByPersonId}
          onSelectEmployee={onSelectEmployee}
        />
      ))}
    </motion.div>
  );
};

export default EmployeesKanbanView;
