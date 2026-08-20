import { memo, useMemo } from "react";
import { motion } from "motion/react";
import type { KanbanStatusCol, WarningWithEmployee } from "../types";
import WarningKanbanColumn from "./WarningKanbanColumn";

type TWarningsKanbanViewProps = {
  columns: KanbanStatusCol[];
  warnings: WarningWithEmployee[];
  typeColors: Record<string, string>;
  typeSeverity: Record<string, number>;
  onSelectWarning: (warning: WarningWithEmployee) => void;
};

const WarningsKanbanView = ({
  columns,
  warnings,
  typeColors,
  typeSeverity,
  onSelectWarning,
}: TWarningsKanbanViewProps) => {
  const warningsByStatus = useMemo(() => {
    const map = new Map<string, WarningWithEmployee[]>();
    for (const w of warnings) {
      const list = map.get(w.status);
      if (list) list.push(w);
      else map.set(w.status, [w]);
    }
    return map;
  }, [warnings]);

  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {columns.map((col, ci) => (
        <WarningKanbanColumn
          key={col.key}
          column={col}
          index={ci}
          items={warningsByStatus.get(col.key) || []}
          typeColors={typeColors}
          typeSeverity={typeSeverity}
          onSelectWarning={onSelectWarning}
        />
      ))}
    </motion.div>
  );
};

export default memo(WarningsKanbanView);
