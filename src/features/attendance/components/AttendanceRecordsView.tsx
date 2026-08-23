import { memo, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import DataTable from "@/shared/components/DataTable";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import { groupBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";
import type {
  AttendanceRow,
  AttendanceSortKey,
  AttendanceViewMode,
  ExcuseForm,
} from "@/features/attendance/types";
import AttendanceKanbanColumn from "./AttendanceKanbanColumn";
import AttendanceTableRow from "./AttendanceTableRow";
import { kanbanColumns } from "../data";

type AttendanceRecordsViewProps = {
  viewMode: AttendanceViewMode;
  attendanceRows: AttendanceRow[];
  sortBy: AttendanceSortKey;
  sortDir: "asc" | "desc";
  setSortBy: (value: AttendanceSortKey) => void;
  setSortDir: (value: "asc" | "desc") => void;
  setSelectedEmployeeId: (value: string) => void;
  setExcuseForm: (
    value: ExcuseForm | ((current: ExcuseForm) => ExcuseForm),
  ) => void;
  setExcuseModal: (value: { record: AttendanceRow } | null) => void;
};

const TABLE_COLUMNS: ReadonlyArray<{
  label: string;
  key: AttendanceSortKey | null;
  center?: boolean;
}> = [
  { label: arabicSource("common.employee"), key: "name" },
  {
    label: arabicSource("common.fingerprint_number"),
    key: "deviceNo",
    center: true,
  },
  { label: arabicSource("common.section"), key: "department" },
  { label: arabicSource("common.attendance"), key: "checkIn", center: true },
  { label: arabicSource("common.dismissal"), key: "checkOut", center: true },
  { label: arabicSource("common.working_hours"), key: "hours", center: true },
  { label: arabicSource("common.source"), key: null },
  { label: arabicSource("common.status"), key: "status" },
];

const EMPTY_ROW = (
  <tr>
    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
      {arabicSource("attendance.there_are_no_attendance_records_for_this_date")}
    </td>
  </tr>
);

/** Shared identity for columns with no records, so memoised children stay stable. */
const NO_ROWS: AttendanceRow[] = [];

const AttendanceRecordsView = ({
  viewMode,
  attendanceRows,
  sortBy,
  sortDir,
  setSortBy,
  setSortDir,
  setSelectedEmployeeId,
  setExcuseForm,
  setExcuseModal,
}: AttendanceRecordsViewProps) => {
  // One bucketing pass instead of re-filtering the whole list per kanban column.
  const rowsByStatus = useMemo(
    () => groupBy(attendanceRows, (row) => row.status),
    [attendanceRows],
  );

  const openExcuse = useCallback(
    (record: AttendanceRow, form: ExcuseForm) => {
      setExcuseForm(form);
      setExcuseModal({ record });
    },
    [setExcuseForm, setExcuseModal],
  );

  const handleSort = useCallback(
    (key: AttendanceSortKey): void => {
      toggleSort(key, sortBy, sortDir, setSortBy, setSortDir);
    },
    [sortBy, sortDir, setSortBy, setSortDir],
  );

  const renderRow = useCallback(
    (record: AttendanceRow, index: number) => (
      <AttendanceTableRow
        key={record.id}
        record={record}
        index={index}
        onSelectEmployee={setSelectedEmployeeId}
        onOpenExcuse={openExcuse}
      />
    ),
    [setSelectedEmployeeId, openExcuse],
  );

  if (viewMode === "kanban") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3"
      >
        {kanbanColumns.map((column, columnIndex) => (
          <AttendanceKanbanColumn
            key={column.key}
            column={column}
            columnIndex={columnIndex}
            records={rowsByStatus.get(column.key) ?? NO_ROWS}
            onSelectEmployee={setSelectedEmployeeId}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
    >
      <DataTable
        wrapperClassName={null}
        items={attendanceRows}
        header={
          <SortableHeaderRow
            columns={TABLE_COLUMNS}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        }
        renderRow={renderRow}
        emptyRow={EMPTY_ROW}
      />
    </motion.div>
  );
};

export default memo(AttendanceRecordsView);
