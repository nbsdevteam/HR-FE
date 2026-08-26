import { mapPosition } from "./mappers";
import type { DbPosition } from "../hooks";
import { crudFactory, fetchList } from "./crud";
import { dedupeBy } from "../utils/collections";

const designations = crudFactory("/api/hr/designations");

export const fetchPositions = async (): Promise<DbPosition[]> => {
  const positions = await fetchList("/api/hr/designations/list", mapPosition, { limit: 200 });
  return dedupeBy(positions, p => p.id);
};

export const createDesignation = designations.create;
export const updateDesignation = designations.update;
export const deleteDesignation = designations.remove;
