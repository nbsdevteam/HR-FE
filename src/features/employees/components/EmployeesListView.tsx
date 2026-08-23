import { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import DataTable from "@/shared/components/DataTable";
import SortableHeaderRow, { toggleSort } from "@/shared/components/SortableHeader";
import { indexBy } from "@/shared/utils/collections";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget, EmployeeSortKey } from "../types";
import EmployeesTableRow from "./EmployeesTableRow";

const EMPLOYEE_ROW_VIRTUALIZATION = { rowHeight: 61 } as const;

const EMPLOYEE_COLUMNS: ReadonlyArray<{
  label: string;
  key: EmployeeSortKey | null;
  center?: boolean;
}> = [
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
];

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
    () => indexBy(dbEmployees, (e) => e.person_id),
    [dbEmployees],
  );

  const handleSort = useCallback(
    (key: EmployeeSortKey): void => {
      toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange);
    },
    [sortBy, sortDir, onSortByChange, onSortDirChange],
  );

  const renderEmployeeRow = useCallback(
    (emp: Employee, i: number) => (
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
    ),
    [dbEmpByPersonId, pendingEmployees, deviceSyncedSet, onSelectEmployee, onDeleteTargetChange],
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
      <DataTable
        wrapperClassName={null}
        items={employees}
        header={
          <SortableHeaderRow
            columns={EMPLOYEE_COLUMNS}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        }
        renderRow={renderEmployeeRow}
        // The roster loads up to 5000 employees; only render the rows near the
        // viewport. Row height = 36px avatar + py-3 + 1px border.
        virtualization={EMPLOYEE_ROW_VIRTUALIZATION}
      />
    </motion.div>
  );
};

export default EmployeesListView;
