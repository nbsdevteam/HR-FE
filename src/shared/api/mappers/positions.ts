import type { DbPosition } from "../../hooks";
import { sid, sornull, num, empty, isActive } from "./mapHelpers";

export const mapPosition = (r: any): DbPosition => {
  return {
    id: sid(r.id),
    legacy_id: r.legacy_id || "",
    title_ar: r.title_ar || r.name || "",
    title_en: r.name || r.title_en || null,
    department_id: sornull(r.department_id),
    department_name: r.department_name || null,
    reports_to_position_id: sornull(r.reports_to_job_id || r.reports_to_position_id),
    reports_to_job_name: r.reports_to_job_name || null,
    level: num(r.level),
    max_headcount: num(r.max_headcount),
    employee_count: num(r.employee_count),
    is_active: isActive(r),
    description: r.description || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
    grade_id: sornull(r.grade_id),
    grade_code: (r.grade_code ?? null) as DbPosition["grade_code"],
  };
}
