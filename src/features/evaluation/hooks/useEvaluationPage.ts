import { useState, useEffect, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useEmployees, empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import {
  odooStatusToEvaluation,
  ratingScale,
  type DbEvalCriteria,
  type DbEvaluation,
  type EvaluationSortKey,
  type EvaluationViewMode,
} from "../types";

export const useEvaluationPage = () => {
  const { employees, loading: empLoading } = useEmployees();
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [criteria, setCriteria] = useState<DbEvalCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<DbEvaluation | null>(null);
  const [showNewEval, setShowNewEval] = useState(false);
  const [viewMode, setViewMode] = useState<EvaluationViewMode>("list");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(arabicSource("common.all"));
  const [filterCycle, setFilterCycle] = useState<string>(arabicSource("common.all"));
  const [evalSortBy, setEvalSortBy] = useState<EvaluationSortKey>("period");
  const [evalSortDir, setEvalSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { evaluations: evs, criteria: crit } = await odooData.fetchEvaluationsWithCriteria();
      setEvaluations(evs.map(e => ({ ...e, status: odooStatusToEvaluation[e.status] || e.status })) as DbEvaluation[]);
      setCriteria(crit as DbEvalCriteria[]);
    } catch (error) {
      console.error(error);
      setEvaluations([]);
      setCriteria([]);
    }
    setLoading(false);
  }, []);

  const empMap = useMemo(() => {
    const map: Record<string, DbEmployee> = {};
    employees.forEach(employee => { map[employee.id] = employee; });
    return map;
  }, [employees]);

  const filtered = useMemo(() => {
    let result = [...evaluations];
    if (filterStatus !== arabicSource("common.all")) {
      result = result.filter(evaluation => evaluation.status === filterStatus);
    }
    if (searchText) {
      result = result.filter(evaluation => {
        const employee = empMap[evaluation.employee_id];
        const name = employee ? empDisplayName(employee) : "";
        return name.includes(searchText) || evaluation.period.includes(searchText);
      });
    }
    const dir = evalSortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (evalSortBy === "employee") {
        const firstName = empMap[a.employee_id] ? empDisplayName(empMap[a.employee_id]) : "";
        const secondName = empMap[b.employee_id] ? empDisplayName(empMap[b.employee_id]) : "";
        return dir * firstName.localeCompare(secondName, "ar");
      }
      if (evalSortBy === "department") {
        const firstDepartment = empMap[a.employee_id]?.department || "";
        const secondDepartment = empMap[b.employee_id]?.department || "";
        return dir * firstDepartment.localeCompare(secondDepartment, "ar");
      }
      if (evalSortBy === "evaluator") return dir * (a.evaluator_name || "").localeCompare(b.evaluator_name || "", "ar");
      if (evalSortBy === "period") return dir * (a.period || "").localeCompare(b.period || "");
      if (evalSortBy === "rating") return dir * ((a.overall_rating || 0) - (b.overall_rating || 0));
      if (evalSortBy === "status") return dir * (a.status || "").localeCompare(b.status || "", "ar");
      return 0;
    });
    return result;
  }, [evaluations, filterStatus, searchText, empMap, evalSortBy, evalSortDir]);

  const completedEvaluations = evaluations.filter(evaluation => evaluation.status === arabicSource("common.complete"));
  const completedCount = completedEvaluations.length;
  const avgRating = completedCount > 0
    ? (completedEvaluations.filter(evaluation => evaluation.overall_rating > 0).reduce((sum, evaluation) => sum + evaluation.overall_rating, 0) / completedCount).toFixed(1)
    : "—";
  const ratingDistribution = ratingScale.map(scale => ({
    label: scale.label,
    value: evaluations.filter(evaluation => evaluation.overall_rating === scale.value && evaluation.status === arabicSource("common.complete")).length,
  }));

  const closeNewEvaluation = useCallback(() => setShowNewEval(false), []);

  const handleCreatedEvaluation = useCallback(() => {
    setShowNewEval(false);
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    avgRating,
    completedCount,
    criteria,
    empLoading,
    empMap,
    employees,
    evalSortBy,
    evalSortDir,
    evaluations,
    fetchData,
    filterCycle,
    filterStatus,
    filtered,
    handleCreatedEvaluation,
    loading,
    ratingDistribution,
    searchText,
    selectedEval,
    setEvalSortBy,
    setEvalSortDir,
    setFilterCycle,
    setFilterStatus,
    setSearchText,
    setSelectedEval,
    setShowNewEval,
    setViewMode,
    showNewEval,
    totalEvals: evaluations.length,
    inProgressCount: evaluations.filter(evaluation => evaluation.status === arabicSource("common.under_evaluation")).length,
    closeNewEvaluation,
    viewMode,
  };
};
