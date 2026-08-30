import { hrCall } from "./client";
import { mapModule, mapConfig, mapHoliday } from "./mappers";
import type { DbSystemModule, DbConfiguration, DbPublicHoliday } from "../hooks";
import type { DeviceSyncState } from "./devices";
import { eid } from "./httpHelpers";
import { crudFactory, fetchList } from "./crud";

const holidays = crudFactory("/api/hr/holidays");

/** One section of the `/api/hr/settings/bootstrap` envelope — mirrors the standalone endpoint's own `{success, data}`/`{success:false, error, error_code}` shape exactly (backend §2). */
export interface SettingsBootstrapSection<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

type SettingsBootstrapListSection = SettingsBootstrapSection<{
  items: unknown[];
  total: number;
  limit: number;
  offset: number;
}>;

type SettingsBootstrapItemsSection = SettingsBootstrapSection<{ items: unknown[] }>;

/**
 * Aggregate of the 9 standalone Settings list reads, unchanged in shape —
 * each section is the *exact* return value of the endpoint it replaces,
 * nested under a key (backend §2 & 3). A single section failing its own
 * permission check does not fail the others.
 */
export interface SettingsBootstrap {
  departments: SettingsBootstrapListSection;
  modules: SettingsBootstrapItemsSection;
  configs: SettingsBootstrapItemsSection;
  holidays: SettingsBootstrapListSection;
  leave_types: SettingsBootstrapItemsSection;
  contract_types: SettingsBootstrapItemsSection;
  document_types: SettingsBootstrapItemsSection;
  shifts: SettingsBootstrapListSection;
  device_sync: SettingsBootstrapSection<DeviceSyncState>;
}

/**
 * Replaces 10 separate initial-load calls (`employees/list` dropped
 * entirely, the other 9 folded in here) with one request. `{}` reproduces
 * every call site's current hardcoded params exactly — see backend §2.
 */
export const fetchSettingsBootstrap = (): Promise<SettingsBootstrap> =>
  hrCall<SettingsBootstrap>("/api/hr/settings/bootstrap", {});

export const fetchModules = (): Promise<DbSystemModule[]> => fetchList("/api/hr/modules/list", mapModule);

export const fetchConfigs = (): Promise<DbConfiguration[]> => fetchList("/api/hr/configs/list", mapConfig);

export const fetchHolidays = (year?: number): Promise<DbPublicHoliday[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (year) params.year = year;
  return fetchList("/api/hr/holidays/list", mapHoliday, params);
}

export const updateConfig = async (configId: string | number, config_value: unknown) => {
  return hrCall("/api/hr/configs/update", {
    config_id: eid(configId),
    config_value,
  });
}

export const updateModule = async (moduleId: string | number, is_enabled: boolean) => {
  return hrCall("/api/hr/modules/update", {
    module_id: eid(moduleId),
    is_enabled,
  });
}

export const createHoliday = (payload: {
  name_ar?: string;
  name?: string;
  date: string;
}) =>
  holidays.create({
    name: payload.name_ar || payload.name,
    name_ar: payload.name_ar,
    date: payload.date,
  });

export const deleteHoliday = holidays.remove;
