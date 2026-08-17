import { motion } from "motion/react";
import { ClipboardCheck, Eye } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { evaluationCardClass } from "../styles";
import { evaluationStatusColors, type DbEvaluation, type EvaluationSortKey } from "../types";
import { getRatingInfo, renderStars } from "../utils/evaluationHelpers";

type EvaluationListViewProps = {
  evaluations: DbEvaluation[];
  allEvaluationsCount: number;
  empMap: Record<string, DbEmployee>;
  sortBy: EvaluationSortKey;
  sortDir: "asc" | "desc";
  onSortByChange: (sortBy: EvaluationSortKey) => void;
  onSortDirChange: (sortDir: "asc" | "desc") => void;
  onSelectEvaluation: (evaluation: DbEvaluation) => void;
};

const EvaluationListView = ({
  evaluations,
  allEvaluationsCount,
  empMap,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  onSelectEvaluation,
}: EvaluationListViewProps) => (
  <motion.div
    key="list"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={evaluationCardClass}
  >
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <SortableHeaderRow
            columns={[
              { label: arabicSource("common.employee"), key: "employee" },
              { label: arabicSource("common.section"), key: "department" },
              { label: arabicSource("evaluation.assessor_2"), key: "evaluator" },
              { label: arabicSource("common.period"), key: "period" },
              { label: arabicSource("common.evaluation"), key: "rating" },
              { label: arabicSource("common.status"), key: "status" },
              { label: arabicSource("common.procedures"), key: null },
            ]}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={(key) => toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)}
          />
        </thead>
        <tbody>
          {evaluations.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={ClipboardCheck}
                  message={allEvaluationsCount === 0 ? arabicSource("evaluation.there_are_no_reviews_yet") : arabicSource("evaluation.there_are_no_results_matching_your_search")}
                  hint={allEvaluationsCount === 0 ? arabicSource("evaluation.start_creating_a_new_assessment") : undefined}
                />
              </td>
            </tr>
          ) : evaluations.map((evaluation, i) => {
            const employee = empMap[evaluation.employee_id];
            const evaluator = evaluation.evaluator_id ? empMap[evaluation.evaluator_id] : null;
            const ratingInfo = getRatingInfo(evaluation.overall_rating);
            return (
              <motion.tr
                key={evaluation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-primary" style={{ fontSize: 12 }}>
                        {employee ? empDisplayName(employee).charAt(0) : "?"}
                      </span>
                    </div>
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
                      <span className={`px-2 py-0.5 rounded-md border ${ratingInfo.bgColor}`} style={{ fontSize: 11 }}>
                        {ratingInfo.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground" style={{ fontSize: 13 }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md border ${evaluationStatusColors[evaluation.status] || evaluationStatusColors[arabicSource("common.did_not_start")]}`} style={{ fontSize: 12 }}>
                    {evaluation.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectEvaluation(evaluation)}
                      className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer"
                      title={arabicSource("common.show_details")}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </motion.div>
);

export default EvaluationListView;
