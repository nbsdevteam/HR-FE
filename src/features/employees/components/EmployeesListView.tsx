import { useMemo } from "react";
import { motion } from "motion/react";
import SortableHeaderRow, { toggleSort } from "@/shared/components/SortableHeader";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget, EmployeeSortKey } from "../types";
import EmployeesTableRow from "./EmployeesTableRow";

type EmployeesListViewProps = {
  employees: Employee[];
  dbEmployees: DbEmployee[];
  deviceSyncedSet: Set<number>;
  pendingEmployees: Set<number>;
  sortBy: EmployeeSortKey;
  sortDir: "asc" | "desc";
  onSortByChange: (sortBy: EmployeeSortKey) => void;
  onSortDirChange: (sortDir: "asc" | "desc") => void;
  onSelectEmployee: (employee: Employee) => void;
  onDeleteTargetChange: (target: DeleteEmployeeTarget) => void;
};

const EmployeesListView = ({
  employees,
  dbEmployees,
  deviceSyncedSet,
  pendingEmployees,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  onSelectEmployee,
  onDeleteTargetChange,
}: EmployeesListViewProps) => {
  const dbEmpByPersonId = useMemo(
    () => new Map(dbEmployees.map((e) => [e.person_id, e])),
    [dbEmployees],
  );

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <SortableHeaderRow
              columns={[
                { label: arabicSource("common.employee"), key: "name" },
                { label: arabicSource("common.job_number"), key: "employeeNumber" },
                { label: arabicSource("common.fingerprint_number"), key: "deviceNo", center: true },
                { label: arabicSource("common.section"), key: "department" },
                { label: arabicSource("common.position"), key: "position" },
                { label: arabicSource("common.status"), key: "status" },
                { label: arabicSource("common.footprint"), key: null },
                { label: arabicSource("common.direct_date"), key: "joinDate" },
                { label: arabicSource("common.salary"), key: "salary" },
                { label: arabicSource("common.procedures"), key: null },
              ]}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={(key) => toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)}
            />
          </thead>
          <tbody>
            {employees.map((emp, i) => (
              <EmployeesTableRow
                key={emp.dbId}
                emp={emp}
                dbEmp={dbEmpByPersonId.get(emp.id)}
                index={i}
                isPending={pendingEmployees.has(emp.id)}
                isDeviceSynced={deviceSyncedSet.has(emp.id)}
                onSelectEmployee={onSelectEmployee}
                onDeleteTargetChange={onDeleteTargetChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default EmployeesListView;
