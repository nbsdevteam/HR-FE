import { hrCall } from "./client";
import { mapGrade, mapGradeSummary } from "./mappers";
import type { DbGrade, GradeSummary } from "../hooks";
import { fetchList } from "./crud";

/** The `hr.grade` reference table (backend §3.1) — seven rows, seeded once. */
export const fetchGrades = (): Promise<DbGrade[]> =>
  fetchList("/api/hr/grades/list", mapGrade, { limit: 50 });

/** Headcount + titles + department coverage for every grade (backend §3.2), optionally scoped to one department. */
export const fetchGradeSummary = (departmentId?: string): Promise<GradeSummary> =>
  hrCall("/api/hr/grades/summary", {
    department_id: departmentId ?? null,
    active_only: true,
  }).then(mapGradeSummary);
