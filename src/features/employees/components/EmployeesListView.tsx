import { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Users } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import EmptyState from "@/shared/components/EmptyState";
import Pagination from "@/shared/components/Pagination";
import SortableHeaderRow, { toggleSort } from "@/shared/components/SortableHeader";
import { indexBy } from "@/shared/utils/collections";
import type { Employee } from "@/features/employees";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { DeleteEmployeeTarget, EmployeeSortKey } from "../types";
import EmployeesTableRow from "./EmployeesTableRow";

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
  /** 1-based page number echoed back by the backend (backend §2). */
  page: number;
  totalPages: number;
  /** Matching rows across every page, not just the one rendered. */
  total: number;
  perPage: number;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onSortByChange: (sortBy: EmployeeSortKey) => void;
  onSortDirChange: (sortDir: "asc" | "desc") => void;
  onSelectEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteTargetChange: (target: DeleteEmployeeTarget) => void;
};

const EmployeesListView = ({
  employees,
  dbEmployees,
  deviceSyncedSet,
  pendingEmployees,
  sortBy,
  sortDir,
  page,
  totalPages,
  total,
  perPage,
  loading,
  error,
  onPageChange,
  onPerPageChange,
  onSortByChange,
  onSortDirChange,
  onSelectEmployee,
  onEditEmployee,
  onDeleteTargetChange,
}: EmployeesListViewProps) => {
  const dbEmpByPersonId = useMemo(
    () => indexBy(dbEmployees, (e) => e.person_id),
    [dbEmployees],
  );

  const emptyRow = useMemo(
    () => (
      <tr>
        <td colSpan={EMPLOYEE_COLUMNS.length}>
          {error ? (
            <EmptyState icon={AlertTriangle} message={error} />
          ) : (
            <EmptyState
              icon={Users}
              message={arabicSource("employees.there_are_no_employees")}
              hint={arabicSource("common.no_results_found")}
            />
          )}
        </td>
      </tr>
    ),
    [error],
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
        onEditEmployee={onEditEmployee}
        onDeleteTargetChange={onDeleteTargetChange}
      />
    ),
    [dbEmpByPersonId, pendingEmployees, deviceSyncedSet, onSelectEmployee, onEditEmployee, onDeleteTargetChange],
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
      {/* Dimmed rather than swapped for a spinner, so the table does not
          collapse and re-expand on every page step. */}
      <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"} aria-busy={loading}>
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
          emptyRow={emptyRow}
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        loading={loading}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </motion.div>
  );
};

export default EmployeesListView;
