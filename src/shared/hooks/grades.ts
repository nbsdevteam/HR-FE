import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

export type GradeCode = "E" | "1" | "2" | "3" | "4" | "5" | "S";
export type GradeBand = "leadership" | "middle" | "delivery";

/** One row of the `hr.grade` reference table (backend §3.1) — seeded once, rarely edited. */
export interface DbGrade {
  id: string;
  code: GradeCode;
  sequence: number;
  name: string;
  name_ar: string;
  band: GradeBand;
  description: string | null;
}

export interface GradeSummaryTitle {
  designation_id: string;
  title: string;
  department_id: string | null;
  department: string | null;
  employee_count: number;
}

/** One grade's headcount for the `/api/hr/grades/summary` response (backend §3.3). Always present even when `employee_count` is 0 — an unfilled grade is a finding, not an absence. */
export interface GradeSummaryEntry {
  code: GradeCode;
  employee_count: number;
  titles: GradeSummaryTitle[];
  /** Department id (as string) → headcount on this grade. Departments with zero on the grade are omitted, not sent as 0. */
  by_department: Record<string, number>;
}

export interface GradeSummary {
  total_employees: number;
  grades: GradeSummaryEntry[];
}

/** Reference table — cached for the session, not refetched per render. */
export const useGrades = () => {
  const { data: grades, loading, error, refetch } = useCachedList(
    "grades",
    () => odooData.fetchGrades(),
    "Failed to load grades",
  );
  return { grades, loading, error, refetch };
};

/** Headcount + titles + department coverage for every grade, optionally scoped to one department. */
export const useGradeSummary = (departmentId?: string) => {
  const { data, loading, error, refetch } = useCachedList(
    `gradeSummary:${departmentId ?? "all"}`,
    async () => [await odooData.fetchGradeSummary(departmentId)],
    "Failed to load grade summary",
    [departmentId],
  );
  return { summary: data[0] ?? null, loading, error, refetch };
};
