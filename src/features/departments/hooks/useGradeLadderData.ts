import { useMemo } from "react";
import { useGrades, useGradeSummary } from "@/shared/hooks";
import { mergeGradeLadderRows } from "../utils/gradeLadder";

/** Composes the grades reference table with the company-wide summary into the seven ladder rows. Both are cached-list hooks, so mounting this alongside another consumer of `useGrades`/`useGradeSummary` reuses the same in-flight request. */
export const useGradeLadderData = () => {
  const { grades, loading: gradesLoading, error: gradesError } = useGrades();
  const { summary, loading: summaryLoading, error: summaryError } = useGradeSummary();

  const rows = useMemo(() => mergeGradeLadderRows(grades, summary), [grades, summary]);

  return {
    rows,
    totalEmployees: summary?.total_employees ?? 0,
    loading: gradesLoading || summaryLoading,
    error: gradesError || summaryError,
  };
};
