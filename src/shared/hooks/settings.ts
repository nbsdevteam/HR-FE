import { useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { indexBy } from "@/shared/utils/collections";
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
    () => odooData.fetchShiftAssignments(),
    [],
    "Failed to load shift assignments",
    undefined,
    { cacheKey: "shiftAssignments" }
  );
  return { assignments, loading, refetch };
}

/*
 * The lookup helpers below are `useCallback`-stable and index their data once.
 *
 * They used to be plain closures rebuilt on every render, which silently broke
 * every consumer that memoized on them — a `useMemo` keyed on `getValue` re-ran
 * on each render, cascading through whole dashboards. They also did a linear
 * `.find()` per lookup, and these hooks are queried dozens of times per screen.
 */

export const useSystemModules = () => {
  const { data: modules, loading, refetch } = useAsyncList(() => odooData.fetchModules(), [], "Failed to load modules", undefined, { cacheKey: "systemModules" });

  const moduleIndex = useMemo(() => indexBy(modules, (m) => m.module_key), [modules]);

  const isEnabled = useCallback(
    (moduleKey: string): boolean => moduleIndex.get(moduleKey)?.is_enabled ?? false,
    [moduleIndex]
  );

  return { modules, loading, refetch, isEnabled };
}

export const useConfigurations = () => {
  const { data: configs, loading, refetch } = useAsyncList(() => odooData.fetchConfigs(), [], "Failed to load configurations", undefined, { cacheKey: "configurations" });

  const configIndex = useMemo(() => indexBy(configs, (c) => c.config_key), [configs]);

  const getValue = useCallback(
    (key: string, fallback: string = ""): string => configIndex.get(key)?.config_value ?? fallback,
    [configIndex]
  );

  const getNumber = useCallback(
    (key: string, fallback: number = 0): number => {
      const val = getValue(key, String(fallback));
      const n = parseFloat(val);
      return isNaN(n) ? fallback : n;
    },
    [getValue]
  );

  const getBool = useCallback(
    (key: string, fallback: boolean = false): boolean => {
      const val = getValue(key, String(fallback));
      return val === "true" || val === "1";
    },
    [getValue]
  );

  return { configs, loading, refetch, getValue, getNumber, getBool };
}

export const usePublicHolidays = (year?: number) => {
  const { data: holidays, loading, refetch } = useAsyncList(
    () => odooData.fetchHolidays(year),
    [year],
    "Failed to load holidays",
    undefined,
    { cacheKey: "holidays" }
  );

  const holidayIndex = useMemo(() => indexBy(holidays, (h) => h.date), [holidays]);

  const isHoliday = useCallback(
    (dateStr: string): boolean => holidayIndex.has(dateStr),
    [holidayIndex]
  );

  const getHolidayName = useCallback(
    (dateStr: string): string | null => holidayIndex.get(dateStr)?.name_ar ?? null,
    [holidayIndex]
  );

  return { holidays, loading, refetch, isHoliday, getHolidayName };
}
