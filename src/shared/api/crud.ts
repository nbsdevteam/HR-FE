/**
 * Generic helpers for the repeated "list + map" and "create/update/delete"
 * shapes hand-written across the shared/api domain files. Domain files keep
 * their own function names/signatures — these just remove the boilerplate
 * body.
 */
import { hrCall } from "./client";
import { eid, items } from "./httpHelpers";

/** `items<T>(path, params).then(rows => rows.map(mapper))`, in one call. */
export const fetchList = async <TRaw, TMapped>(
  path: string,
  mapper: (row: TRaw) => TMapped,
  params: Record<string, unknown> = {},
): Promise<TMapped[]> => {
  const rows = await items<TRaw>(path, params);
  return rows.map(mapper);
};

/**
 * Normalizes the given foreign-key fields on a payload through `eid()`
 * before sending it — mirrors the `if (params.x_id != null) params.x_id =
 * eid(...)` blocks repeated per-entity across payroll.ts/performance.ts/
 * lifecycle.ts/recruitment.ts/leave.ts.
 */
export const withEid = (
  payload: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> => {
  const next = { ...payload };
  for (const key of keys) {
    if (next[key] != null) next[key] = eid(next[key] as string | number);
  }
  return next;
};

/** The create → update → delete triplet, generated once per entity's base path. */
export const crudFactory = (basePath: string) => ({
  create: (payload: Record<string, unknown>) => hrCall(`${basePath}/create`, payload),
  update: (id: string | number, payload: Record<string, unknown>) =>
    hrCall(`${basePath}/${eid(id)}/update`, payload),
  remove: (id: string | number) => hrCall(`${basePath}/${eid(id)}/delete`, {}),
});
