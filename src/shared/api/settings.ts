import { hrCall } from "./client";
import { mapModule, mapConfig, mapHoliday } from "./mappers";
import type { DbSystemModule, DbConfiguration, DbPublicHoliday } from "../hooks";
import { eid } from "./httpHelpers";
import { crudFactory, fetchList } from "./crud";

const holidays = crudFactory("/api/hr/holidays");

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
