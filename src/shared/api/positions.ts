import { mapPosition } from "./mappers";
import type { DbPosition } from "../hooks";
import { crudFactory, fetchList } from "./crud";

const designations = crudFactory("/api/hr/designations");

export const fetchPositions = (): Promise<DbPosition[]> =>
  fetchList("/api/hr/designations/list", mapPosition, { limit: 200 });

export const createDesignation = designations.create;
export const updateDesignation = designations.update;
export const deleteDesignation = designations.remove;
