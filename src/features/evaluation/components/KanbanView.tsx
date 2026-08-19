import { useMemo } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import { type DbEvaluation } from "../types";
import EvaluationKanbanColumn from "./EvaluationKanbanColumn";

const COLUMNS = [
  { key: arabicSource("common.complete"), label: arabicSource("common.complete"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  { key: arabicSource("common.under_evaluation"), label: arabicSource("common.under_evaluation"), accent: "border-primary/40", dotColor: "bg-primary" },
  { key: arabicSource("common.did_not_start"), label: arabicSource("common.did_not_start"), accent: "border-muted-foreground/40", dotColor: "bg-muted-foreground" },
];

const KanbanView = ({
  evaluations,
  empMap,
  onSelect,
}: {
  evaluations: DbEvaluation[];
  empMap: Record<string, DbEmployee>;
  onSelect: (ev: DbEvaluation) => void;
}) => {
  const evaluationsByStatus = useMemo(() => {
    const map = new Map<string, DbEvaluation[]>();
    for (const ev of evaluations) {
      const bucket = map.get(ev.status);
      if (bucket) bucket.push(ev);
      else map.set(ev.status, [ev]);
    }
    return map;
  }, [evaluations]);

  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {COLUMNS.map((col, ci) => (
        <EvaluationKanbanColumn
          key={col.key}
          label={col.label}
          accent={col.accent}
          dotColor={col.dotColor}
          index={ci}
          items={evaluationsByStatus.get(col.key) || []}
          empMap={empMap}
          onSelect={onSelect}
        />
      ))}
    </motion.div>
  );
};

export default KanbanView;
