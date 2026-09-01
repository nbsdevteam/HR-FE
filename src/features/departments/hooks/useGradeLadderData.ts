import { useMemo } from "react";
import { useGrades, useGradeSummary } from "@/shared/hooks";
import { mergeGradeLadderRows } from "../utils/gradeLadder";

const EMPTY_UNGRADED = { titles: [], employee_count: 0, seats: 0 };

/** Composes the grades reference table with the company-wide summary into the seven ladder rows, and surfaces the envelope's three populations (seats, graded staff, unassigned staff) so views never reach into `summary` themselves. Both are cached-list hooks, so mounting this alongside another consumer of `useGrades`/`useGradeSummary` reuses the same in-flight request. */
export const useGradeLadderData = () => {
  const { grades, loading: gradesLoading, error: gradesError } = useGrades();
  const { summary, loading: summaryLoading, error: summaryError } = useGradeSummary();

  const rows = useMemo(() => mergeGradeLadderRows(grades, summary), [grades, summary]);

  return {
    rows,
    departments: summary?.departments ?? [],
    totalSeats: summary?.total_seats ?? 0,
    gradedEmployees: summary?.graded_employees ?? 0,
    unassignedEmployees: summary?.unassigned_employees ?? 0,
    totalEmployees: summary?.total_employees ?? 0,
    ungraded: summary?.ungraded ?? EMPTY_UNGRADED,
    loading: gradesLoading || summaryLoading,
    error: gradesError || summaryError,
  };
};
