import { motion } from "motion/react";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import type { DbEvaluation } from "../types";
import EvaluationKanbanCard from "./EvaluationKanbanCard";

type EvaluationKanbanColumnProps = {
  label: string;
  accent: string;
  dotColor: string;
  index: number;
  items: DbEvaluation[];
  empMap: Record<string, DbEmployee>;
  onSelect: (evaluation: DbEvaluation) => void;
};

const EvaluationKanbanColumn = ({ label, accent, dotColor, index, items, empMap, onSelect }: EvaluationKanbanColumnProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-card/20 backdrop-blur-md border ${accent} rounded-xl shadow-lg overflow-hidden`}
  >
    <div className="p-4 border-b border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-foreground" style={{ fontSize: 14 }}>{label}</span>
      </div>
      <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
        {items.length}
      </span>
    </div>
    <div className="p-3 space-y-3 min-h-[200px]">
      {items.length > 0 ? items.map((ev, i) => (
        <EvaluationKanbanCard
          key={ev.id}
          evaluation={ev}
          index={i}
          employee={empMap[ev.employee_id]}
          evaluator={ev.evaluator_id ? empMap[ev.evaluator_id] : null}
          onSelect={onSelect}
        />
      )) : (
        <EmptyState icon={ClipboardCheck} message={arabicSource("evaluation.there_are_no_reviews")} className="py-8" />
      )}
    </div>
  </motion.div>
);

export default EvaluationKanbanColumn;
