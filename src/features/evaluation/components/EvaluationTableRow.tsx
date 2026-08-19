import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { NodeAvatar, StatusBadge } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { evaluationStatusColors, type DbEvaluation } from "../types";
import { getRatingInfo, renderStars } from "../utils/evaluationHelpers";

type EvaluationTableRowProps = {
  evaluation: DbEvaluation;
  index: number;
  employee: DbEmployee | undefined;
  evaluator: DbEmployee | null;
  onSelectEvaluation: (evaluation: DbEvaluation) => void;
};

const EvaluationTableRow = ({ evaluation, index, employee, evaluator, onSelectEvaluation }: EvaluationTableRowProps) => {
  const ratingInfo = getRatingInfo(evaluation.overall_rating);
  const handleSelect = useCallback(() => onSelectEvaluation(evaluation), [onSelectEvaluation, evaluation]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <NodeAvatar
            name={employee ? empDisplayName(employee) : "?"}
            initials={employee ? empDisplayName(employee).charAt(0) : "?"}
            sizeClassName="w-8 h-8"
            extraClassName="border border-primary/30"
            fallbackClassName="bg-primary/20"
            textClassName="text-primary"
            fontSize={12}
          />
          <span className="text-foreground">{employee ? empDisplayName(employee) : "—"}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
        {employee?.department || "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
        {evaluator ? empDisplayName(evaluator) : "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
        {evaluation.period}
      </td>
      <td className="px-4 py-3">
        {evaluation.overall_rating > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(evaluation.overall_rating)}</div>
            <StatusBadge colorClassName={ratingInfo.bgColor} fontSize={11}>{ratingInfo.label}</StatusBadge>
          </div>
        ) : (
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={evaluationStatusColors[evaluation.status] || evaluationStatusColors[arabicSource("common.did_not_start")]}>
          {evaluation.status}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSelect}
            className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer"
            title={arabicSource("common.show_details")}
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

export default memo(EvaluationTableRow);
