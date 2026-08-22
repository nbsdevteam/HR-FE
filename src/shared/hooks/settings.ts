import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";

export interface DbSystemModule {
  id: string;
  module_key: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  category: string;
  is_enabled: boolean;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  value_type: string;
  category: string;
  label_ar: string;
  label_en: string;
    description_ar: string | null;
    description?: string | null;
    key?: string;
  min_value: number | null;
  max_value: number | null;
  options: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbPublicHoliday {
  id: string;
  name_ar: string;
  name_en: string | null;
  date: string;
  year: number;
  is_recurring: boolean;
  recurring_month: number | null;
  recurring_day: number | null;
  created_at: string;
}

export interface DbShiftAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  assigned_at: string;
}

export interface DbEmployeeShiftAssignment {
  id: string;
  employee_id: string;
  shift_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWeeklySchedule {
  id: string;
  employee_id: string;
  day_of_week: string;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
}

export const useEmployeeShiftAssignments = () => {
  const { data: assignments, loading, refetch } = useAsyncList(
    () => odooData.fetchShiftAssignments()
  );
  return { assignments, loading, refetch };
}

export const useSystemModules = () => {
  const { data: modules, loading, refetch } = useAsyncList(() => odooData.fetchModules());

  const isEnabled = (moduleKey: string): boolean => {
    const m = modules.find(mod => mod.module_key === moduleKey);
    return m?.is_enabled ?? false;
  };

  return { modules, loading, refetch, isEnabled };
}

export const useConfigurations = () => {
  const { data: configs, loading, refetch } = useAsyncList(() => odooData.fetchConfigs());

  const getValue = (key: string, fallback: string = ""): string => {
    const c = configs.find(cfg => cfg.config_key === key);
    return c?.config_value ?? fallback;
  };

  const getNumber = (key: string, fallback: number = 0): number => {
    const val = getValue(key, String(fallback));
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const getBool = (key: string, fallback: boolean = false): boolean => {
    const val = getValue(key, String(fallback));
    return val === "true" || val === "1";
  };

  return { configs, loading, refetch, getValue, getNumber, getBool };
}

export const usePublicHolidays = (year?: number) => {
  const { data: holidays, loading, refetch } = useAsyncList(
    () => odooData.fetchHolidays(year),
    [year]
  );

  const isHoliday = (dateStr: string): boolean => {
    return holidays.some(h => h.date === dateStr);
  };

  const getHolidayName = (dateStr: string): string | null => {
    const h = holidays.find(hol => hol.date === dateStr);
    return h?.name_ar ?? null;
  };

  return { holidays, loading, refetch, isHoliday, getHolidayName };
}
