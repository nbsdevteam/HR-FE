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
  /** Arabic label as stored on the designation — falls back to an empty string, never to the English title. */
  title_ar: string;
  department_id: string | null;
  department: string | null;
  employee_count: number;
  /** Budgeted establishment for this title (`hr.job.lugal_max_headcount`). */
  seats: number;
  vacancies: number;
}

/** One department entry from the summary envelope — the authoritative name list for the coverage matrix. */
export interface GradeSummaryDepartment {
  id: string;
  name: string;
}

/** Employees on a position that carries no grade. Zero today, but reappears the moment somebody creates an ungraded position. */
export interface GradeSummaryUngraded {
  titles: GradeSummaryTitle[];
  employee_count: number;
  seats: number;
}

/** One grade's headcount **and establishment** for the `/api/hr/grades/summary` response. Always present even when `employee_count` is 0 — an unfilled grade is a finding, not an absence. */
export interface GradeSummaryEntry {
  code: GradeCode;
  employee_count: number;
  titles: GradeSummaryTitle[];
  /** Department id (as string) → headcount on this grade. Departments with zero on the grade are omitted, not sent as 0. */
  by_department: Record<string, number>;
  /** Staff on this grade whose position has no department — `sum(by_department) + no_department === employee_count`. */
  no_department: number;
  /** Budgeted seats on this grade — the number to lead with, since it matches the establishment and does not drift. */
  seats: number;
  /** Department id (as string) → budgeted seats on this grade. */
  seats_by_department: Record<string, number>;
  no_department_seats: number;
  /** `max(0, seats - employee_count)` — never negative. */
  vacancies: number;
}

export interface GradeSummary {
  grades: GradeSummaryEntry[];
  departments: GradeSummaryDepartment[];
  total_employees: number;
  /** Employees who hold a graded position — the honest ladder denominator, unlike `total_employees`. */
  graded_employees: number;
  total_seats: number;
  ungraded: GradeSummaryUngraded;
  /** Employees holding no position at all. */
  unassigned_employees: number;
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
