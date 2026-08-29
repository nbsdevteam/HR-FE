import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { AttendanceRow } from "@/features/attendance/types";
import AttendanceKanbanCard from "./AttendanceKanbanCard";

export type AttendanceKanbanColumnDef = {
  key: string;
  label: string;
  accent: string;
  textColor: string;
  icon: LucideIcon;
};

type AttendanceKanbanColumnProps = {
  column: AttendanceKanbanColumnDef;
  columnIndex: number;
  records: AttendanceRow[];
  onSelectEmployee: (employeeId: string) => void;
};

/**
 * One status column of the attendance board. The shared `KanbanColumn` cannot
 * express the collapsed vertical-strip state this board uses for empty columns,
 * so the layout stays local to the feature.
 */
const AttendanceKanbanColumn = ({
  column,
  columnIndex,
  records,
  onSelectEmployee,
}: AttendanceKanbanColumnProps) => {
  const ColumnIcon = column.icon;

  if (records.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: columnIndex * 0.08 }}
        className={`bg-card/10 backdrop-blur-md border ${column.accent} rounded-xl overflow-hidden flex flex-col items-center py-5 px-2 gap-3`}
        style={{ minWidth: 56, maxWidth: 64 }}
      >
        <ColumnIcon className={`w-4 h-4 ${column.textColor} opacity-40`} />
        <span
          className="text-muted-foreground/40 font-medium"
          style={{ fontSize: 11, writingMode: "vertical-rl" }}
        >
          {column.label}
        </span>
        <span
          className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground/40 font-mono"
          style={{ fontSize: 11 }}
        >
          0
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: columnIndex * 0.08 }}
      className={`bg-card/20 backdrop-blur-md border ${column.accent} rounded-xl shadow-lg overflow-hidden flex-1`}
      style={{ minWidth: 0 }}
    >
      <div className="p-4 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ColumnIcon className={`w-4 h-4 ${column.textColor}`} />
          <span className="text-foreground" style={{ fontSize: 14 }}>
            {column.label}
          </span>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-mono"
          style={{ fontSize: 12 }}
        >
          {records.length}
        </span>
      </div>
      <div className="p-3 space-y-2.5 max-h-[500px] overflow-y-auto">
        {records.map((record, index) => (
          <AttendanceKanbanCard
            key={record.id}
            record={record}
            index={index}
            onSelectEmployee={onSelectEmployee}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AttendanceKanbanColumn;
