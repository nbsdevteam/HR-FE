import { hrCall } from "./client";

export const items = async <T>(path: string, params: Record<string, unknown> = {}): Promise<T[]> => {
  const data = await hrCall<{ items?: T[] } | T[]>(path, params);
  if (Array.isArray(data)) return data;
  return (data?.items as T[]) || [];
};

export const eid = (id: string | number): number => {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error(`Invalid id: ${id}`);
  return n;
};
