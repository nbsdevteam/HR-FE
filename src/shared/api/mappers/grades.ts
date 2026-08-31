import type { DbGrade, GradeBand, GradeCode, GradeSummary, GradeSummaryEntry, GradeSummaryTitle } from "../../hooks";
import { sid, sornull, num } from "./mapHelpers";

export const mapGrade = (r: any): DbGrade => {
  return {
    id: sid(r.id),
    code: r.code as GradeCode,
    sequence: num(r.sequence),
    name: r.name || "",
    name_ar: r.name_ar || "",
    band: r.band as GradeBand,
    description: r.description ?? null,
  };
};

const mapGradeSummaryTitle = (r: any): GradeSummaryTitle => {
  return {
    designation_id: sid(r.designation_id),
    title: r.title || "",
    department_id: sornull(r.department_id),
    department: r.department || null,
    employee_count: num(r.employee_count),
  };
};

const mapGradeSummaryEntry = (r: any): GradeSummaryEntry => {
  const byDepartment: Record<string, number> = {};
  for (const [key, value] of Object.entries(r.by_department || {})) {
    byDepartment[key] = num(value);
  }
  return {
    code: r.code as GradeCode,
    employee_count: num(r.employee_count),
    titles: Array.isArray(r.titles) ? r.titles.map(mapGradeSummaryTitle) : [],
    by_department: byDepartment,
  };
};

export const mapGradeSummary = (r: any): GradeSummary => {
  return {
    total_employees: num(r.total_employees),
    grades: Array.isArray(r.grades) ? r.grades.map(mapGradeSummaryEntry) : [],
  };
};
