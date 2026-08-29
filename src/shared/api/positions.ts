import { hrCall } from "./client";
import { mapPosition } from "./mappers";
import type { DbPosition } from "../hooks";
import { crudFactory, fetchList } from "./crud";
import { eid } from "./httpHelpers";
import { dedupeBy } from "../utils/collections";

export type DesignationListParams = {
  includeArchived?: boolean;
};

export type DesignationListResult = {
  items: DbPosition[];
  total: number;
};

export type DesignationDeleteResult = {
  id: number;
  deleted: boolean;
  active: boolean;
  employee_count?: number;
  report_count?: number;
};

const designations = crudFactory("/api/hr/designations");

export const fetchPositions = async (): Promise<DbPosition[]> => {
  const positions = await fetchList("/api/hr/designations/list", mapPosition, { limit: 200 });
  return dedupeBy(positions, p => p.id);
};

/** Full list for the org-structure admin screen — `include_archived` filter, plus `total` (backend §1). */
export const fetchDesignationsAdmin = async (params: DesignationListParams = {}): Promise<DesignationListResult> => {
  const data = await hrCall<{ items?: any[]; total?: number } | any[]>("/api/hr/designations/list", {
    limit: 200,
    include_archived: params.includeArchived,
  });
  const rows = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? rows.length : Number(data?.total) || rows.length;
  return { items: dedupeBy(rows.map(mapPosition), p => p.id), total };
};

export const fetchDesignation = async (designationId: string | number): Promise<DbPosition> => {
  const row = await hrCall<any>(`/api/hr/designations/${eid(designationId)}`, {});
  return mapPosition(row);
};

export const createDesignation = designations.create;
export const updateDesignation = designations.update;

/** Guarded archive — refused while the job title is still held or reported to unless `force: true` (backend §6). */
export const deleteDesignation = async (
  designationId: string | number,
  opts: { force?: boolean } = {},
): Promise<DesignationDeleteResult> => {
  return hrCall<DesignationDeleteResult>(`/api/hr/designations/${eid(designationId)}/delete`, { force: !!opts.force });
};

export const restoreDesignation = async (designationId: string | number): Promise<DbPosition> => {
  const row = await hrCall<any>(`/api/hr/designations/${eid(designationId)}/restore`, {});
  return mapPosition(row);
};
