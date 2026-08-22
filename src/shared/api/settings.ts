import { hrCall } from "./client";
import { mapModule, mapConfig, mapHoliday } from "./mappers";
import type { DbSystemModule, DbConfiguration, DbPublicHoliday } from "../hooks";
import { items, eid } from "./httpHelpers";

export const fetchModules = async (): Promise<DbSystemModule[]> => {
  const rows = await items<any>("/api/hr/modules/list");
  return rows.map(mapModule);
}

export const fetchConfigs = async (): Promise<DbConfiguration[]> => {
  const rows = await items<any>("/api/hr/configs/list");
  return rows.map(mapConfig);
}

export const fetchHolidays = async (year?: number): Promise<DbPublicHoliday[]> => {
  const params: Record<string, unknown> = { limit: 200 };
  if (year) params.year = year;
  const rows = await items<any>("/api/hr/holidays/list", params);
  return rows.map(mapHoliday);
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

export const createHoliday = async (payload: {
  name_ar?: string;
  name?: string;
  date: string;
}) => {
  return hrCall("/api/hr/holidays/create", {
    name: payload.name_ar || payload.name,
    name_ar: payload.name_ar,
    date: payload.date,
  });
}

export const deleteHoliday = async (holidayId: string | number) => {
  return hrCall(`/api/hr/holidays/${eid(holidayId)}/delete`, {});
}
