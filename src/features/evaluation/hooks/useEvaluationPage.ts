import { useState, useEffect, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { useEmployeeAvatars, useEmployees } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import {
  odooStatusToEvaluation,
  type DbEvalCriteria,
  type DbEvaluation,
  type EvaluationSortKey,
  type EvaluationViewMode,
} from "../types";
import {
  buildEmployeeSortKeys,
  computeEvaluationStats,
  filterEvaluations,
  sortEvaluations,
} from "../utils/evaluationList";

export const useEvaluationPage = () => {
  // NOTE: this page is deliberately NOT on `useAsyncList`. That hook owns a
  // single `T[]`, while `fetchEvaluationsWithCriteria` returns two different
  // lists from one round-trip (and remaps every status on the way in), so
  // wrapping it would need two hooks and two requests.
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [criteria, setCriteria] = useState<DbEvalCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<DbEvaluation | null>(null);
  const [showNewEval, setShowNewEval] = useState(false);
  const [viewMode, setViewMode] = useState<EvaluationViewMode>("list");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(arabicSource("common.all"));
  const [evalSortBy, setEvalSortBy] = useState<EvaluationSortKey>("period");
  const [evalSortDir, setEvalSortDir] = useState<"asc" | "desc">("desc");

  const { employees, loading: empLoading } = useEmployees();

  // `/employees/list` (what `useEmployees` reads through) never carries a
  // photo — batch-fetch it for the roster this page renders.
  const employeeIds = useMemo(() => employees.map(employee => employee.id), [employees]);
  const { avatars } = useEmployeeAvatars(employeeIds);
  const employeesWithAvatars = useMemo(
    () => employees.map(employee => (employee.id in avatars ? { ...employee, profile_picture: avatars[employee.id] } : employee)),
    [employees, avatars],
  );

  const empMap = useMemo(() => {
    const map: Record<string, DbEmployee> = {};
    employeesWithAvatars.forEach(employee => { map[employee.id] = employee; });
    return map;
  }, [employeesWithAvatars]);

  const employeeSortKeys = useMemo(() => buildEmployeeSortKeys(empMap), [empMap]);

  const filtered = useMemo(() => {
    const matches = filterEvaluations(evaluations, filterStatus, searchText, employeeSortKeys);
    return sortEvaluations(matches, evalSortBy, evalSortDir, employeeSortKeys);
  }, [evaluations, filterStatus, searchText, employeeSortKeys, evalSortBy, evalSortDir]);

  const { completedCount, avgRating, ratingDistribution, inProgressCount } = useMemo(
    () => computeEvaluationStats(evaluations),
    [evaluations],
  );

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
    employees: employeesWithAvatars,
    evalSortBy,
    evalSortDir,
    evaluations,
    fetchData,
    filterStatus,
    filtered,
    handleCreatedEvaluation,
    loading,
    ratingDistribution,
    searchText,
    selectedEval,
    setEvalSortBy,
    setEvalSortDir,
    setFilterStatus,
    setSearchText,
    setSelectedEval,
    setShowNewEval,
    setViewMode,
    showNewEval,
    totalEvals: evaluations.length,
    inProgressCount,
    closeNewEvaluation,
    viewMode,
  };
};
