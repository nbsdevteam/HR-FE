import { motion } from "motion/react";
import { Calendar, Clock, UserCheck, UserX } from "lucide-react";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow, AttendanceSortKey, AttendanceViewMode, ExcuseForm } from "@/features/attendance/types";
import { AttendanceKanbanCard } from "./AttendanceKanbanCard";
import { AttendanceTableRow } from "./AttendanceTableRow";
import { memo } from "react";

type AttendanceRecordsViewProps = {
  viewMode: AttendanceViewMode;
  attendanceRows: AttendanceRow[];
  sortBy: AttendanceSortKey;
  sortDir: "asc" | "desc";
  setSortBy: (value: AttendanceSortKey) => void;
  setSortDir: (value: "asc" | "desc") => void;
  setSelectedEmployeeId: (value: string) => void;
  setExcuseForm: (value: ExcuseForm | ((current: ExcuseForm) => ExcuseForm)) => void;
  setExcuseModal: (value: { record: AttendanceRow } | null) => void;
};

const kanbanColumns = [
  { key: arabicSource("common.present"), label: arabicSource("common.present"), accent: "border-emerald-500/40", textColor: "text-emerald-500", icon: UserCheck },
  { key: arabicSource("common.late"), label: arabicSource("common.late"), accent: "border-primary/40", textColor: "text-primary", icon: Clock },
  { key: arabicSource("common.absent"), label: arabicSource("common.absent"), accent: "border-destructive/40", textColor: "text-destructive", icon: UserX },
  { key: arabicSource("common.leave"), label: arabicSource("common.leave"), accent: "border-blue-500/40", textColor: "text-blue-500", icon: Calendar },
];

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
  const openExcuse = (record: AttendanceRow, form: ExcuseForm) => {
    setExcuseForm(form);
    setExcuseModal({ record });
  };

  if (viewMode === "kanban") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex gap-3">
        {kanbanColumns.map((column, columnIndex) => {
          const items = attendanceRows.filter((row) => row.status === column.key);
          const ColumnIcon = column.icon;

          if (items.length === 0) {
            return (
              <motion.div
                key={column.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: columnIndex * 0.08 }}
                className={`bg-card/10 backdrop-blur-md border ${column.accent} rounded-xl overflow-hidden flex flex-col items-center py-5 px-2 gap-3`}
                style={{ minWidth: 56, maxWidth: 64 }}
              >
                <ColumnIcon className={`w-4 h-4 ${column.textColor} opacity-40`} />
                <span className="text-muted-foreground/40 font-medium" style={{ fontSize: 11, writingMode: "vertical-rl" }}>{column.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground/40 font-mono" style={{ fontSize: 11 }}>0</span>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={column.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.08 }}
              className={`bg-card/20 backdrop-blur-md border ${column.accent} rounded-xl shadow-lg overflow-hidden flex-1`}
              style={{ minWidth: 0 }}
            >
              <div className="p-4 border-b border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ColumnIcon className={`w-4 h-4 ${column.textColor}`} />
                  <span className="text-foreground" style={{ fontSize: 14 }}>{column.label}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-mono" style={{ fontSize: 12 }}>{items.length}</span>
              </div>
              <div className="p-3 space-y-2.5 max-h-[500px] overflow-y-auto">
                {items.map((record, index) => (
                  <AttendanceKanbanCard key={record.id} record={record} index={index} onSelectEmployee={setSelectedEmployeeId} />
                ))}
              </div>
            </motion.div>
          );
        })}
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <SortableHeaderRow
              columns={[
                { label: arabicSource("common.employee"), key: "name" },
                { label: arabicSource("common.fingerprint_number"), key: "deviceNo", center: true },
                { label: arabicSource("common.section"), key: "department" },
                { label: arabicSource("common.attendance"), key: "checkIn", center: true },
                { label: arabicSource("common.dismissal"), key: "checkOut", center: true },
                { label: arabicSource("common.working_hours"), key: "hours", center: true },
                { label: arabicSource("common.source"), key: null },
                { label: arabicSource("common.status"), key: "status" },
              ]}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={(key) => toggleSort(key, sortBy, sortDir, setSortBy, setSortDir)}
            />
          </thead>
          <tbody>
            {attendanceRows.length > 0 ? attendanceRows.map((record, index) => (
              <AttendanceTableRow
                key={record.id}
                record={record}
                index={index}
                onSelectEmployee={setSelectedEmployeeId}
                onOpenExcuse={openExcuse}
              />
            )) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  {arabicSource("attendance.there_are_no_attendance_records_for_this_date")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default memo(AttendanceRecordsView);