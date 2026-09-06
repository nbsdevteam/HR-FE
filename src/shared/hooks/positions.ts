import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { useCachedList } from "./core";
import type { GradeCode } from "./grades";

export interface DbPosition {
  id: string;
  legacy_id: string;
  title_ar: string;
  title_en: string | null;
  department_id: string | null;
  department_name: string | null;
  reports_to_position_id: string | null;
  reports_to_job_name: string | null;
  /** Reporting-tree depth, relative to a branch and computed client-side at
   *  create time (`usePositionsView.handleAddPosition`) — NOT seniority. Two
   *  positions at the same `level` can be nothing alike in rank. Use
   *  `grade_code` for company-wide seniority comparisons instead. */
  level: number;
  max_headcount: number;
  employee_count: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** Company-wide seniority grade, from `hr.job.grade_id`. `null` until the position is graded. */
  grade_id: string | null;
  grade_code: GradeCode | null;
}

export const usePositions = () => {
  const { data: positions, loading, error, refetch } = useCachedList(
    "positions",
    () => odooData.fetchPositions(),
    "Failed to load positions",
    [],
    true,
    { ttlMs: STALE_TIME.LONG },
  );
  return { positions, loading, error, refetch };
}
