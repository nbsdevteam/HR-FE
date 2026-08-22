import type { DbConfiguration, DbSystemModule, DbPublicHoliday } from "../../hooks";
import { sid, num, bool, empty } from "./mapHelpers";

export const mapConfig = (r: any): DbConfiguration => {
  return {
    id: sid(r.id),
    config_key: r.config_key || "",
    config_value: r.config_value || "",
    value_type: r.value_type || "string",
    category: r.category || "",
    label_ar: r.label_ar || "",
    label_en: r.label_en || "",
    description_ar: r.description_ar || null,
    min_value: r.min_value ?? null,
    max_value: r.max_value ?? null,
    options: r.options || null,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapModule = (r: any): DbSystemModule => {
  return {
    id: sid(r.id),
    module_key: r.module_key || "",
    name_ar: r.name_ar || "",
    name_en: r.name_en || "",
    description_ar: r.description_ar || null,
    category: r.category || "",
    is_enabled: bool(r.is_enabled),
    icon: r.icon || null,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export const mapHoliday = (r: any): DbPublicHoliday => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name_en || r.name || null,
    date: r.date || "",
    year: num(r.year),
    is_recurring: bool(r.is_recurring),
    recurring_month: r.recurring_month ?? null,
    recurring_day: r.recurring_day ?? null,
    created_at: r.created_at || empty,
  };
}
