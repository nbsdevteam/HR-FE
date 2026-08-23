import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";
import { severityColor } from "../utils/warningsDisplay";

type TWarningKanbanCardProps = {
  warning: WarningWithEmployee;
  index: number;
  typeColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  onSelect: (warning: WarningWithEmployee) => void;
};

const WarningKanbanCard = ({
  warning,
  index,
  typeColors,
  typeSeverity,
  onSelect,
}: TWarningKanbanCardProps) => {
  const handleSelectClick = useCallback((): void => {
    onSelect(warning);
  }, [onSelect, warning]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-1.5 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: severityColor(typeSeverity, warning.type) }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-foreground truncate" style={{ fontSize: 13 }}>
            {warning.employeeName}
          </p>
          <p
            className="text-muted-foreground truncate"
            style={{ fontSize: 11 }}
          >
            {warning.employeeDepartment}
          </p>
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <span
          className={`inline-block px-2 py-0.5 rounded-md border ${typeColors[warning.type]}`}
          style={{ fontSize: 11 }}
        >
          {warning.type}
        </span>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {warning.reason}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
            {warning.issued_by || "—"}
          </span>
          <span
            className="text-muted-foreground"
            style={{ fontSize: 10 }}
            dir="ltr"
          >
            {warning.date}
          </span>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSelectClick}
          className="flex-1 py-1 text-xs rounded hover:bg-primary/20 transition-colors cursor-pointer text-primary"
        >
          {arabicSource("common.details")}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default memo(WarningKanbanCard);
