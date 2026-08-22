import { hrCall } from "./client";
import { mapPosition } from "./mappers";
import type { DbPosition } from "../hooks";
import { items, eid } from "./httpHelpers";

export const fetchPositions = async (): Promise<DbPosition[]> => {
  const rows = await items<any>("/api/hr/designations/list", { limit: 200 });
  return rows.map(mapPosition);
}

export const createDesignation = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/designations/create", payload);
}

export const updateDesignation = async (jobId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/designations/${eid(jobId)}/update`, payload);
}

export const deleteDesignation = async (jobId: string | number) => {
  return hrCall(`/api/hr/designations/${eid(jobId)}/delete`, {});
}
