import type {
  DbGrade,
  GradeBand,
  GradeCode,
  GradeSummary,
  GradeSummaryDepartment,
  GradeSummaryEntry,
  GradeSummaryTitle,
} from "../../hooks";
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
    title_ar: r.title_ar || "",
    department_id: sornull(r.department_id),
    department: r.department || null,
    employee_count: num(r.employee_count),
    seats: num(r.seats),
    vacancies: num(r.vacancies),
  };
};

/** Department id → count, with every value coerced. Used for both `by_department` and `seats_by_department`, which share a shape. */
const mapCountsByDepartment = (raw: unknown): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries((raw as Record<string, unknown>) || {})) {
    counts[key] = num(value);
  }
  return counts;
};

const mapGradeSummaryDepartment = (r: any): GradeSummaryDepartment => {
  return {
    id: sid(r.id),
    name: r.name || "",
  };
};

const mapGradeSummaryEntry = (r: any): GradeSummaryEntry => {
  return {
    code: r.code as GradeCode,
    employee_count: num(r.employee_count),
    titles: Array.isArray(r.titles) ? r.titles.map(mapGradeSummaryTitle) : [],
    by_department: mapCountsByDepartment(r.by_department),
    no_department: num(r.no_department),
    seats: num(r.seats),
    seats_by_department: mapCountsByDepartment(r.seats_by_department),
    no_department_seats: num(r.no_department_seats),
    vacancies: num(r.vacancies),
  };
};

export const mapGradeSummary = (r: any): GradeSummary => {
  return {
    grades: Array.isArray(r.grades) ? r.grades.map(mapGradeSummaryEntry) : [],
    departments: Array.isArray(r.departments) ? r.departments.map(mapGradeSummaryDepartment) : [],
    total_employees: num(r.total_employees),
    graded_employees: num(r.graded_employees),
    total_seats: num(r.total_seats),
    ungraded: {
      titles: Array.isArray(r.ungraded?.titles) ? r.ungraded.titles.map(mapGradeSummaryTitle) : [],
      employee_count: num(r.ungraded?.employee_count),
      seats: num(r.ungraded?.seats),
    },
    unassigned_employees: num(r.unassigned_employees),
  };
};
