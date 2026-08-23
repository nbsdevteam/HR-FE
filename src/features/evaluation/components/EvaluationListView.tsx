import { motion } from "motion/react";
import { ClipboardCheck } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import EmptyState from "@/shared/components/EmptyState";
import SortableHeaderRow, {
  toggleSort,
} from "@/shared/components/SortableHeader";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { evaluationCardClass } from "../styles";
import { type DbEvaluation, type EvaluationSortKey } from "../types";
import EvaluationTableRow from "./EvaluationTableRow";
import { sortData } from "../data";

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
}: EvaluationListViewProps) => {
  const handleSort = (key: EvaluationSortKey): void => {
    toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange);
  };

  return (
  <motion.div
    key="list"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={evaluationCardClass}
  >
    <DataTable
      wrapperClassName={null}
      items={evaluations}
      header={
        <SortableHeaderRow
          columns={sortData}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      }
      renderRow={(evaluation, i) => (
        <EvaluationTableRow
          key={evaluation.id}
          evaluation={evaluation}
          index={i}
          employee={empMap[evaluation.employee_id]}
          evaluator={
            evaluation.evaluator_id
              ? empMap[evaluation.evaluator_id]
              : null
          }
          onSelectEvaluation={onSelectEvaluation}
        />
      )}
      emptyRow={
        <tr>
          <td colSpan={7}>
            <EmptyState
              icon={ClipboardCheck}
              message={
                allEvaluationsCount === 0
                  ? arabicSource("evaluation.there_are_no_reviews_yet")
                  : arabicSource(
                      "evaluation.there_are_no_results_matching_your_search",
                    )
              }
              hint={
                allEvaluationsCount === 0
                  ? arabicSource(
                      "evaluation.start_creating_a_new_assessment",
                    )
                  : undefined
              }
            />
          </td>
        </tr>
      }
    />
  </motion.div>
  );
};

export default EvaluationListView;
