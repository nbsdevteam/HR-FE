import { hrCall } from "./client";
import { items, eid } from "./httpHelpers";

export const fetchDevices = async (): Promise<any[]> => {
  return items<any>("/api/hr/devices/list", { limit: 100 });
}

export const syncDevices = async (deviceId?: string | number, processEvents = true) => {
  const params: Record<string, unknown> = { process_events: processEvents };
  if (deviceId != null) params.device_id = eid(deviceId);
  return hrCall("/api/hr/devices/sync", params);
}

export const processDeviceEvents = async (deviceId?: string | number, limit = 500) => {
  const params: Record<string, unknown> = { limit };
  if (deviceId != null) params.device_id = eid(deviceId);
  return hrCall("/api/hr/devices/events/process", params);
}

export const createDeviceEvent = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/devices/events/create", payload);
}

/** Raw punch ledger (lugal.hr.device.event). */
export const fetchDeviceEvents = async (filters?: {
  deviceId?: string | number;
  employeeNo?: string;
  dateFrom?: string;
  dateTo?: string;
  processed?: boolean;
  limit?: number;
}): Promise<any[]> => {
  const params: Record<string, unknown> = {
    limit: filters?.limit ?? 2000,
    offset: 0,
  };
  if (filters?.deviceId != null) params.device_id = eid(filters.deviceId);
  if (filters?.employeeNo) params.employee_no = filters.employeeNo;
  if (filters?.dateFrom) params.date_from = filters.dateFrom;
  if (filters?.dateTo) params.date_to = filters.dateTo;
  if (filters?.processed !== undefined) params.processed = filters.processed;
  return items<any>("/api/hr/devices/events/list", params);
}
