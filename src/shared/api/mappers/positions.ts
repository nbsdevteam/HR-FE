import type { DbPosition } from "../../hooks";
import { sid, sornull, num, empty } from "./mapHelpers";

export const mapPosition = (r: any): DbPosition => {
  return {
    id: sid(r.id),
    title_ar: r.title_ar || r.name || "",
    title_en: r.name || r.title_en || null,
    department_id: sornull(r.department_id),
    reports_to_position_id: sornull(r.reports_to_job_id || r.reports_to_position_id),
    level: num(r.level),
    max_headcount: num(r.max_headcount),
    is_active: r.active !== false && r.is_active !== false,
    description: r.description || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
