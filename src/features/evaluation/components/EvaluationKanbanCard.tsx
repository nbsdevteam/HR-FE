import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { NodeAvatar, StatusBadge } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { DbEvaluation } from "../types";
import { getRatingInfo, renderStars } from "../utils/evaluationHelpers";

type EvaluationKanbanCardProps = {
  evaluation: DbEvaluation;
  index: number;
  employee: DbEmployee | undefined;
  evaluator: DbEmployee | null;
  onSelect: (evaluation: DbEvaluation) => void;
};

const EvaluationKanbanCard = ({ evaluation, index, employee, evaluator, onSelect }: EvaluationKanbanCardProps) => {
  const ratingInfo = getRatingInfo(evaluation.overall_rating);
  const handleSelect = useCallback(() => onSelect(evaluation), [onSelect, evaluation]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={handleSelect}
      className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-2">
        <NodeAvatar
          name={employee ? empDisplayName(employee) : "?"}
          initials={employee ? empDisplayName(employee).charAt(0) : "?"}
          sizeClassName="w-8 h-8"
          extraClassName="border border-primary/30"
          fallbackClassName="bg-primary/20"
          textClassName="text-primary"
          fontSize={12}
        />
        <div className="flex-1 min-w-0">
          <p className="text-foreground truncate" style={{ fontSize: 13 }}>{employee ? empDisplayName(employee) : "—"}</p>
          <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{employee?.department || ""}</p>
        </div>
      </div>
      {evaluation.overall_rating > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">{renderStars(evaluation.overall_rating, 14)}</div>
          <StatusBadge colorClassName={ratingInfo.bgColor} fontSize={10} extraClassName="inline-block">{ratingInfo.label}</StatusBadge>
        </div>
      ) : (
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("evaluation.not_evaluated_yet")}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-muted-foreground" style={{ fontSize: 10 }}>
          {evaluator ? empDisplayName(evaluator) : "—"}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: 10 }}>{evaluation.period}</span>
      </div>
    </motion.div>
  );
};

export default memo(EvaluationKanbanCard);
