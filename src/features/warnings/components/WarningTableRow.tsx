import { memo } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";
import { severityColor } from "../utils/warningsDisplay";

type TWarningTableRowProps = {
  warning: WarningWithEmployee;
  index: number;
  typeColors: Record<string, string>;
  statusColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  duplicateCount: number;
  onSelect: (warning: WarningWithEmployee) => void;
};

const WarningTableRow = ({
  warning,
  index,
  typeColors,
  statusColors,
  typeSeverity,
  duplicateCount,
  onSelect,
}: TWarningTableRowProps) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-8 rounded-full"
          style={{ backgroundColor: severityColor(typeSeverity, warning.type) }}
        />
        <div>
          <span className="text-foreground">{warning.employeeName}</span>
          {duplicateCount > 1 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded">
              {duplicateCount} {arabicSource("common.alarms_2")}
            </span>
          )}
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
      {warning.employeeDepartment}
    </td>
    <td className="px-4 py-3">
      <span
        className={`px-2 py-0.5 rounded-md border ${typeColors[warning.type]}`}
        style={{ fontSize: 12 }}
      >
        {warning.type}
      </span>
    </td>
    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
      {warning.reason}
    </td>
    <td
      className="px-4 py-3 text-muted-foreground"
      style={{ fontSize: 13 }}
      dir="ltr"
    >
      {warning.date}
    </td>
    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
      {warning.issued_by || "—"}
    </td>
    <td className="px-4 py-3">
      <span
        className={`px-2 py-0.5 rounded-md border ${statusColors[warning.status]}`}
        style={{ fontSize: 12 }}
      >
        {warning.status}
      </span>
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(warning)}
          className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer"
          title={arabicSource("common.show_details")}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </td>
  </motion.tr>
);

export default memo(WarningTableRow);
