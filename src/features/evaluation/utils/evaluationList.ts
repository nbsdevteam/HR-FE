import { arabicSource } from "@/i18n/source";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { ratingScale, type DbEvaluation, type EvaluationSortKey } from "../types";

/** Employee-derived sort/search keys, resolved once instead of per comparison. */
export type EmployeeSortKeys = {
  names: Record<string, string>;
  departments: Record<string, string>;
};

/**
 * `empDisplayName` runs two regexes per call, so calling it inside a comparator
 * cost O(n log n) evaluations. Resolve every employee once up front instead.
 */
export const buildEmployeeSortKeys = (empMap: Record<string, DbEmployee>): EmployeeSortKeys => {
  const names: Record<string, string> = {};
  const departments: Record<string, string> = {};
  for (const [id, employee] of Object.entries(empMap)) {
    names[id] = empDisplayName(employee);
    departments[id] = employee.department || "";
  }
  return { names, departments };
};

export const filterEvaluations = (
  evaluations: DbEvaluation[],
  filterStatus: string,
  searchText: string,
  keys: EmployeeSortKeys,
): DbEvaluation[] => {
  const allLabel = arabicSource("common.all");
  return evaluations.filter((evaluation) => {
    if (filterStatus !== allLabel && evaluation.status !== filterStatus) return false;
    if (!searchText) return true;
    const name = keys.names[evaluation.employee_id] || "";
    return name.includes(searchText) || evaluation.period.includes(searchText);
  });
};

/** Sorts in place — callers hand over an array they already own. */
export const sortEvaluations = (
  evaluations: DbEvaluation[],
  sortBy: EvaluationSortKey,
  sortDir: "asc" | "desc",
  keys: EmployeeSortKeys,
): DbEvaluation[] => {
  const dir = sortDir === "asc" ? 1 : -1;
  return evaluations.sort((a, b) => {
    if (sortBy === "employee") {
      return dir * (keys.names[a.employee_id] || "").localeCompare(keys.names[b.employee_id] || "", "ar");
    }
    if (sortBy === "department") {
      return dir * (keys.departments[a.employee_id] || "").localeCompare(keys.departments[b.employee_id] || "", "ar");
    }
    if (sortBy === "evaluator") {
      return dir * (a.evaluator_name || "").localeCompare(b.evaluator_name || "", "ar");
    }
    if (sortBy === "period") return dir * (a.period || "").localeCompare(b.period || "");
    if (sortBy === "rating") return dir * ((a.overall_rating || 0) - (b.overall_rating || 0));
    if (sortBy === "status") return dir * (a.status || "").localeCompare(b.status || "", "ar");
    return 0;
  });
};

export type EvaluationStats = {
  completedCount: number;
  avgRating: string;
  ratingDistribution: { label: string; value: number }[];
  inProgressCount: number;
};

/**
 * One pass instead of `4 + ratingScale.length` full scans — the rating
 * distribution alone re-walked every evaluation once per scale point.
 */
export const computeEvaluationStats = (evaluations: DbEvaluation[]): EvaluationStats => {
  const completeLabel = arabicSource("common.complete");
  const inProgressLabel = arabicSource("common.under_evaluation");

  let completedCount = 0;
  let inProgressCount = 0;
  let completedRatingSum = 0;
  const completedByRating = new Map<number, number>();

  for (const evaluation of evaluations) {
    if (evaluation.status === inProgressLabel) inProgressCount += 1;
    if (evaluation.status !== completeLabel) continue;
    completedCount += 1;
    if (evaluation.overall_rating > 0) completedRatingSum += evaluation.overall_rating;
    completedByRating.set(evaluation.overall_rating, (completedByRating.get(evaluation.overall_rating) ?? 0) + 1);
  }

  return {
    completedCount,
    avgRating: completedCount > 0 ? (completedRatingSum / completedCount).toFixed(1) : "—",
    ratingDistribution: ratingScale.map((scale) => ({
      label: scale.label,
      value: completedByRating.get(scale.value) ?? 0,
    })),
    inProgressCount,
  };
};
