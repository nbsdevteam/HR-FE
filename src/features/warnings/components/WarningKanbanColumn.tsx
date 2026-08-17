import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import type { KanbanStatusCol, WarningWithEmployee } from "../types";
import { arabicSource } from "@/i18n/source";
import WarningKanbanCard from "./WarningKanbanCard";

type WarningKanbanColumnProps = {
  column: KanbanStatusCol;
  index: number;
  items: WarningWithEmployee[];
  typeColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  onSelectWarning: (warning: WarningWithEmployee) => void;
};

const WarningKanbanColumn = ({ column, index, items, typeColors, typeSeverity, onSelectWarning }: WarningKanbanColumnProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-card/20 backdrop-blur-md border ${column.accent} rounded-xl shadow-lg overflow-hidden`}
  >
    <div className="p-4 border-b border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
        <span className="text-foreground" style={{ fontSize: 14 }}>{column.label}</span>
      </div>
      <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
        {items.length}
      </span>
    </div>
    <div className="p-3 space-y-3 min-h-[200px]">
      {items.length > 0 ? items.map((w, i) => (
        <WarningKanbanCard
          key={w.id}
          warning={w}
          index={i}
          typeColors={typeColors}
          typeSeverity={typeSeverity}
          onSelect={() => onSelectWarning(w)}
        />
      )) : (
        <EmptyState icon={ShieldAlert} message={arabicSource("common.no_alarms")} className="py-8" />
      )}
    </div>
  </motion.div>
);

export default WarningKanbanColumn;
